import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Typography,
  Statistic,
  Divider,
  message,
  Spin,
} from 'antd';
import {
  CalculatorOutlined,
  DollarOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { costApi } from '@/api/cost';
import { CURRENCIES, MOTORCYCLE_TYPES } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import type { CostEstimateRequest, CostEstimateResponse } from '@/types';

const { Text, Title } = Typography;

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f'];

const CostCalculator = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CostEstimateResponse | null>(null);

  const ORIGIN_OPTIONS = [
    { value: 'Shenzhen, China', label: t('cost.originOptions.shenzhen') },
    { value: 'Shanghai, China', label: t('cost.originOptions.shanghai') },
    { value: 'Ningbo, China', label: t('cost.originOptions.ningbo') },
    { value: 'Guangzhou, China', label: t('cost.originOptions.guangzhou') },
  ];

  const DESTINATION_OPTIONS = [
    { value: 'Chittagong, Bangladesh', label: t('cost.destinationOptions.chittagong') },
    { value: 'Dhaka, Bangladesh', label: t('cost.destinationOptions.dhaka') },
    { value: 'Jakarta, Indonesia', label: t('cost.destinationOptions.jakarta') },
    { value: 'Bangkok, Thailand', label: t('cost.destinationOptions.bangkok') },
    { value: 'Ho Chi Minh, Vietnam', label: t('cost.destinationOptions.hoChiMinh') },
    { value: 'Manila, Philippines', label: t('cost.destinationOptions.manila') },
  ];

  const SHIPPING_METHODS = [
    { value: 'Sea Freight', label: t('cost.shippingMethods.sea') },
    { value: 'Air Freight', label: t('cost.shippingMethods.air') },
    { value: 'Rail Freight', label: t('cost.shippingMethods.rail') },
    { value: 'Truck', label: t('cost.shippingMethods.truck') },
  ];

  const handleCalculate = async (values: CostEstimateRequest) => {
    setLoading(true);
    try {
      const response = await costApi.estimate(values);
      setResult(response);
      message.success(t('cost.calculateSuccess'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('cost.calculateFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const pieData = result
    ? [
        { name: t('cost.shipping'), value: result.breakdown.shipping },
        { name: t('cost.customs'), value: result.breakdown.customs },
        { name: t('cost.handling'), value: result.breakdown.handling },
        { name: t('cost.insurance'), value: result.breakdown.insurance },
      ]
    : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={4} className="m-0">
          {t('cost.title')}
        </Title>
        <Text type="secondary">{t('cost.description')}</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <CalculatorOutlined className="mr-2" />
                {t('cost.params')}
              </span>
            }
            className="rounded-xl shadow-sm"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                currency: 'USD',
                motorcycleType: 'electric',
                quantity: 1,
                shippingMethod: 'Sea Freight',
              }}
              size="large"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="origin"
                    label={t('cost.origin')}
                    rules={[{ required: true, message: t('cost.originRequired') }]}
                  >
                    <Select
                      showSearch
                      placeholder={t('cost.origin')}
                      options={ORIGIN_OPTIONS}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="destination"
                    label={t('cost.destination')}
                    rules={[{ required: true, message: t('cost.destinationRequired') }]}
                  >
                    <Select
                      showSearch
                      placeholder={t('cost.destination')}
                      options={DESTINATION_OPTIONS}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="motorcycleType"
                    label={t('cost.motorcycleType')}
                    rules={[{ required: true, message: t('cost.typeRequired') }]}
                  >
                    <Select
                      options={MOTORCYCLE_TYPES.map((type) => ({
                        value: type,
                        label: type === 'electric' ? t('cost.electric') : t('cost.petrol'),
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="quantity"
                    label={t('cost.quantity')}
                    rules={[{ required: true, message: t('cost.quantityRequired') }]}
                  >
                    <InputNumber min={1} max={10000} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="shippingMethod"
                    label={t('cost.shippingMethod')}
                    rules={[{ required: true, message: t('cost.methodRequired') }]}
                  >
                    <Select options={SHIPPING_METHODS} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="currency"
                    label={t('cost.currency')}
                    rules={[{ required: true, message: t('cost.currencyRequired') }]}
                  >
                    <Select
                      options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CalculatorOutlined />}
                  size="large"
                  block
                  className="h-12 rounded-lg font-medium"
                >
                  {t('cost.calculate')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <DollarOutlined className="mr-2" />
                {t('cost.result')}
              </span>
            }
            className="rounded-xl shadow-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <Spin size="large" tip={t('cost.calculating')} />
              </div>
            ) : result ? (
              <>
                <div className="text-center mb-6">
                  <Text type="secondary" className="text-sm">
                    {t('cost.totalEstimate')}
                  </Text>
                  <div className="text-3xl font-bold text-primary-600 mt-1">
                    {formatCurrency(result.totalCost, result.currency)}
                  </div>
                  <Text type="secondary" className="text-xs">
                    {t('cost.exchangeRate', { rate: result.exchangeRate })}
                  </Text>
                </div>

                <Divider />

                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={12}>
                    <Statistic
                      title={t('cost.shipping')}
                      value={result.breakdown.shipping}
                      prefix="$"
                      precision={2}
                      valueStyle={{ fontSize: 18, color: '#1677ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('cost.customs')}
                      value={result.breakdown.customs}
                      prefix="$"
                      precision={2}
                      valueStyle={{ fontSize: 18, color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('cost.handling')}
                      value={result.breakdown.handling}
                      prefix="$"
                      precision={2}
                      valueStyle={{ fontSize: 18, color: '#faad14' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('cost.insurance')}
                      value={result.breakdown.insurance}
                      prefix="$"
                      precision={2}
                      valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>

                <Divider />

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          formatCurrency(value, result.currency)
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                <SwapOutlined className="text-5xl mb-4" />
                <Text type="secondary">{t('cost.noResult')}</Text>
                <Text type="secondary" className="text-sm">
                  {t('cost.noResultHint')}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CostCalculator;
