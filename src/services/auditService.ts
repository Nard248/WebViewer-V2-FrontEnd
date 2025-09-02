// src/services/auditService.ts
import { apiGet, createQueryParams } from './api';
import { PaginatedResponse } from '../types/common.types';

export interface AuditLog {
    id: number;
    user: number;
    user_username?: string;
    user_full_name?: string;
    action: string;
    action_details: Record<string, any>;
    occurred_at: string;
    ip_address: string;
    user_agent?: string;
    resource_type?: string;
    resource_id?: number;
    resource_name?: string;
}

export interface AuditLogFilters {
    user?: number;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}

export const getAuditLogs = (
    params: AuditLogFilters = {}
): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<AuditLog>>(`/audit-logs/?${queryParams.toString()}`);
};

export const getAuditLog = (id: number): Promise<AuditLog> => {
    return apiGet<AuditLog>(`/audit-logs/${id}/`);
};

export const getUserActivitySummary = (userId?: number): Promise<{
    total_actions: number;
    recent_actions: number;
    most_common_actions: Array<{ action: string; count: number }>;
    activity_timeline: Array<{ date: string; count: number }>;
}> => {
    const params = userId ? `?user_id=${userId}` : '';
    return apiGet(`/audit-logs/user-activity-summary/${params}`);
};

export const getSystemActivitySummary = (): Promise<{
    total_logs: number;
    unique_users: number;
    most_active_users: Array<{ user_id: number; username: string; action_count: number }>;
    action_breakdown: Array<{ action: string; count: number; percentage: number }>;
    activity_by_day: Array<{ date: string; count: number }>;
    resource_activity: Array<{ resource_type: string; count: number }>;
}> => {
    return apiGet('/audit-logs/system-activity-summary/');
};

export const exportAuditLogs = (filters: AuditLogFilters = {}): Promise<Blob> => {
    const queryParams = createQueryParams({ ...filters, export: 'csv' });
    return apiGet<Blob>(`/audit-logs/export/?${queryParams.toString()}`, {
        responseType: 'blob',
    });
};