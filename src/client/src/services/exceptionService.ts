import api from './api';
import type {
  ExceptionRecordListDto,
  ExceptionRecordDetailDto,
  CreateExceptionRecordDto,
  UpdateExceptionRecordDto,
  ExceptionStatusChangeDto,
  ExceptionAttachmentDto,
  ExceptionQueryDto,
  PagedResultDto,
} from '@/types';

export const exceptionService = {
  getList: (query?: ExceptionQueryDto): Promise<PagedResultDto<ExceptionRecordListDto>> => {
    return api.get('/exceptions', { params: query });
  },

  getById: (id: string): Promise<ExceptionRecordDetailDto> => {
    return api.get(`/exceptions/${id}`);
  },

  create: (dto: CreateExceptionRecordDto): Promise<ExceptionRecordDetailDto> => {
    return api.post('/exceptions', dto);
  },

  update: (id: string, dto: UpdateExceptionRecordDto): Promise<ExceptionRecordDetailDto> => {
    return api.put(`/exceptions/${id}`, dto);
  },

  assignHandler: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/assign`, dto);
  },

  startInvestigation: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/investigate`, dto);
  },

  startHandling: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/handle`, dto);
  },

  resolve: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/resolve`, dto);
  },

  requestSupplement: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/supplement/request`, dto);
  },

  submitSupplement: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/supplement/submit`, dto);
  },

  escalate: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/escalate`, dto);
  },

  closeNormal: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/close/normal`, dto);
  },

  closeWithSupplement: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/close/supplement`, dto);
  },

  closeEscalated: (id: string, dto: ExceptionStatusChangeDto): Promise<ExceptionRecordDetailDto> => {
    return api.post(`/exceptions/${id}/close/escalated`, dto);
  },

  addAttachment: (id: string, dto: ExceptionAttachmentDto): Promise<ExceptionAttachmentDto> => {
    return api.post(`/exceptions/${id}/attachments`, dto);
  },
};
