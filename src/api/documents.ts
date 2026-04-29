import apiClient from './client';
import type { Document } from '@/types';

export const documentsApi = {
  getByShipment: (shipmentId: number) =>
    apiClient.get<Document[]>(`/shipments/${shipmentId}/documents`).then((res) => res.data),

  upload: (formData: FormData) =>
    apiClient.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data),

  delete: (id: number) =>
    apiClient.delete(`/documents/${id}`),

  verify: (id: number) =>
    apiClient.put<Document>(`/documents/${id}/verify`).then((res) => res.data),
};
