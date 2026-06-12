import client from './client';
import type { ApiResponse, ProductTag } from '../types';

export const getProductTags = () =>
  client.get<ApiResponse<ProductTag[]>>('/product-tags');

export const getProductTag = (id: number) =>
  client.get<ApiResponse<ProductTag>>(`/product-tags/${id}`);

export const createProductTag = (data: Partial<ProductTag>) =>
  client.post<ApiResponse<ProductTag>>('/product-tags', data);

export const updateProductTag = (id: number, data: Partial<ProductTag>) =>
  client.put<ApiResponse<ProductTag>>(`/product-tags/${id}`, data);

export const deleteProductTag = (id: number) =>
  client.delete<ApiResponse<void>>(`/product-tags/${id}`);
