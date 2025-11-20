// src/lib/authorsApi.ts
import axios from 'axios';
import type  { AuthorRequestDTO, AuthorResponseDTO } from '../../types/authors.dto';
import api from '../api';

export async function getAuthors(): Promise<AuthorResponseDTO[]> {
  const response = await api.get<AuthorResponseDTO[]>('/authors');
  return response.data;
}

export async function getAuthorById(id: number): Promise<AuthorResponseDTO> {
  const response = await api.get<AuthorResponseDTO>(`/authors/${id}`);
  return response.data;
}

export async function createAuthor(payload: AuthorRequestDTO): Promise<AuthorResponseDTO> {
  const response = await api.post<AuthorResponseDTO>('/authors', payload);
  return response.data;
}

export async function updateAuthor(id: number, payload: AuthorRequestDTO): Promise<AuthorResponseDTO> {
  const response = await api.put<AuthorResponseDTO>(`/authors/${id}`, payload);
  return response.data;
}

export async function deleteAuthor(id: number): Promise<void> {
  await api.delete(`/authors/${id}`);
}
