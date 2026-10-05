import { apiClient } from '../core/shellContext';
import type { Page } from '../shared/contract';

/**
 * The shell's own calls to the notification endpoints (`opti-auth-api`). It reuses the single
 * {@link apiClient} the container already creates for every portal instead of a new fetch
 * mechanism; the bell in {@link ../layout/Shell} is the only caller.
 */

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Small page: just enough for the dropdown, not a full inbox. */
const NOTIFICATIONS_LIMIT = 10;

export function listNotifications(signal?: AbortSignal): Promise<Page<NotificationItem>> {
  return apiClient.get<Page<NotificationItem>>('/api/v1/notifications', {
    query: { limit: NOTIFICATIONS_LIMIT },
    signal,
  });
}

export function markNotificationRead(id: string): Promise<NotificationItem> {
  return apiClient.post<NotificationItem>(`/api/v1/notifications/${id}/read`);
}
