import api from '../api';
import type { DashboardOverviewDTO } from '../../types/dashboard.dto';

export async function fetchDashboardOverview(): Promise<DashboardOverviewDTO> {
  const { data } = await api.get<DashboardOverviewDTO>('/dashboard/overview');
  return data;
}