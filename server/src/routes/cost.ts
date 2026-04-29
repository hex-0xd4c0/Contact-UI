import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const estimateSchema = z.object({
  origin: z.string().min(1, '请选择始发地'),
  destination: z.string().min(1, '请选择目的地'),
  motorcycleType: z.enum(['electric', 'petrol'], {
    errorMap: () => ({ message: '请选择摩托车类型' }),
  }),
  quantity: z.number().int().min(1, '数量至少为1'),
  shippingMethod: z.string().min(1, '请选择运输方式'),
  currency: z.string().length(3, '请选择结算货币'),
});

// POST /cost/estimate
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const params = estimateSchema.parse(req.body);

    // Build cache key
    const cacheKey = `cost:rate:${params.origin}_${params.destination}_${params.shippingMethod}`;

    // Try cache first
    const cached = await getCache<any>(cacheKey);
    let rateData = cached;

    if (!rateData) {
      // Query shipping rates from database
      const result = await query(
        `SELECT base_rate, surcharge_rate
         FROM shipping_rates
         WHERE origin_region ILIKE $1
           AND dest_region ILIKE $2
           AND transport_method = $3
           AND is_active = true
         LIMIT 1`,
        [`%${params.origin.split(',')[0]}%`, `%${params.destination.split(',')[0]}%`, params.shippingMethod]
      );

      if (result.rows.length > 0) {
        rateData = result.rows[0];
        // Cache for 1 hour
        await setCache(cacheKey, rateData, 3600);
      }
    }

    // Calculate costs
    let baseRate = parseFloat(rateData?.base_rate) || 150; // Default rate if not found
    const quantity = params.quantity;

    // Apply quantity discount
    let shippingCost = baseRate * quantity;
    if (quantity >= 100) shippingCost *= 0.85; // 15% discount for bulk
    else if (quantity >= 50) shippingCost *= 0.9; // 10% discount
    else if (quantity >= 10) shippingCost *= 0.95; // 5% discount

    // Calculate other costs
    const customsCost = baseRate * quantity * 0.24; // ~24% of shipping for customs
    const handlingCost = 20 * quantity + 200; // $20 per unit + base fee
    const insuranceCost = shippingCost * 0.03; // 3% of shipping cost

    // Currency conversion (simplified)
    const exchangeRates: Record<string, number> = {
      USD: 1,
      CNY: 7.15,
      EUR: 0.92,
    };
    const exchangeRate = exchangeRates[params.currency] || 1;

    const totalCost = Math.round((shippingCost + customsCost + handlingCost + insuranceCost) * exchangeRate * 100) / 100;

    res.json({
      totalCost,
      currency: params.currency,
      breakdown: {
        shipping: Math.round(shippingCost * exchangeRate * 100) / 100,
        customs: Math.round(customsCost * exchangeRate * 100) / 100,
        handling: Math.round(handlingCost * exchangeRate * 100) / 100,
        insurance: Math.round(insuranceCost * exchangeRate * 100) / 100,
      },
      exchangeRate,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    console.error('Cost estimate error:', error);
    res.status(500).json({ message: '费用估算失败' });
  }
});

export default router;
