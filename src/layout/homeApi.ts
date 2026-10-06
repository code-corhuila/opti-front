import { apiClient } from '../core/shellContext';
import type { Page } from '../shared/contract';

/**
 * The dashboard's own calls (HU-14). It reuses the single {@link apiClient} the container already
 * creates for every portal — same pattern as {@link ../layout/notificationsApi} — instead of
 * reaching into a remote portal's API module (which Module Federation does not expose to the
 * container). Every field below mirrors the backend response exactly; the dashboard never derives
 * a number (like a "vs last month" delta) that the API does not itself provide.
 */

export type WorkOrderStatus = 'QUOTATION' | 'APPROVED' | 'IN_LABORATORY' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type PatientStatus = 'ACTIVE' | 'CONTROL_OVERDUE' | 'INACTIVE';

/** Totals for the patients dashboard (HU-17, customers-api). */
export interface PatientSummary {
  total: number;
  active: number;
  pendingControls: number;
}

/** Inventory counters for frames (HU-15, products-api). */
export interface FrameSummary {
  totalReferences: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValueCents: number;
  recentCount30d: number;
}

export interface OverduePatient {
  id: string;
  fullName: string;
  lastControlDate: string;
}

export interface RecentOrder {
  id: string;
  number: string;
  patientId: string;
  status: WorkOrderStatus;
  totalCents: number;
  createdAt: string;
}

/** One day of revenue, as returned by GET /api/v1/reports/sales-timeseries (HU-24, ADMIN only). */
export interface DailySales {
  date: string;
  totalCents: number;
}

/** One status bucket, as returned by GET /api/v1/reports/orders-by-status (HU-24, ADMIN only). */
export interface StatusCount {
  status: WorkOrderStatus;
  count: number;
}

export function patientsSummary(signal?: AbortSignal): Promise<PatientSummary> {
  return apiClient.get<PatientSummary>('/api/v1/patients/summary', signal ? { signal } : {});
}

export function overduePatients(signal?: AbortSignal): Promise<Page<OverduePatient>> {
  return apiClient.get<Page<OverduePatient>>('/api/v1/patients', {
    query: { status: 'CONTROL_OVERDUE', limit: 5 },
    ...(signal ? { signal } : {}),
  });
}

export function framesSummary(signal?: AbortSignal): Promise<FrameSummary> {
  return apiClient.get<FrameSummary>('/api/v1/frames/summary', signal ? { signal } : {});
}

/** There is no lenses-summary endpoint (HU-15 only covers frames): the same "count via an empty page" trick used for every picker list. */
export async function lensesTotal(signal?: AbortSignal): Promise<number> {
  const page = await apiClient.get<Page<unknown>>('/api/v1/lenses', { query: { limit: 1 }, ...(signal ? { signal } : {}) });
  return page.meta.total;
}

/** Work orders still waiting for approval (status QUOTATION), counted the same way. */
export async function pendingApprovalCount(signal?: AbortSignal): Promise<number> {
  const page = await apiClient.get<Page<unknown>>('/api/v1/work-orders', {
    query: { status: 'QUOTATION', limit: 1 },
    ...(signal ? { signal } : {}),
  });
  return page.meta.total;
}

/** The 5 most recent work orders; the API already returns them newest-first, no sort param needed. */
export function recentOrders(signal?: AbortSignal): Promise<Page<RecentOrder>> {
  return apiClient.get<Page<RecentOrder>>('/api/v1/work-orders', { query: { limit: 5 }, ...(signal ? { signal } : {}) });
}

/** Daily revenue of the current month (HU-24, ADMIN only). */
export function salesTimeseries(signal?: AbortSignal): Promise<DailySales[]> {
  return apiClient.get<DailySales[]>('/api/v1/reports/sales-timeseries', signal ? { signal } : {});
}

/** Work orders per status (HU-24, ADMIN only). */
export function ordersByStatus(signal?: AbortSignal): Promise<StatusCount[]> {
  return apiClient.get<StatusCount[]>('/api/v1/reports/orders-by-status', signal ? { signal } : {});
}

/** Just the patient's name, to label a work order in "Órdenes recientes" without a dedicated endpoint. */
export function patientName(id: string, signal?: AbortSignal): Promise<{ fullName: string }> {
  return apiClient.get<{ fullName: string }>(`/api/v1/patients/${id}`, signal ? { signal } : {});
}
