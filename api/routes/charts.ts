import { Router, Request, Response } from 'express';
import {
  mockMeterReadings,
  mockInspectionItems,
  mockPaymentFlows,
  mockComplaintTags,
  mockPropertyRanking,
  filterByRole,
} from '../mock/data.js';
import type {
  ApiResponse,
  PaginatedResponse,
  MeterReading,
  InspectionItem,
  PaymentFlow,
  ComplaintTag,
  PropertyRanking,
} from '../../shared/types.js';

const router = Router();

router.get('/meter-readings', (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string;
  const role = req.query.role as string;
  const area = req.query.area as string;
  const months = parseInt(req.query.months as string) || 6;

  let data = mockMeterReadings.filter((_, i) => i % 6 < months);
  
  if (propertyId) {
    data = data.filter((item) => item.propertyId === propertyId);
  }

  data = data.map((item) => ({
    ...item,
    updateTime: new Date().toISOString(),
  }));

  const filteredData = filterByRole(data, role, area);

  const response: ApiResponse<MeterReading[]> = {
    code: 200,
    data: filteredData,
    message: 'success',
  };

  res.json(response);
});

router.get('/inspection-items', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const area = req.query.area as string;

  const data = mockInspectionItems.map((item) => ({
    ...item,
    updateTime: new Date().toISOString(),
  }));

  const filteredData = filterByRole(data, role, area);

  const response: ApiResponse<InspectionItem[]> = {
    code: 200,
    data: filteredData,
    message: 'success',
  };

  res.json(response);
});

router.get('/payment-flows', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const startTime = req.query.startTime as string;
  const endTime = req.query.endTime as string;
  const propertyId = req.query.propertyId as string;
  const role = req.query.role as string;
  const area = req.query.area as string;

  let data = [...mockPaymentFlows];

  if (startTime) {
    data = data.filter((item) => item.paymentTime >= startTime);
  }
  if (endTime) {
    data = data.filter((item) => item.paymentTime <= endTime);
  }
  if (propertyId) {
    data = data.filter((item) => item.propertyId === propertyId);
  }

  data = filterByRole(data, role, area);

  const total = data.length;
  const start = (page - 1) * pageSize;
  const list = data.slice(start, start + pageSize).map((item) => ({
    ...item,
    updateTime: new Date().toISOString(),
  }));

  const response: ApiResponse<PaginatedResponse<PaymentFlow>> = {
    code: 200,
    data: { list, total, page, pageSize },
    message: 'success',
  };

  res.json(response);
});

router.get('/complaint-tags', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const area = req.query.area as string;

  const data = mockComplaintTags.map((item) => ({
    ...item,
    updateTime: new Date().toISOString(),
  }));

  const filteredData = filterByRole(data, role, area);

  const response: ApiResponse<ComplaintTag[]> = {
    code: 200,
    data: filteredData,
    message: 'success',
  };

  res.json(response);
});

router.get('/property-ranking', (req: Request, res: Response) => {
  const metric = (req.query.metric as string) || 'repair';
  const mode = (req.query.mode as 'absolute' | 'ratio') || 'absolute';
  const role = req.query.role as string;
  const area = req.query.area as string;

  let data = [...mockPropertyRanking];

  if (metric === 'repair') {
    data.sort((a, b) =>
      mode === 'absolute' ? b.repairCount - a.repairCount : b.repairRate - a.repairRate
    );
  } else {
    data.sort((a, b) =>
      mode === 'absolute'
        ? b.complaintCount - a.complaintCount
        : b.complaintRate - a.complaintRate
    );
  }

  data = data.map((item) => ({
    ...item,
    updateTime: new Date().toISOString(),
  }));

  const filteredData = filterByRole(data, role, area);

  const response: ApiResponse<PropertyRanking[]> = {
    code: 200,
    data: filteredData,
    message: 'success',
  };

  res.json(response);
});

export default router;
