import axiosClient from '../api/axiosClient';
import type { 
    RideRequest, 
    CreateRideRequestPayload, 
} from '../types/rideRequest';

// RF5: Enviar solicitud para unirse (Pasajero)
export async function createRideRequest(payload: CreateRideRequestPayload): Promise<RideRequest> {
    const { rideId, passengerNotes } = payload;
    
    // POST /api/Rides/{rideId}/requests
    const response = await axiosClient.post<RideRequest>(`/Rides/${rideId}/requests`, {
        message: passengerNotes,
    });
    
    return response.data;
}

// RF6: Ver solicitudes recibidas (Conductor)
export async function getRideRequests(rideId: string): Promise<RideRequest[]> {
    // GET /api/Rides/{rideId}/requests
    const response = await axiosClient.get<RideRequest[]>(`/Rides/${rideId}/requests`);
    return response.data;
}

// RF6: Aceptar o Rechazar solicitud (Conductor)
export async function respondToRideRequest(
    rideId: string, 
    requestId: string, 
    payload: { status: 'Accepted' | 'Rejected', driverResponseNote?: string }
): Promise<void> {
    
    // Mapeamos el string del frontend al valor numérico del Enum en C#
    // Accepted = 1, Rejected = 2
    const decisionValue = payload.status === 'Accepted' ? 1 : 2;

    // Enviamos exactamente la estructura que espera tu ReviewRideRequest en C#
    await axiosClient.put(`/Rides/${rideId}/requests/${requestId}`, {
        decision: decisionValue,
        driverResponseNote: payload.driverResponseNote || null
    });
}