import axios from 'axios';
import type { Note, Category, CreateNoteDto, UpdateNoteDto } from '../types';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Notes API
export const notesApi = {
  getAll: async (categoryId?: number): Promise<Note[]> => {
    const params = categoryId ? { categoryId } : {};
    console.log('[notesApi.getAll] categoryId:', categoryId, 'params:', params);
    const response = await api.get('/notes', { params });
    console.log('[notesApi.getAll] Response:', response.data.length, 'notes');
    return response.data;
  },

  getPinned: async (): Promise<Note[]> => {
    const response = await api.get('/notes/pinned');
    return response.data;
  },

  create: async (note: CreateNoteDto): Promise<Note> => {
    const response = await api.post('/notes', note);
    return response.data;
  },

  update: async (id: number, note: UpdateNoteDto): Promise<Note> => {
    console.log(`[API] → PATCH /notes/${id}`, {
      payload: note,
      timestamp: new Date().toISOString()
    });

    const response = await api.patch(`/notes/${id}`, note);

    console.log(`[API] ← PATCH /notes/${id}`, {
      id: response.data.id,
      hasContent: !!response.data.content,
      contentLength: response.data.content?.length || 0,
      hasType: !!response.data.type,
      type: response.data.type,
      isPinned: response.data.isPinned,
      timestamp: new Date().toISOString()
    });

    return response.data;
  },

  reorder: async (notes: { id: number; order: number }[]): Promise<void> => {
    await api.patch('/notes/reorder', { notes });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  getArchived: async (): Promise<Note[]> => {
    const response = await api.get('/notes/archived');
    return response.data;
  },

  archive: async (id: number): Promise<void> => {
    await api.patch(`/notes/${id}/archive`);
  },

  unarchive: async (id: number): Promise<Note> => {
    const response = await api.patch(`/notes/${id}/unarchive`);
    return response.data;
  },

  duplicate: async (id: number): Promise<Note> => {
    const response = await api.post(`/notes/${id}/duplicate`);
    return response.data;
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await api.delete('/notes/bulk', { data: { ids } });
  },

  bulkArchive: async (ids: number[]): Promise<void> => {
    await api.patch('/notes/bulk/archive', { ids });
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  create: async (name: string, icon?: string, color?: string): Promise<Category> => {
    const response = await api.post('/categories', { name, icon, color });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
