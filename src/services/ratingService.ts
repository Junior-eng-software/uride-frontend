import axiosClient from '../api/axiosClient';
import type { UserRatingSummaryResponse } from '../types/rating';

export interface CreateRatingPayload {
    rateeId: string;
    score: number;
    comment?: string;
}

// RF8: Enviar la calificación al backend
export async function submitRideRating(rideId: string, payload: CreateRatingPayload): Promise<void> {
    // Apuntamos al endpoint que tu Clean Architecture debe tener expuesto
    await axiosClient.post(`/Rides/${rideId}/ratings`, payload);
}

export async function getUserRatings(userId: string): Promise<UserRatingSummaryResponse> {
    const response = await axiosClient.get<UserRatingSummaryResponse>(`/Users/${userId}/ratings`);
    return response.data;
}