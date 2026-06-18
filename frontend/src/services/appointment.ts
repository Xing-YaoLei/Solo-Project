import request from './request';
import type {
  Appointment,
  AppointmentDetail,
  AppointmentListItem,
  AppointmentStatus,
  PagedResult,
} from '@/types';
import { mockAppointments } from '@/mock/data';

const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const appointmentApi = {
  async getList(params?: {
    status?: AppointmentStatus;
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<AppointmentListItem[]> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockAppointments];
      if (params?.status) {
        result = result.filter(item => item.status === params.status);
      }
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter(item =>
          item.vehicle?.plateNumber.toLowerCase().includes(lower) ||
          item.appointmentNo.toLowerCase().includes(lower) ||
          item.vehicle?.ownerName.includes(params.keyword!)
        );
      }
      return result.map(item => ({
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
    return request.get('/appointments/list', { params });
  },

  async getPaged(params?: {
    status?: AppointmentStatus;
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<PagedResult<AppointmentListItem>> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockAppointments];
      if (params?.status) {
        result = result.filter(item => item.status === params.status);
      }
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter(item =>
          item.vehicle?.plateNumber.toLowerCase().includes(lower) ||
          item.appointmentNo.toLowerCase().includes(lower) ||
          item.vehicle?.ownerName.includes(params.keyword!)
        );
      }
      const items = result.map(item => ({
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
      return {
        items,
        totalCount: items.length,
        pageIndex: params?.pageIndex || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.ceil(items.length / (params?.pageSize || 20)),
      };
    }
    return request.get('/appointments', { params });
  },

  async getById(id: number): Promise<AppointmentDetail | null> {
    if (USE_MOCK) {
      await delay(200);
      const found = mockAppointments.find(item => item.id === id);
      return found || null;
    }
    return request.get(`/appointments/${id}/detail`);
  },

  async create(data: any): Promise<Appointment> {
    if (USE_MOCK) {
      await delay(300);
      const newAppointment: any = {
        ...data,
        id: Date.now(),
        appointmentNo: 'AP' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAppointments.unshift(newAppointment);
      return newAppointment;
    }
    return request.post('/appointments', data);
  },

  async update(id: number, data: any): Promise<Appointment> {
    if (USE_MOCK) {
      await delay(200);
      const index = mockAppointments.findIndex(item => item.id === id);
      if (index > -1) {
        mockAppointments[index] = { ...mockAppointments[index], ...data };
        return mockAppointments[index];
      }
      throw new Error('Appointment not found');
    }
    return request.put(`/appointments/${id}`, data);
  },

  async updateStatus(id: number, status: AppointmentStatus, remarks?: string): Promise<AppointmentDetail | null> {
    if (USE_MOCK) {
      await delay(200);
      const appointment = mockAppointments.find(item => item.id === id) as any;
      if (appointment) {
        appointment.status = status;
        appointment.updatedAt = new Date().toISOString();
        if (remarks) {
          appointment.remarks = remarks;
        }
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
    return request.put(`/appointments/${id}/status`, { status, remarks });
  },

  async checkIn(id: number): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'InService') as any;
    }
    return request.put(`/appointments/${id}/checkin`);
  },

  async complete(id: number): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'Completed') as any;
    }
    return request.put(`/appointments/${id}/complete`);
  },

  async close(id: number, remarks?: string): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'Closed', remarks) as any;
    }
    return request.put(`/appointments/${id}/close`, { remarks });
  },

  async reopen(id: number): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'InService') as any;
    }
    return request.put(`/appointments/${id}/reopen`);
  },

  async reportPartsShortage(id: number, data: any): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      await delay(200);
      const appointment = mockAppointments.find(item => item.id === id) as any;
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
    return request.post(`/appointments/${id}/parts-shortage`, data);
  },

  async resolvePartsShortage(appointmentId: number, shortageId: number): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      await delay(200);
      const appointment = mockAppointments.find(item => item.id === appointmentId) as any;
      if (appointment && appointment.partsShortages) {
        const shortage = appointment.partsShortages.find((s: any) => s.id === shortageId);
        if (shortage) {
          shortage.status = 'Arrived';
          shortage.actualArrivalTime = new Date().toISOString();
        }
        const allResolved = appointment.partsShortages.every((s: any) => s.status !== 'Pending');
        if (allResolved) {
          appointment.status = 'InService';
        }
        return appointment;
      }
      throw new Error('Appointment not found');
    }
    return request.put(`/appointments/${appointmentId}/parts-shortage/${shortageId}/resolve`);
  },

  async supplementData(id: number, remarks?: string): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'InService', remarks) as any;
    }
    return request.put(`/appointments/${id}/supplement-data`, { remarks });
  },

  async requestReview(id: number, remarks?: string): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, 'ReviewRequired', remarks) as any;
    }
    return request.put(`/appointments/${id}/request-review`, { remarks });
  },

  async processReview(id: number, approved: boolean, remarks?: string): Promise<AppointmentDetail> {
    if (USE_MOCK) {
      return this.updateStatus(id, approved ? 'InService' : 'PartsShortage', remarks) as any;
    }
    return request.put(`/appointments/${id}/process-review`, { approved, remarks });
  },

  async updateQuote(id: number, quote: any): Promise<AppointmentDetail | null> {
    if (USE_MOCK) {
      await delay(200);
      const appointment = mockAppointments.find(item => item.id === id) as any;
      if (appointment) {
        appointment.quote = quote;
        appointment.updatedAt = new Date().toISOString();
        return appointment;
      }
      return null;
    }
    return request.put(`/appointments/${id}/quote`, quote);
  },
};

export default appointmentApi;
