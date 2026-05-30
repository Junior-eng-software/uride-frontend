// DashboardView.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserMe, type CurrentUser } from '../services/userService';
import { getMyRides } from '../services/rideService';
import { getRideRatings } from '../services/ratingService';
import type { Ride } from '../types/rides';
import { getCurrentUserId } from '../utils/auth';
import AppSidebar from '../components/layout/AppSidebar';
import NotificationBell from '../components/notifications/NotificationBell';
import './dashBoardView.css';

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        Pending: 'Pendiente',
        Active: 'Activo',
        Published: 'Activo',
        Completed: 'Completado',
        Cancelled: 'Cancelado',
    };

    return labels[status] ?? status;
};

const DashboardView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [rides, setRides] = useState<Ride[]>([]);
    const [ratedRideIds, setRatedRideIds] = useState<Set<string>>(new Set());
    const [successMessage, setSuccessMessage] = useState<string | null>(
        (location.state as { successMessage?: string } | null)?.successMessage ?? null
    );

    useEffect(() => {
        const fetchUserAndRatings = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const user = await getUserMe();
                const ridesData = await getMyRides();

                setCurrentUser(user);
                setRides(ridesData);
            } catch (fetchError) {
                console.error('Error cargando perfil y reputacion', fetchError);
                setError('No se pudo cargar la informacion del usuario.');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = window.setTimeout(() => {
            void fetchUserAndRatings();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const loadRatedRides = async () => {
            if (!rides.length) {
                setRatedRideIds(new Set());
                return;
            }

            const currentUserId = getCurrentUserId();

            if (!currentUserId) {
                setRatedRideIds(new Set());
                return;
            }

            const recentRides = rides.filter(ride => ride.status === 'Completed');

            if (!recentRides.length) {
                setRatedRideIds(new Set());
                return;
            }

            const ratingsResults = await Promise.all(
                recentRides.map(ride => getRideRatings(ride.id))
            );

            const ratedIds = new Set<string>();

            recentRides.forEach((ride, index) => {
                const hasRatedDriver = ratingsResults[index].some(
                    rating => rating.raterId === currentUserId && rating.rateeId === ride.driverId
                );

                if (hasRatedDriver) {
                    ratedIds.add(ride.id);
                }
            });

            setRatedRideIds(ratedIds);
        };

        void loadRatedRides();
    }, [rides]);

    useEffect(() => {
        if (!successMessage) return;

        const timer = window.setTimeout(() => {
            setSuccessMessage(null);
            navigate(location.pathname, { replace: true });
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [successMessage, navigate, location.pathname]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleQuickAction = (path: string) => {
        navigate(path);
    };

    const handleManageRide = (ride: Ride) => {
        navigate(`/rides/${ride.id}/manage`, { state: { ride } });
    };

    const activeRides = rides.filter(ride => ride.status === 'Published');
    const completedRides = rides.filter(ride => ride.status === 'Completed');
    const currentUserId = currentUser?.id;
    const authenticatedUserId = getCurrentUserId();

    if (!authenticatedUserId) return;

    if (isLoading) {
        return (
            <div className="u-ride-layout">
                <main className="main-content">
                    <div className="content-container">
                        <p>Cargando dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="u-ride-layout">
                <main className="main-content">
                    <div className="content-container">
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="u-ride-layout">
            {successMessage && (
                <div
                    role="alert"
                    style={{
                        position: 'fixed',
                        top: '1.25rem',
                        right: '1.25rem',
                        zIndex: 1000,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '0.5rem',
                        background: '#ecfdf5',
                        color: '#15803d',
                        border: '1px solid rgba(22, 163, 74, 0.2)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                >
                    <span>{successMessage}</span>
                </div>
            )}
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}

            <AppSidebar className={sidebarOpen ? 'open' : ''} />

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={toggleSidebar}>
                            <i className="ti ti-menu-2"></i>
                        </button>
                        <h1>Dashboard</h1>
                    </div>
                    <div className="header-right">
                        <NotificationBell />
                    </div>
                </header>

                <div className="content-container">
                    {/* Quick Actions */}
                    <section className="dashboard-section">
                        <h2 className="section-title">Acciones Rápidas</h2>
                        <div className="quick-actions-grid">
                            <button
                                className="action-card"
                                onClick={() => handleQuickAction('/rides/create')}
                            >
                                <div className="icon-circle primary">
                                    <i className="ti ti-plus"></i>
                                </div>
                                <span>Publicar Viaje</span>
                            </button>
                            <button
                                className="action-card"
                                onClick={() => handleQuickAction('/rides/search')}
                            >
                                <div className="icon-circle">
                                    <i className="ti ti-search"></i>
                                </div>
                                <span>Buscar Viaje</span>
                            </button>
                        </div>
                    </section>

                    {/* Active Rides */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Mis Viajes Activos</h2>
                            <span className="status-badge">{activeRides.length} Activo{activeRides.length === 1 ? '' : 's'}</span>
                        </div>
                        {activeRides.length === 0 ? (
                            <div className="ride-card active-card">
                                <p>No tienes viajes activos por ahora.</p>
                            </div>
                        ) : (
                            activeRides.map((ride) => {
                                const isDriver = currentUserId === ride.driverId;

                                return (
                                    <div key={ride.id} className="ride-card active-card">
                                        <div className="ride-header">
                                            <div className="ride-type-icon">
                                                <i className="ti ti-car"></i>
                                            </div>
                                            <div className="ride-time-info">
                                                <span className="ride-day">{new Date(ride.departureAt).toLocaleString('es-EC', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                })}</span>
                                                <span className="ride-capacity">{ride.availableSeats} Asientos disponibles</span>
                                            </div>
                                        </div>
                                        <div className="ride-route">
                                            <div className="route-point">
                                                <span className="dot origin"></span>
                                                <span className="zone-name">{ride.originZone}</span>
                                            </div>
                                            <div className="route-line"></div>
                                            <div className="route-point">
                                                <span className="dot destination"></span>
                                                <span className="zone-name">{ride.destinationZone}</span>
                                            </div>
                                        </div>
                                        <div className="ride-footer">
                                            {isDriver ? (
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => handleManageRide(ride)}
                                                >
                                                    Gestionar Solicitudes
                                                </button>
                                            ) : (
                                                <span className="status-text">Viaje en curso</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </section>

                    {/* Completed Rides */}
                    <section className="recent-rides-section">
                        <div className="recent-rides-header">
                            <div>
                                <span className="section-eyebrow">Historial reciente</span>
                                <h2>Viajes recientes</h2>
                            </div>
                        </div>
                        {completedRides.length === 0 ? (
                            <div className="empty-recent-rides">
                                <h3>No tienes viajes recientes</h3>
                                <p>Cuando completes o participes en un viaje, aparecerá aquí.</p>
                            </div>
                        ) : (
                            <div className="recent-rides-grid">
                                {completedRides.map((ride) => {
                                    const isRatingSent = ratedRideIds.has(ride.id);

                                    return (
                                        <article key={ride.id} className="recent-ride-card">
                                            <div className="ride-card-main">
                                                <div className="ride-route">
                                                    <span>{ride.originZone}</span>
                                                    <span className="route-arrow">→</span>
                                                    <span>{ride.destinationZone}</span>
                                                </div>

                                                <p className="ride-date">
                                                    {new Date(ride.departureAt).toLocaleString('es-EC', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                    })}
                                                </p>
                                            </div>

                                            <div className="ride-card-footer">
                                                <div className="ride-badges">
                                                    <span className={`status-pill ${ride.status.toLowerCase()}`}>
                                                        {getStatusLabel(ride.status)}
                                                    </span>

                                                    {isRatingSent && (
                                                        <span className="rating-pill">Calificación enviada</span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    className="btn-view-ride"
                                                    onClick={() => navigate(`/rides/${ride.id}/detail`, {
                                                        state: { ride },
                                                    })}
                                                >
                                                    Ver viaje
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DashboardView;
