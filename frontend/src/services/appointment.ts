import request from './request';
import type { VehicleInfo, AppointmentSource, PhotoType } from '@/types';

export interface CreateVehiclePayload {
  plateNumber: string;
  vinNumber: string;
  brand: string;
  model: string;
  ownerName: string;
  ownerPhone: string;
  mileage: number;
  lastMaintenanceDate?: string;
}

export interface CreateAppointmentPayload {
  vehicleId: number;
  appointmentTime: string;
  source: AppointmentSource;
  personInCharge?: string;
  faultDescription?: string;
  remarks?: string;
}

export interface UploadPhotoPayload {
  appointmentId: number;
  photoUrl: string;
  photoType: PhotoType;
  uploader?: string;
  remarks?: string;
}

export interface SaveQuotePayload {
  appointmentId: number;
  remarks?: string;
  quoteItems: Array<{
    id?: number;
    name: string;
    type: 'Labor' | 'Parts';
    quantity: number;
    unitPrice: number;
    remarks?: string;
  }>;
}

export const vehicleApi = {
  getList(params?: { keyword?: string }): Promise<VehicleInfo[]> {
    return request.get('/vehicles', { params });
  },

  getById(id: number): Promise<VehicleInfo> {
    return request.get(`/vehicles/${id}`);
  },

  getByPlateNumber(plateNumber: string): Promise<VehicleInfo> {
    return request.get(`/vehicles/by-plate/${encodeURIComponent(plateNumber)}`);
  },

  create(data: CreateVehiclePayload): Promise<VehicleInfo> {
    return request.post('/vehicles', data);
  },

  update(id: number, data: Partial<CreateVehiclePayload>): Promise<VehicleInfo> {
    return request.put(`/vehicles/${id}`, data);
  },

  remove(id: number): Promise<void> {
    return request.delete(`/vehicles/${id}`);
  },
};

export const appointmentApi = {
  getList(params?: {
    status?: any;
    keyword?: string;
  }): Promise<any[]> {
    return request.get('/appointments/list', { params });
  },

  getPaged(params?: any): Promise<any> {
    return request.get('/appointments', { params });
  },

  getById(id: number): Promise<any> {
    return request.get(`/appointments/${id}`);
  },

  getDetail(id: number): Promise<any> {
    return request.get(`/appointments/${id}/detail`);
  },

  create(data: CreateAppointmentPayload): Promise<any> {
    return request.post('/appointments', data);
  },

  update(id: number, data: any): Promise<any> {
    return request.put(`/appointments/${id}`, data);
  },

  remove(id: number): Promise<void> {
    return request.delete(`/appointments/${id}`);
  },

  changeStatus(id: number, status: any, remarks?: string): Promise<any> {
    return request.put(`/appointments/${id}/status`, { status, remarks });
  },

  updateStatus(id: number, status: any, remarks?: string): Promise<any> {
    return this.changeStatus(id, status, remarks);
  },

  checkIn(id: number): Promise<any> {
    return request.put(`/appointments/${id}/checkin`);
  },

  complete(id: number): Promise<any> {
    return request.put(`/appointments/${id}/complete`);
  },

  close(id: number, remarks?: string): Promise<any> {
    return request.put(`/appointments/${id}/close`, { remarks });
  },

  reopen(id: number): Promise<any> {
    return request.put(`/appointments/${id}/reopen`);
  },

  reportPartsShortage(id: number, data: any): Promise<any> {
    return request.post(`/appointments/${id}/parts-shortage`, data);
  },

  getPartsShortages(id: number): Promise<any[]> {
    return request.get(`/appointments/${id}/parts-shortage`);
  },

  resolvePartsShortage(appointmentId: number, shortageId: number): Promise<any> {
    return request.put(`/appointments/${appointmentId}/parts-shortage/${shortageId}/resolve`);
  },

  supplementData(id: number, remarks?: string): Promise<any> {
    return request.put(`/appointments/${id}/supplement-data`, { remarks });
  },

  requestReview(id: number, remarks?: string): Promise<any> {
    return request.post(`/appointments/${id}/request-review`, remarks ?? '');
  },

  processReview(id: number, approved: boolean, remarks?: string): Promise<any> {
    return request.post(`/appointments/${id}/process-review`, { approved, remarks });
  },
};

export const quoteApi = {
  getByAppointment(appointmentId: number): Promise<any[]> {
    return request.get(`/quotes/appointment/${appointmentId}`);
  },

  create(payload: SaveQuotePayload): Promise<any> {
    return request.post('/quotes', payload);
  },

  update(id: number, payload: SaveQuotePayload): Promise<any> {
    return request.put(`/quotes/${id}`, payload);
  },

  confirm(id: number): Promise<any> {
    return request.put(`/quotes/${id}/confirm`);
  },

  reject(id: number): Promise<any> {
    return request.put(`/quotes/${id}/reject`);
  },

  remove(id: number): Promise<void> {
    return request.delete(`/quotes/${id}`);
  },
};

export const inspectionApi = {
  getByAppointment(appointmentId: number, photoType?: PhotoType): Promise<any[]> {
    return request.get(`/inspection/appointment/${appointmentId}`, {
      params: photoType ? { photoType } : undefined,
    });
  },

  upload(payload: UploadPhotoPayload): Promise<any> {
    return request.post('/inspection', payload);
  },

  remove(id: number): Promise<void> {
    return request.delete(`/inspection/${id}`);
  },
};

export default { vehicleApi, appointmentApi, quoteApi, inspectionApi };
