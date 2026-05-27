import axiosClient from '../api/axiosClient';
import type { Ride, CreateRidePayload, RideSearchFilters } from '../types/rides';

export type RideResponse = Ride;

export async function createRide(data: CreateRidePayload): Promise<Ride> {
  // Eliminamos el '/api' inicial porque ya viene en el baseURL
  const response = await axiosClient.post<Ride>('/rides', data);
  return response.data;
}

export async function searchRides(filters?: RideSearchFilters): Promise<Ride[]> {
  // Eliminamos el '/api' inicial
  const response = await axiosClient.get<Ride[]>('/rides/search', { 
    params: filters 
  });
  return response.data;
}

export async function getMyRides(): Promise<RideResponse[]> {
  const response = await axiosClient.get<RideResponse[]>('/Rides/me');
  return response.data;
}

export async function getRideById(rideId: string): Promise<Ride> {
  const response = await axiosClient.get<Ride>(`/Rides/${rideId}`);
  return response.data;
}

export async function completeRide(rideId: string): Promise<void> {
  await axiosClient.put(`/Rides/${rideId}/complete`);
}
