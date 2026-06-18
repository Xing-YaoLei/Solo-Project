import { useEffect, useState } from 'react';
import type { AppointmentDetail, AppointmentListItem, AppointmentStatus } from '@/types';
import { appointmentApi } from '@/services/appointment';

export function useAppointment(id?: number) {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setAppointment(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await appointmentApi.getById(id);
        setAppointment(data);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return { appointment, loading, error, setAppointment };
}

export function useAppointmentList(status?: AppointmentStatus) {
  const [list, setList] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await appointmentApi.getList({ status });
        setList(data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  return { list, loading, setList };
}

export default useAppointment;
