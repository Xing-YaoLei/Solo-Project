import { useState, useEffect } from 'react';
import { Row, Col, message, Spin } from 'antd';
import AppointmentList from '@/components/AppointmentList';
import VehicleCard from '@/components/VehicleCard';
import QuoteEditor from '@/components/QuoteEditor';
import PhotoGallery from '@/components/PhotoGallery';
import ActionBar from '@/components/ActionBar';
import type { AppointmentDetail, AppointmentListItem, AppointmentStatus, Quote, PhotoType, PhotoRecord } from '@/types';
import { appointmentApi, quoteApi, inspectionApi } from '@/services/appointment';

export default function ScheduleDashboard() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshDetail = async (id: number) => {
    try {
      const detail = await appointmentApi.getById(id);
      if (detail) {
        setSelectedAppointment(detail);
      }
    } catch (error) {
      message.error('刷新预约单详情失败');
    }
  };

  const handleSelect = async (appointment: AppointmentListItem) => {
    setLoading(true);
    try {
      const detail = await appointmentApi.getById(appointment.id);
      if (detail) {
        setSelectedAppointment(detail);
      }
    } catch (error) {
      message.error('获取预约单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus, remark?: string) => {
    if (!selectedAppointment) return;
    
    setLoading(true);
    try {
      const updated = await appointmentApi.updateStatus(selectedAppointment.id, status, remark);
      if (updated) {
        setSelectedAppointment(updated);
        setRefreshKey(prev => prev + 1);
        message.success('状态更新成功');
      }
    } catch (error) {
      message.error('状态更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSave = async (quote: Quote) => {
    if (!selectedAppointment) return;
    
    try {
      const isNew = !(quote.id && quote.id > 0);
      const payload: any = {
        appointmentId: selectedAppointment.id,
        remarks: quote.remarks,
        quoteItems: quote.quoteItems.map(item => {
          const base: any = {
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            remarks: item.remarks,
          };
          if (!isNew && item.id && item.id > 0) {
            base.id = item.id;
          }
          return base;
        }),
      };
      let saved;
      if (isNew) {
        saved = await quoteApi.create(payload);
      } else {
        saved = await quoteApi.update(quote.id, payload);
      }
      if (saved) {
        message.success('报价单保存成功');
        await refreshDetail(selectedAppointment.id);
      }
    } catch (error) {
      message.error('保存报价单失败');
    }
  };

  const handlePhotoUpload = async (photoType: PhotoType, file: File) => {
    if (!selectedAppointment) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await inspectionApi.upload({
          appointmentId: selectedAppointment.id,
          photoUrl: dataUrl,
          photoType,
          uploader: '当前用户',
          remarks: file.name,
        });
        message.success('照片上传成功');
        await refreshDetail(selectedAppointment.id);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      message.error('照片上传失败');
    }
  };

  const handlePhotoDelete = async (id: number) => {
    if (!selectedAppointment) return;
    try {
      await inspectionApi.remove(id);
      message.success('照片已删除');
      await refreshDetail(selectedAppointment.id);
    } catch (error) {
      message.error('删除照片失败');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ActionBar
        currentStatus={selectedAppointment?.status || null}
        onStatusChange={handleStatusChange}
        loading={loading}
      />
      
      <Row 
        gutter={[12, 12]} 
        style={{ flex: 1, margin: 0, minHeight: 0 }}
      >
        <Col 
          span={6} 
          style={{ 
            height: '100%',
            paddingLeft: 0,
            paddingRight: 6,
          }}
        >
          <div style={{ height: '100%' }}>
            <AppointmentList
              key={refreshKey}
              selectedId={selectedAppointment?.id}
              onSelect={handleSelect}
            />
          </div>
        </Col>
        
        <Col 
          span={11} 
          style={{ 
            height: '100%',
            paddingLeft: 6,
            paddingRight: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ height: '45%', minHeight: 0 }}>
            <VehicleCard
              vehicle={selectedAppointment?.vehicle || null}
              history={selectedAppointment?.historyRecords}
              loading={loading}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <QuoteEditor
              quote={selectedAppointment?.quote || null}
              onSave={handleQuoteSave}
              loading={loading}
            />
          </div>
        </Col>
        
        <Col 
          span={7} 
          style={{ 
            height: '100%',
            paddingLeft: 6,
            paddingRight: 0,
          }}
        >
          <div style={{ height: '100%' }}>
            <PhotoGallery
              photos={selectedAppointment?.photos || []}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
              loading={loading}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
