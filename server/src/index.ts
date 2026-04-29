import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import shipmentRoutes from './routes/shipments';
import costRoutes from './routes/cost';
import documentRoutes from './routes/documents';
import alertRoutes from './routes/alerts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/cost', costRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/alerts', alertRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EBike Logistics Server running on http://localhost:${PORT}`);
  console.log(`📦 API base: http://localhost:${PORT}/api/v1`);
});

export default app;
