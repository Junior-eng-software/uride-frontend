import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/layout/AppSidebar';
import NotificationBell from '../components/notifications/NotificationBell';
import { searchRides } from '../services/rideService';
import type { Ride, RideSearchFilters } from '../types/rides';
import './SearchRidesView.css';

const SearchRidesView: React.FC = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rides, setRides] = useState<Ride[]>([]);
    const [filters, setFilters] = useState<RideSearchFilters>({
        availableOnly: true,
        page: 1,
        pageSize: 10,
    });
    const [selectedDate, setSelectedDate] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRides = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await searchRides(filters);
                setRides(prev =>
                    filters.page === 1 ? data : [...prev, ...data]
                );
                setHasMore(data.length === filters.pageSize);
            } catch {
                setError('Error al cargar viajes. Intenta de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchRides();
    }, [filters]);

    const handleFilterChange = (
        key: keyof RideSearchFilters,
        value: string | undefined
    ) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleDateChange = (dateValue: string) => {
        setSelectedDate(dateValue);
        if (!dateValue) {
            setFilters(prev => ({ ...prev, from: undefined, to: undefined, page: 1 }));
            return;
        }

        const from = new Date(`${dateValue}T00:00:00`).toISOString();
        const to = new Date(`${dateValue}T23:59:59`).toISOString();
        setFilters(prev => ({ ...prev, from, to, page: 1 }));
    };

    const clearFilters = () => {
        setSelectedDate('');
        setFilters({ availableOnly: true, page: 1, pageSize: 10 });
    };

    return (
        <div className="u-ride-dashboard">
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <AppSidebar className={sidebarOpen ? 'open' : ''} />

            <main className="main-content">
                <header className="top-header">
                    <div className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <i className="ti ti-menu-2"></i>
                    </div>
                    <div className="header-spacer" aria-hidden="true"></div>
                    <div className="header-actions">
                        <NotificationBell />
                        <div className="user-profile">
                            <div className="user-text">
                                <span className="user-name">Estudiante UTA</span>
                                <span className="user-status">Modo Pasajero</span>
                            </div>
                            <div className="avatar"></div>
                        </div>
                    </div>
                </header>

                <div className="content-padding">
                    <section className="hero-banner">
                        <h2>¿A DONDE VAS HOY?</h2>
                        <div className="search-form">
                            <div className="input-field">
                                <label>Origen</label>
                                <input
                                    type="text"
                                    placeholder="¿Desde dónde? Ej: El Batán"
                                    value={filters.originZone ?? ''}
                                    onChange={e => handleFilterChange('originZone', e.target.value || undefined)}
                                />
                            </div>
                            <div className="input-field">
                                <label>Destino</label>
                                <input
                                    type="text"
                                    placeholder="¿Hacia dónde? Ej: UTA"
                                    value={filters.destinationZone ?? ''}
                                    onChange={e => handleFilterChange('destinationZone', e.target.value || undefined)}
                                />
                            </div>
                            <div className="input-field">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => handleDateChange(e.target.value)}
                                />
                            </div>
                            <button type="button" className="btn-search" onClick={clearFilters}>
                                Limpiar filtros
                            </button>
                        </div>
                    </section>

                    <div className="dashboard-layout">
                        <section className="results-container">
                            <h3>
                                Viajes Disponibles Ahora {rides.length > 0 ? `(${rides.length})` : ''}
                            </h3>

                            {error && <p style={{ color: '#ef4444' }}>{error}</p>}

                            {!isLoading && rides.length === 0 && (
                                <p>No se encontraron viajes con estos filtros.</p>
                            )}

                            <div className="rides-grid">
                                {rides.map(ride => {
                                    const formattedDate = new Date(ride.departureAt).toLocaleString('es-EC', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    });

                                    return (
                                        <div key={ride.id} className="ride-card">
                                            <div className="card-header">
                                                <div className="driver-info">
                                                    <div
                                                        className="driver-avatar"
                                                        style={{
                                                            backgroundColor: '#1e293b',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {ride.driverName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="driver-meta">
                                                        <span className="driver-name">{ride.driverName}</span>
                                                        <span className="driver-major">Conductor Verificado</span>
                                                    </div>
                                                </div>
                                                <div className="rating-tag">
                                                    <i className="ti ti-star-filled"></i>
                                                    <span>5.0</span>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="route-step">
                                                    <i className="ti ti-circle-dot origin-icon"></i>
                                                    <span>{ride.originZone}</span>
                                                </div>
                                                <div className="route-line"></div>
                                                <div className="route-step">
                                                    <i className="ti ti-map-pin destination-icon"></i>
                                                    <span>{ride.destinationZone}</span>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <div className="ride-meta">
                                                    <div className="meta-item">
                                                        <i className="ti ti-clock"></i>
                                                        <span>{formattedDate}</span>
                                                    </div>
                                                    <div className="meta-item seats">
                                                        <i className="ti ti-users"></i>
                                                        <span>{ride.availableSeats} cupos libres</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-view"
                                                    onClick={() => navigate(`/rides/${ride.id}/join`, { state: { ride } })}
                                                >
                                                    Ver Viaje
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {hasMore && !isLoading && (
                                <button
                                    type="button"
                                    className="btn-search"
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                                >
                                    Cargar más viajes
                                </button>
                            )}

                            {isLoading && <p>Cargando...</p>}

                            {!hasMore && rides.length > 0 && (
                                <p className="text-sm text-gray-500">No hay más viajes disponibles.</p>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SearchRidesView;
