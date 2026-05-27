// ManageRideView.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getRideRequests, respondToRideRequest } from '../services/rideRequestService';
import { completeRide, getMyRides } from '../services/rideService';
import { getRideRatings } from '../services/ratingService';
import type { RideRequest } from '../types/rideRequest';
import type { Ride } from '../types/rides';
import type { RatingNavigationState, RatingResponse } from '../types/rating';
import axios from 'axios';
import { getCurrentUserId } from '../utils/auth';
import AppSidebar from '../components/layout/AppSidebar';
import NotificationBell from '../components/notifications/NotificationBell';
import './ManageRideView.css';

const ManageRideView: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [ride, setRide] = useState<Ride | null>(null);
    const [requests, setRequests] = useState<RideRequest[]>([]);
    const [existingRatings, setExistingRatings] = useState<RatingResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { id: rideIdFromUrl } = useParams<{ id: string }>();
    const fallbackRide = location.state?.ride as Ride | undefined;
    const currentUserId = getCurrentUserId();
    const driverId = ride?.driverId ?? null;
    const driverName = ride?.driverName ?? null;
    const isDriver = currentUserId === ride?.driverId;
    const rideId = ride?.id ?? rideIdFromUrl;
    const isCompletedRide = ride?.status === 'Completed';
    const canComplete = ride?.status === 'Published';

    const hasAlreadyRated = (rateeId?: string | null): boolean => {
        if (!rateeId || !currentUserId) {
            return false;
        }

        const normalizedCurrentUserId = currentUserId.trim().toLowerCase();
        const normalizedRateeId = rateeId.trim().toLowerCase();

        return existingRatings.some(
            rating =>
                rating.raterId.trim().toLowerCase() === normalizedCurrentUserId &&
                rating.rateeId.trim().toLowerCase() === normalizedRateeId
        );
    };

    const hasCurrentUserRated = (rateeId?: string | null): boolean => hasAlreadyRated(rateeId);

    const renderRatingControl = (rateeId?: string | null, rateeName?: string | null, rateeRole: 'driver' | 'passenger' = 'passenger') => {
        if (!ride || !rateeId || !rateeName) {
            return null;
        }

        if (hasCurrentUserRated(rateeId)) {
            return (
                <span className="rating-submitted-badge">
                    Calificación enviada
                </span>
            );
        }

        return (
            <button
                className="btn-rate"
                onClick={() => {
                    navigate(`/rides/${rideId}/rating`, {
                        state: {
                            ride,
                            rateeId,
                            rateeName,
                            rateeRole,
                        } satisfies RatingNavigationState,
                    });
                }}
            >
                <i className="ti ti-star-filled"></i>
                <span>Calificar</span>
            </button>
        );
    };

    useEffect(() => {
        if (!rideId) {
            navigate('/rides/search');
            return;
        }

        const fetchRideData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                let freshRide: Ride | null = fallbackRide ?? null;

                try {
                    const myRides = await getMyRides();
                    freshRide = myRides.find(r => r.id === rideId) ?? freshRide;
                } catch (syncError) {
                    console.warn('No se pudo sincronizar el viaje desde /api/Rides/me', syncError);
                }

                setRide(freshRide);

                try {
                    const requestsData = await getRideRequests(rideId);
                    setRequests(requestsData);
                } catch (requestsError) {
                    console.error('Error cargando solicitudes del viaje', requestsError);
                    setError('No se pudieron cargar las solicitudes de este viaje.');
                }

                try {
                    const ratingsData = await getRideRatings(rideId);
                    setExistingRatings(ratingsData);
                } catch (ratingsError) {
                    console.warn('No se pudieron cargar los ratings del viaje', ratingsError);
                    setExistingRatings([]);
                }
            } catch (error) {
                console.error('Error inesperado cargando la vista de viaje', error);
                setError('No se pudieron cargar las solicitudes de este viaje.');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = window.setTimeout(() => {
            void fetchRideData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [rideId, navigate, fallbackRide]);

    const handleStatusChange = async (requestId: string, newStatus: 'Accepted' | 'Rejected') => {
        if (!rideId) return;

        try {
            setError(null);
            await respondToRideRequest(rideId, requestId, { status: newStatus });
            const data = await getRideRequests(rideId);
            setRequests(data);
        } catch (error) {
            console.error('Error al actualizar la solicitud', error);
            setError('Ocurrió un error al procesar la solicitud.');
            alert('Ocurrió un error al procesar la solicitud.');
        }
    };

    const handleCompleteRide = async () => {
        if (!rideId) return;
        if (ride?.status !== 'Published') {
            setError('Este viaje no puede completarse en su estado actual.');
            return;
        }
        if (!window.confirm('¿Marcar este viaje como completado?')) return;

        try {
            setIsCompleting(true);
            await completeRide(rideId);
            const refreshed = await getMyRides();
            const updated = refreshed.find(r => r.id === rideId) ?? null;
            setRide(updated ?? ride);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setError('El viaje no puede completarse. Recarga la página e inténtalo de nuevo.');
                try {
                    const refreshed = await getMyRides();
                    const updated = refreshed.find(r => r.id === rideId) ?? null;
                    setRide(updated ?? ride);
                } catch {
                    // Si la sincronización falla, mantenemos el error principal.
                }
                return;
            }

            setError('Ocurrió un error al completar el viaje.');
        } finally {
            setIsCompleting(false);
        }
    };

    const pendingRequests = requests.filter(request => request.status === 'Pending');
    const confirmedRequests = requests.filter(request => request.status === 'Accepted');

    const totalSeats = ride?.seatCapacity ?? confirmedRequests.length;
    const availableSeats = totalSeats - confirmedRequests.length;

    if (!rideId) return null;

    if (isLoading) {
        return (
            <div className="manage-ride-layout">
                <main className="main-content">
                    <div className="container">
                        <p>Cargando solicitudes...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="manage-ride-layout">
                <main className="main-content">
                    <div className="container">
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="manage-ride-layout">
            {/* Sidebar Mobile Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <AppSidebar className={sidebarOpen ? 'open' : ''} />

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <div className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <i className="ti ti-menu-2"></i>
                        </div>
                        <button className="btn-back" onClick={() => navigate('/dashboard')}>
                            <i className="ti ti-arrow-left"></i>
                            <span>Gestión de Viaje</span>
                        </button>
                    </div>
                    <div className="header-right">
                        <NotificationBell />
                        <div className="user-profile">
                            <div className="avatar"></div>
                        </div>
                    </div>
                </header>

                <div className="container">
                    {/* Summary Card */}
                    <section className="summary-card">
                        <div className="ride-main-info">
                            <div className="car-icon-box">
                                <i className="ti ti-car"></i>
                            </div>
                            <div className="ride-text">
                                <span className="ride-date">
                                    {ride?.departureAt
                                        ? new Date(ride.departureAt).toLocaleString('es-EC', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })
                                        : 'Cargando informacion del viaje...'}
                                </span>
                                <h2 className="ride-route">
                                    {ride?.originZone ?? 'Origen'} <i className="ti ti-arrow-right"></i> {ride?.destinationZone ?? 'Destino'}
                                </h2>
                            </div>
                        </div>
                        <div className="seats-indicator">
                            <div className="seats-text">
                                <span className="seats-label">{isCompletedRide ? 'ESTADO' : 'CUPOS DISPONIBLES'}</span>
                                <span className={`seats-count ${isCompletedRide ? 'completed' : ''}`}>
                                    {isCompletedRide ? 'Completado' : `${availableSeats} de ${totalSeats}`}
                                </span>
                            </div>
                            <div className="seats-visual">
                                {confirmedRequests.map(request => (
                                    <div key={request.id} className="seat-avatar occupied">
                                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" alt={request.passengerName} />
                                    </div>
                                ))}
                                {!isCompletedRide && Array.from({ length: Math.max(availableSeats, 0) }).map((_, i) => (
                                    <div key={i} className="seat-avatar empty">
                                        <i className="ti ti-plus"></i>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="manage-grid">
                        {/* Column: Pending Requests */}
                        {!isCompletedRide && (
                            <section className="requests-column">
                                <h3 className="section-title">Solicitudes Pendientes ({pendingRequests.length})</h3>
                                <div className="requests-list">
                                    {isLoading && <p>Cargando solicitudes...</p>}
                                    {!isLoading && pendingRequests.map(req => (
                                        <div key={req.id} className="request-card">
                                            <div className="passenger-info">
                                                <div className="avatar-placeholder" style={{ backgroundColor: '#e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                    {req.passengerName ? req.passengerName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="passenger-meta">
                                                    <div className="name-rating">
                                                        <span className="name">{req.passengerName || 'Pasajero'}</span>
                                                        <span className="rating-tag">
                                                            <i className="ti ti-star-filled"></i> 5.0
                                                        </span>
                                                    </div>
                                                    <span className="major">Estudiante • Campus UTA</span>
                                                    <span className="time"><i className="ti ti-clock"></i> {new Date(req.requestedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div className="request-actions">
                                                <button className="btn-reject" onClick={() => handleStatusChange(req.id, 'Rejected')}>Rechazar</button>
                                                <button className="btn-accept" onClick={() => handleStatusChange(req.id, 'Accepted')}>Aceptar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Column: Confirmed Passengers */}
                        <section className="confirmed-column">
                            <div className="confirmed-card">
                                <h3 className="section-title">Pasajeros Confirmados</h3>
                                <div className="confirmed-list">
                                    {confirmedRequests.map(passenger => (
                                        <div key={passenger.id} className="confirmed-item">
                                            <div className="passenger-info">
                                                <div className="avatar-confirmed">
                                                    <div className="avatar-placeholder" style={{ backgroundColor: '#dcfce7', color: '#16a34a', width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                        {passenger.passengerName ? passenger.passengerName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="check-badge"><i className="ti ti-check"></i></div>
                                                </div>
                                                <div className="passenger-meta">
                                                    <span className="name">{passenger.passengerName}</span>
                                                    <span className="major">Estudiante Confirmado</span>
                                                </div>
                                            </div>
                                            {isCompletedRide && isDriver && renderRatingControl(
                                                passenger.passengerId,
                                                passenger.passengerName,
                                                'passenger'
                                            )}
                                        </div>
                                    ))}
                                    {!isCompletedRide && Array.from({ length: Math.max(0, availableSeats) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="confirmed-item empty">
                                            <div className="passenger-info">
                                                <div className="avatar-placeholder empty">
                                                    <i className="ti ti-user"></i>
                                                </div>
                                                <span className="empty-text">Esperando pasajero...</span>
                                            </div>
                                        </div>
                                    ))}
                                    {isCompletedRide && !isDriver && renderRatingControl(driverId, driverName, 'driver')}
                                    {isCompletedRide && confirmedRequests.length === 0 && (
                                        <p className="empty-history">No hubo pasajeros confirmados en este viaje.</p>
                                    )}
                                </div>
                                {canComplete && (
                                    <button
                                        className="btn-complete"
                                        onClick={handleCompleteRide}
                                        disabled={isCompleting}
                                    >
                                        <i className="ti ti-flag-check"></i>
                                        {isCompleting ? 'Completando...' : 'Completar Viaje'}
                                    </button>
                                )}
                                {ride?.status === 'Completed' && (
                                    <span className="rating-submitted-badge" style={{ marginTop: '1rem' }}>Viaje completado</span>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManageRideView;
