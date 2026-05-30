// JoinRideView.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { Ride } from '../types/rides';
import { getCurrentUserId } from '../utils/auth';
import { createRideRequest } from '../services/rideRequestService';
import { getUserMe, type CurrentUser } from '../services/userService';
import AppSidebar from '../components/layout/AppSidebar';
import './JoinRideView.css';

const getInitials = (fullName?: string | null): string => {
    if (!fullName) return 'U';

    const parts = fullName.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return 'U';

    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';

    return `${first}${second}`.toUpperCase();
};

const JoinRideView: React.FC = () => {
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const ride = location.state?.ride as Ride | undefined;

    useEffect(() => {
        let isMounted = true;

        const loadCurrentUser = async () => {
            try {
                const user = await getUserMe();

                if (isMounted) {
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error('Error cargando usuario actual:', error);
            }
        };

        loadCurrentUser();

        return () => {
            isMounted = false;
        };
    }, []);

    const isMyRide = React.useMemo(() => {
        if (!ride) return false;

        const currentUserId = getCurrentUserId();
        return currentUserId === ride.driverId;
    }, [ride]);

    if (!ride) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>No se encontraron los detalles de este viaje.</h2>
                <button onClick={() => navigate('/rides/search')}>Volver a buscar</button>
            </div>
        );
    }

    const formattedTime = new Date(ride.departureAt).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleSubmitRequest = async () => {
        if (!ride) return;

        setIsSubmitting(true);
        setRequestError(null);

        try {
            await createRideRequest({
                rideId: ride.id,
                passengerNotes: 'He leído y acepto las normas de seguridad de la UTA.',
            });

            setRequestSuccess(true);
        } catch (error: unknown) {
            console.error(error);

            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.detail || 'Hubo un error al enviar la solicitud.'
                : 'Hubo un error al enviar la solicitud.';

            setRequestError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatContribution = (value: number) =>
        value === 0 ? 'Gratuito' : `$${value.toFixed(2)}`;

    return (
        <div className="u-ride-layout">
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
                    </div>

                    <div className="user-profile">
                        <span className="user-name">
                            {currentUser?.fullName ?? 'Usuario'}
                        </span>

                        <div className="avatar" aria-label="Iniciales del usuario">
                            {getInitials(currentUser?.fullName)}
                        </div>
                    </div>
                </header>

                <div className="view-container">
                    <div className="grid-layout">
                        {/* Left Column: Ride Details */}
                        <section className="details-column">
                            <div className="card details-card">
                                <label className="section-label">DETALLES DEL VIAJE</label>

                                <div className="driver-header">
                                    <div className="driver-avatar-large">
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: '50%',
                                                backgroundColor: '#1e293b',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {ride.driverName.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="verified-badge">
                                            <i className="ti ti-check"></i>
                                        </div>
                                    </div>

                                    <div className="driver-info">
                                        <h3>{ride.driverName}</h3>

                                        <div className="rating">
                                            <i className="ti ti-star-filled"></i>
                                            <span>5.0</span>
                                            <span className="major">Conductor Verificado</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="route-timeline">
                                    <div className="timeline-item">
                                        <div className="timeline-icon origin"></div>

                                        <div className="timeline-content">
                                            <span className="time">{formattedTime}</span>
                                            <span className="location">{ride.originZone}</span>
                                        </div>
                                    </div>

                                    <div className="timeline-connector"></div>

                                    <div className="timeline-item">
                                        <div className="timeline-icon destination"></div>

                                        <div className="timeline-content">
                                            <span className="time">Llegada Aprox.</span>
                                            <span className="location">{ride.destinationZone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="technical-details">
                                    <div className="detail-row">
                                        <div className="detail-label">
                                            <i className="ti ti-car"></i>
                                            <span>Vehículo</span>
                                        </div>

                                        <div className="detail-value">Suzuki Vitara (Verde)</div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-label">
                                            <i className="ti ti-users"></i>
                                            <span>Cupos libres</span>
                                        </div>

                                        <div className="detail-value highlight">
                                            {ride.availableSeats} lugares disponibles
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-label">
                                            <i className="ti ti-music"></i>
                                            <span>Ambiente</span>
                                        </div>

                                        <div className="detail-value">
                                            {ride.notes || 'Sin preferencias específicas'}
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-label">
                                            <i className="ti ti-coin"></i>
                                            <span>Aporte sugerido por pasajero</span>
                                        </div>

                                        <div
                                            className="detail-value"
                                            style={{ fontWeight: 'bold', color: '#0ea5e9' }}
                                        >
                                            {formatContribution(ride.estimatedCostPerPassenger)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Right Column: Safety Agreement */}
                        <section className="agreement-column">
                            <div className="card agreement-card">
                                <div className="agreement-header">
                                    <i className="ti ti-shield-check"></i>
                                    <h2>Acuerdo de Seguridad</h2>
                                </div>

                                <p className="agreement-intro">
                                    Para mantener a la comunidad de la UTA segura, todos los pasajeros deben
                                    comprometerse a seguir estas normas básicas durante el viaje.
                                </p>

                                <div className="rules-list">
                                    <div className="rule-item">
                                        <i className="ti ti-id-badge"></i>

                                        <div className="rule-text">
                                            <h4>Identidad Estudiantil</h4>
                                            <p>
                                                El conductor podrá solicitarte mostrar tu carnet de la universidad o
                                                cédula al subir al vehículo por seguridad de ambos.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rule-item">
                                        <i className="ti ti-clock-stop"></i>

                                        <div className="rule-text">
                                            <h4>Puntualidad Estricta</h4>
                                            <p>
                                                Debes estar en el punto de encuentro a la hora acordada. El tiempo
                                                máximo de tolerancia es de 5 minutos.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rule-item">
                                        <i className="ti ti-users-group"></i>

                                        <div className="rule-text">
                                            <h4>Respeto y Convivencia</h4>
                                            <p>
                                                Mantén un trato respetuoso. Cualquier reporte de acoso,
                                                discriminación o mal comportamiento resultará en expulsión de la app.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <label className={`acceptance-box ${accepted ? 'checked' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                    />

                                    <span className="checkbox-custom"></span>

                                    <p>
                                        He leído las normas y{' '}
                                        <strong>acepto las reglas de seguridad</strong> de la plataforma y del
                                        conductor. Me comprometo a cumplirlas durante este viaje.
                                    </p>
                                </label>

                                {isMyRide ? (
                                    <button
                                        className="btn-submit active"
                                        onClick={() =>
                                            navigate(`/rides/${ride.id}/manage`, { state: { ride } })
                                        }
                                    >
                                        Gestionar Viaje
                                        <i className="ti ti-settings"></i>
                                    </button>
                                ) : (
                                    <>
                                        {requestError && (
                                            <p
                                                style={{
                                                    color: '#ef4444',
                                                    fontSize: '0.875rem',
                                                    marginBottom: '1rem',
                                                }}
                                            >
                                                {requestError}
                                            </p>
                                        )}

                                        {requestSuccess ? (
                                            <div
                                                style={{
                                                    backgroundColor: '#dcfce7',
                                                    color: '#16a34a',
                                                    padding: '1rem',
                                                    borderRadius: '0.5rem',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                <i
                                                    className="ti ti-check"
                                                    style={{ marginRight: '0.5rem' }}
                                                ></i>
                                                ¡Solicitud enviada con éxito! El conductor te notificará.
                                            </div>
                                        ) : (
                                            <button
                                                className={`btn-submit ${accepted ? 'active' : 'disabled'}`}
                                                disabled={!accepted || isSubmitting}
                                                onClick={handleSubmitRequest}
                                            >
                                                {isSubmitting ? 'Enviando...' : 'Solicitar Unirme al Viaje'}
                                                <i className="ti ti-send"></i>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JoinRideView;