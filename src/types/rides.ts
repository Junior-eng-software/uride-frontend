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
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  estimatedCostPerPassenger: number;
}

export interface CreateRidePayload {
  originZone: string;
  destinationZone: string;
  departureAt: string; 
  seatCapacity: number; 
  notes: string | null;
  estimatedCostPerPassenger: number;
}

export interface RideSearchFilters {
  originZone?: string;
  destinationZone?: string;
  from?: string; 
  to?: string; 
  departureTime?: string;
  availableOnly?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateRatingPayload {
  rideId: string;
  rateeId: string;
  score: number;
  comment?: string;
}
