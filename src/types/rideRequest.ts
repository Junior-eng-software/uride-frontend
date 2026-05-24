export interface RideRequest {
    id: string;
    rideId: string;
    passengerId: string;
    passengerName: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
    message?: string;
    driverResponseNote?: string | null;
    requestedAt: string;
    respondedAt?: string | null;
}

export interface CreateRideRequestPayload {
    rideId: string;
    passengerNotes?: string;
}

export interface UpdateRideRequestStatusPayload {
    status: 'Accepted' | 'Rejected';
}