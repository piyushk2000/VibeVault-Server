import { Router } from 'express';
import prisma from '../database/prisma';
import { SuccessResponse, FailureResponse } from '../helpers/api-response';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json(SuccessResponse('Server and database are healthy', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    }));
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json(FailureResponse('Service unavailable', 'HEALTH_CHECK_FAILED'));
  }
});

// Database status endpoint
router.get('/db-status', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        current_setting('max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    ` as any[];

    res.json(SuccessResponse('Database status', {
      activeConnections: result[0]?.active_connections || 0,
      maxConnections: result[0]?.max_connections || 0,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Database status check failed:', error);
    res.status(503).json(FailureResponse('Unable to check database status', 'DB_STATUS_FAILED'));
  }
});

export default router;