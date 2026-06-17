import { Router, Request, Response } from 'express';
import { mockMetrics } from '../mock/data.js';
import type { ApiResponse, DashboardMetrics } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const area = req.query.area as string;

  const metrics: DashboardMetrics = {
    ...mockMetrics,
    updateTime: new Date().toISOString(),
  };

  if (role === 'area_manager' && area) {
    metrics.moveOutRate = parseFloat((mockMetrics.moveOutRate * 0.9).toFixed(1));
    metrics.inspectionPassRate = parseFloat((mockMetrics.inspectionPassRate * 1.02).toFixed(1));
  }

  const response: ApiResponse<DashboardMetrics> = {
    code: 200,
    data: metrics,
    message: 'success',
  };

  res.json(response);
});

export default router;
