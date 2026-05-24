import axiosClient from '../api/axiosClient';
import type { Ride, CreateRidePayload, RideSearchFilters } from '../types/rides';

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