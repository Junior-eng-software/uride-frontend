import axiosClient from '../api/axiosClient';
import type { AdminReport, SuspendUserRequest } from '../types/admin';

export async function getAdminReports(): Promise<AdminReport[]> {
    const response = await axiosClient.get<AdminReport[]>('/admin/reports');
    return response.data;
}

export async function updateReportStatus(reportId: string, status: string): Promise<void> {
    // Mapeamos el string del frontend al valor numérico que espera el Enum en C#
    const statusMap: Record<string, number> = {
        'Pending': 0,
        'Resolved': 1,
        'Dismissed': 2
    };

    const statusNumber = statusMap[status];

    // Enviamos el número en lugar del string
    await axiosClient.put(`/admin/reports/${reportId}/status`, { status: statusNumber });
}

export async function suspendUser(userId: string, body?: SuspendUserRequest): Promise<void> {
    await axiosClient.put(`/admin/users/${userId}/suspend`, body);
}