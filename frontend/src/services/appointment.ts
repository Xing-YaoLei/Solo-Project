import request from './request';
import type { VehicleInfo, AppointmentSource } from '@/types';
import { mockVehicles, mockAppointments } from '@/mock/data';

const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

export const vehicleApi = {
  async getList(params?: { keyword?: string }): Promise<VehicleInfo[]> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockVehicles];
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter(item =>
          item.plateNumber.toLowerCase().includes(lower) ||
          item.ownerName.includes(params.keyword!) ||
          item.vinNumber.toLowerCase().includes(lower) ||
          item.brand.includes(params.keyword!)
        );
      }
      return result;
    }
    return request.get('/api/vehicles', { params });
  },

  async getById(id: number): Promise<VehicleInfo | null> {
    if (USE_MOCK) {
      await delay(200);
      return mockVehicles.find(v => v.id === id) || null;
    }
    return request.get(`/api/vehicles/${id}`);
  },

  async create(data: CreateVehiclePayload): Promise<VehicleInfo> {
    if (USE_MOCK) {
      await delay(300);
      const newVehicle: VehicleInfo = {
        id: Date.now(),
        plateNumber: data.plateNumber,
        vinNumber: data.vinNumber,
        brand: data.brand,
        model: data.model,
        mileage: data.mileage,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        lastMaintenanceDate: data.lastMaintenanceDate,
        repairCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockVehicles.push(newVehicle);
      return newVehicle;
    }
    return request.post('/api/vehicles', data);
  },
};

export const appointmentApi = {
  async getList(params?: {
    status?: any;
    keyword?: string;
  }): Promise<any[]> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockAppointments];
      if (params?.status) {
        result = result.filter((item: any) => item.status === params.status);
      }
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter((item: any) =>
          item.vehicle?.plateNumber.toLowerCase().includes(lower) ||
          item.appointmentNo.toLowerCase().includes(lower) ||
          item.vehicle?.ownerName.includes(params!.keyword!)
        );
      }
      return result.map((item: any) => ({
        id: item.id,
        appointmentNo: item.appointmentNo,
        vehicleId: item.vehicleId,
        plateNumber: item.vehicle?.plateNumber || '',
        ownerName: item.vehicle?.ownerName || '',
        brand: item.vehicle?.brand,
        model: item.vehicle?.model,
        appointmentTime: item.appointmentTime,
        checkInTime: item.checkInTime,
        source: item.source,
        personInCharge: item.personInCharge,
        status: item.status,
        faultDescription: item.faultDescription,
      }));
    }
    return request.get('/api/appointments', { params });
  },

  async getById(id: number): Promise<any> {
    if (USE_MOCK) {
      await delay(200);
      return mockAppointments.find((item: any) => item.id === id) || null;
    }
    return request.get(`/api/appointments/${id}`);
  },

  async create(data: CreateAppointmentPayload): Promise<any> {
    if (USE_MOCK) {
      await delay(300);
      const vehicle = mockVehicles.find((v: any) => v.id === data.vehicleId);
      const now = new Date();
      const yy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const appointmentNo = `YY${yy}${mm}${dd}${rand}`;

      const newAppointment: any = {
        id: Date.now(),
        appointmentNo,
        vehicleId: data.vehicleId,
        vehicle,
        appointmentTime: data.appointmentTime,
        source: data.source,
        personInCharge: data.personInCharge,
        faultDescription: data.faultDescription,
        remarks: data.remarks,
        status: 'Pending',
        checkInTime: null,
        completionTime: null,
        closeTime: null,
        quote: {
          id: Date.now() + 1,
          appointmentId: Date.now(),
          appointmentNo,
          laborCost: 0,
          partsCost: 0,
          totalAmount: 0,
          status: 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          quoteItems: [],
        },
        photos: [],
        partsShortages: [],
        serviceRecords: [],
        historyRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAppointments.unshift(newAppointment);
      return newAppointment;
    }
    return request.post('/api/appointments', data);
  },

  async updateStatus(id: number, status: any, remarks?: string): Promise<any> {
    if (USE_MOCK) {
      await delay(200);
      const appointment: any = mockAppointments.find((item: any) => item.id === id);
      if (appointment) {
        appointment.status = status;
        appointment.updatedAt = new Date().toISOString();
        if (remarks) appointment.remarks = remarks;
        if (status === 'InService' && !appointment.checkInTime) {
          appointment.checkInTime = new Date().toISOString();
        }
        if (status === 'Completed') {
          appointment.completionTime = new Date().toISOString();
        }
        if (status === 'Closed') {
          appointment.closeTime = new Date().toISOString();
        }
        return appointment;
      }
      return null;
    }
    return request.put(`/api/appointments/${id}/status`, { status, remarks });
  },

  async checkIn(id: number): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'InService');
    return request.put(`/api/appointments/${id}/checkin`);
  },

  async complete(id: number): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'Completed');
    return request.put(`/api/appointments/${id}/complete`);
  },

  async close(id: number, remarks?: string): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'Closed', remarks);
    return request.put(`/api/appointments/${id}/close`, { remarks });
  },

  async reopen(id: number): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'InService');
    return request.put(`/api/appointments/${id}/reopen`);
  },

  async reportPartsShortage(id: number, data: any): Promise<any> {
    if (USE_MOCK) {
      await delay(200);
      const appointment: any = mockAppointments.find((item: any) => item.id === id);
      if (appointment) {
        appointment.status = 'PartsShortage';
        appointment.partsShortages = appointment.partsShortages || [];
        appointment.partsShortages.push({
          id: Date.now(),
          appointmentId: id,
          appointmentNo: appointment.appointmentNo,
          partsId: data.partsId,
          partName: data.partName,
          partCode: data.partCode,
          shortageQuantity: data.shortageQuantity,
          expectedArrivalTime: data.expectedArrivalTime,
          status: 'Pending',
          handler: data.handler || '当前用户',
          remarks: data.remarks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return appointment;
      }
      throw new Error('Appointment not found');
    }
    return request.post(`/api/appointments/${id}/parts-shortage`, data);
  },

  async resolvePartsShortage(appointmentId: number, shortageId: number): Promise<any> {
    if (USE_MOCK) {
      await delay(200);
      const appointment: any = mockAppointments.find((item: any) => item.id === appointmentId);
      if (appointment && appointment.partsShortages) {
        const shortage = appointment.partsShortages.find((s: any) => s.id === shortageId);
        if (shortage) {
          shortage.status = 'Arrived';
          shortage.actualArrivalTime = new Date().toISOString();
        }
        const allResolved = appointment.partsShortages.every((s: any) => s.status !== 'Pending');
        if (allResolved) appointment.status = 'InService';
        return appointment;
      }
      throw new Error('Appointment not found');
    }
    return request.put(`/api/appointments/${appointmentId}/parts-shortage/${shortageId}/resolve`);
  },

  async supplementData(id: number, remarks?: string): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'InService', remarks);
    return request.put(`/api/appointments/${id}/supplement-data`, { remarks });
  },

  async requestReview(id: number, remarks?: string): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, 'ReviewRequired', remarks);
    return request.put(`/api/appointments/${id}/request-review`, { remarks });
  },

  async processReview(id: number, approved: boolean, remarks?: string): Promise<any> {
    if (USE_MOCK) return this.updateStatus(id, approved ? 'InService' : 'PartsShortage', remarks);
    return request.put(`/api/appointments/${id}/process-review`, { approved, remarks });
  },

  async updateQuote(id: number, quote: any): Promise<any> {
    if (USE_MOCK) {
      await delay(200);
      const appointment: any = mockAppointments.find((item: any) => item.id === id);
      if (appointment) {
        appointment.quote = quote;
        appointment.updatedAt = new Date().toISOString();
        return appointment;
      }
      return null;
    }
    return request.put(`/api/appointments/${id}/quote`, quote);
  },
};

export default { vehicleApi, appointmentApi };
