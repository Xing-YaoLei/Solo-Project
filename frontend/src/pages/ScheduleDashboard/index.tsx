import { useState, useEffect } from 'react';
import { Row, Col, message, Spin } from 'antd';
import AppointmentList from '@/components/AppointmentList';
import VehicleCard from '@/components/VehicleCard';
import QuoteEditor from '@/components/QuoteEditor';
import PhotoGallery from '@/components/PhotoGallery';
import ActionBar from '@/components/ActionBar';
import type { AppointmentDetail, AppointmentListItem, AppointmentStatus, Quote } from '@/types';
import { appointmentApi } from '@/services/appointment';

export default function ScheduleDashboard() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      const updated = await appointmentApi.updateQuote(selectedAppointment.id, quote);
      if (updated) {
        setSelectedAppointment(updated);
      }
    } catch (error) {
      message.error('保存报价单失败');
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
              loading={loading}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
