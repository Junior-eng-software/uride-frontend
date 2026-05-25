// ManageRideView.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getRideRequests, respondToRideRequest } from '../services/rideRequestService';
import { completeRide } from '../services/rideService';
import type { RideRequest } from '../types/rideRequest';
import type { Ride } from '../types/rides';
import type { RatingNavigationState } from '../types/rating';
import { getCurrentUserId } from '../utils/auth';
import AppSidebar from '../components/layout/AppSidebar';
import './ManageRideView.css';

const ManageRideView: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [requests, setRequests] = useState<RideRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { id: rideIdFromUrl } = useParams<{ id: string }>();
    const ride = location.state?.ride as Ride | undefined;
    const currentUserId = getCurrentUserId();
    const isDriver = currentUserId === ride?.driverId;
    const rideId = ride?.id ?? rideIdFromUrl;
    const isCompletedRide = ride?.status === 'Completed';

    useEffect(() => {
        if (!rideId) {
            navigate('/rides/search');
            return;
        }

        const fetchRequests = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getRideRequests(rideId);
                setRequests(data);
            } catch (error) {
                console.error('Error cargando solicitudes', error);
                setError('No se pudieron cargar las solicitudes de este viaje.');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = window.setTimeout(() => {
            void fetchRequests();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [rideId, navigate]);

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
        if (!window.confirm('¿Marcar este viaje como completado?')) return;

        try {
            setIsCompleting(true);
            await completeRide(rideId);
            navigate('/dashboard');
        } catch {
            setError('No se pudo completar el viaje. Intenta de nuevo.');
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
                        <div className="notification-icon">
                            <i className="ti ti-bell"></i>
                            <span className="badge">2</span>
                        </div>
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
                                            {isCompletedRide && (
                                                <button
                                                    className="btn-rate"
                                                    onClick={() => {
                                                        const rateeId = isDriver ? passenger.passengerId : ride?.driverId;
                                                        const rateeName = isDriver ? passenger.passengerName : ride?.driverName;

                                                        if (!rateeId || !rateeName) {
                                                            return;
                                                        }

                                                        navigate(`/rides/${rideId}/rating`, {
                                                            state: {
                                                                ride,
                                                                rateeId,
                                                                rateeName,
                                                                rateeRole: isDriver ? 'passenger' : 'driver',
                                                            } satisfies RatingNavigationState,
                                                        });
                                                    }}
                                                >
                                                    <i className="ti ti-star-filled"></i>
                                                    <span>Calificar</span>
                                                </button>
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
                                    {isCompletedRide && confirmedRequests.length === 0 && (
                                        <p className="empty-history">No hubo pasajeros confirmados en este viaje.</p>
                                    )}
                                </div>
                                {!isCompletedRide && (
                                    <button
                                        className="btn-complete"
                                        onClick={handleCompleteRide}
                                        disabled={isCompleting}
                                    >
                                        <i className="ti ti-flag-check"></i>
                                        {isCompleting ? 'Completando...' : 'Completar Viaje'}
                                    </button>
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
