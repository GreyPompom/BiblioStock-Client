import api from '../api';
import type { MovementApiDTO, MovementCreateDto } from '../../types/movements.dto';

export async function fetchAllMovements(): Promise<MovementApiDTO[]> {
  const response = await api.get('/movements');
  const data = response.data;

  // se a API já devolve List<MovementResponseDTO> direto, isso aqui já resolve:
  if (Array.isArray(data)) {
    return data as MovementApiDTO[];
  }

  // se um dia você paginar e virar { content: [...], totalElements: ... }
  if (Array.isArray(data.content)) {
    return data.content as MovementApiDTO[];
  }

  console.error('Formato inesperado em fetchAllMovements:', data);
  return [];
}
export async function createMovement(
    payload: MovementCreateDto,
): Promise<MovementApiDTO> {
    const { data } = await api.post<MovementApiDTO>('/movements', payload);
    return data;
}