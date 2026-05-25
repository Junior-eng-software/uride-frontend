import axiosClient from '../api/axiosClient';
import type { CreateReportPayload } from '../types/report';
import type { AxiosResponse } from 'axios';

export async function submitReport(payload: CreateReportPayload): Promise<AxiosResponse<void>> {
	const response = await axiosClient.post<void>('/reports', payload);
	// Log minimal info for callers/debugging
	console.debug('submitReport:', response.status, response.statusText);
	return response;
}
