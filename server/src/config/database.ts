import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ebike_logistics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] Query executed in ${duration}ms | rows: ${result.rowCount}`);
  }
  return result;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    console.log('[DB] Database connection established successfully');
    return true;
  } catch (err) {
    console.error('[DB] Database connection failed:', err);
    return false;
  }
};

export default pool;
