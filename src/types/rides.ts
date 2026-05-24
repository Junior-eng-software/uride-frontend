export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  originZone: string;
  destinationZone: string;
  departureAt: string; 
  seatCapacity: number; 
  acceptedSeats: number; 
  availableSeats: number; 
  notes: string | null;
  status: string;
}

export interface CreateRidePayload {
  originZone: string;
  destinationZone: string;
  departureAt: string; 
  seatCapacity: number; 
  notes: string | null;
}

export interface RideSearchFilters {
  originZone?: string;
  destinationZone?: string;
  from?: string; 
  to?: string; 
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}