import axiosInstance from '../axios';
import type { Tag } from '@scenic/shared';

export async function getTags(): Promise<Tag[]> {
  return axiosInstance.get('/api/tags');
}

export async function createTag(data: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
  return axiosInstance.post('/api/tags', data);
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  return axiosInstance.put(`/api/tags/${id}`, data);
}

export async function deleteTag(id: string): Promise<void> {
  return axiosInstance.delete(`/api/tags/${id}`);
}
