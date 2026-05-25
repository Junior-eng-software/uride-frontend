// DashboardView.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserMe, type CurrentUser } from '../services/userService';
import { getMyRides } from '../services/rideService';
import type { Ride } from '../types/rides';
import type { RatingNavigationState } from '../types/rating';
import { getCurrentUserId } from '../utils/auth';
import AppSidebar from '../components/layout/AppSidebar';
import './DashboardView.css';

const DashboardView: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [rides, setRides] = useState<Ride[]>([]);

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

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleQuickAction = (path: string) => {
        navigate(path);
    };

    const handleManageRide = (ride: Ride) => {
        navigate(`/rides/${ride.id}/manage`, { state: { ride } });
    };

    const handleRateDriver = (ride: Ride) => {
        navigate(`/rides/${ride.id}/rating`, {
            state: {
                ride,
                rateeId: ride.driverId ?? '',
                rateeName: ride.driverName ?? '',
                rateeRole: 'driver',
            } satisfies RatingNavigationState,
        });
    };

    const activeRides = rides.filter(ride => ride.status !== 'Completed');
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
                        <div className="notification-bell">
                            <i className="ti ti-bell"></i>
                            <span className="badge-dot"></span>
                        </div>
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
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2 className="section-title">Viajes Recientes</h2>
                            <button className="btn-text">Ver todo</button>
                        </div>
                        {completedRides.length === 0 ? (
                            <div className="ride-card completed-card">
                                <p>No tienes viajes completados todavía.</p>
                            </div>
                        ) : (
                            completedRides.map((ride) => {
                                const isPassengerRide = ride.driverId !== authenticatedUserId;

                                return (
                                    <div key={ride.id} className="ride-card completed-card">
                                        <div className="ride-main">
                                            <div className="status-icon completed">
                                                <i className="ti ti-circle-check"></i>
                                            </div>
                                            <div className="ride-info">
                                                <span className="ride-day">{new Date(ride.departureAt).toLocaleString('es-EC', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                })}</span>
                                                <span className="status-text">Completado</span>
                                            </div>
                                            <div className="ride-path-summary">
                                                <span className="zone">{ride.originZone}</span>
                                                <i className="ti ti-arrow-narrow-right"></i>
                                                <span className="zone">{ride.destinationZone}</span>
                                            </div>
                                            {isPassengerRide ? (
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => handleRateDriver(ride)}
                                                >
                                                    Calificar conductor
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => handleManageRide(ride)}
                                                >
                                                    Ver viaje
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DashboardView;