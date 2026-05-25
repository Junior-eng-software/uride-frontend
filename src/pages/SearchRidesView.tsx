import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchRides } from '../services/rideService';
import type { Ride, RideSearchFilters } from '../types/rides';
import { localDatetimeToIso } from '../utils/dateUtils';
import './SearchRidesView.css';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/layout/AppSidebar';

const SearchRidesView: React.FC = () => {
    // 1. Estados de la Interfaz
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // 2. Estados Lógicos (Backend)
    const [rides, setRides] = useState<Ride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 3. Estados del Formulario de Búsqueda
    const [originFilter, setOriginFilter] = useState('');
    const [destinationFilter, setDestinationFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const navigate = useNavigate();
    // 4. Función Principal de Búsqueda
    const fetchRides = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const searchParams: RideSearchFilters = {
                originZone: originFilter || undefined,
                destinationZone: destinationFilter || undefined,
                availableOnly: true,
            };

            if (dateFilter) {
                searchParams.from = localDatetimeToIso(`${dateFilter}T00:00:00`);
                searchParams.to = localDatetimeToIso(`${dateFilter}T23:59:59`);
            }

            const rawData = await searchRides(searchParams);
            setRides(rawData);

        } catch (err) {
            console.error(err);
            setError('Error al cargar los viajes disponibles desde el servidor.');
        } finally {
            setIsLoading(false);
        }
    }, [originFilter, destinationFilter, dateFilter]);

    // Ejecutar búsqueda automática al cargar la pantalla
    const initialFetchDoneRef = useRef(false);
    useEffect(() => {
        if (initialFetchDoneRef.current) {
            return;
        }

        initialFetchDoneRef.current = true;
        const timer = setTimeout(() => {
            void fetchRides();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchRides]);

    // Manejar el botón de Buscar
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRides();
    };

    return (
        <div className="u-ride-dashboard">
            {/* Sidebar Mobile Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            <AppSidebar className={sidebarOpen ? 'open' : ''} />

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <i className="ti ti-menu-2"></i>
                    </div>
                    <div className="header-spacer" aria-hidden="true"></div>
                    <div className="header-actions">
                        <div className="notification-icon">
                            <i className="ti ti-bell"></i>
                        </div>
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
                    {/* Hero Banner (Ahora es un form funcional) */}
                    <section className="hero-banner">
                        <h2>¿A DÓNDE VAS HOY?</h2>
                        <form className="search-form" onSubmit={handleSearch}>
                            <div className="input-field">
                                <label>Origen</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Campus Huachi"
                                    value={originFilter}
                                    onChange={(e) => setOriginFilter(e.target.value)}
                                />
                            </div>
                            <div className="input-field">
                                <label>Destino</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Zona Norte"
                                    value={destinationFilter}
                                    onChange={(e) => setDestinationFilter(e.target.value)}
                                />
                            </div>
                            <div className="input-field">
                                <label>Fecha</label>
                                {/* Cambiado a type="date" para consistencia con el ISO 8601 */}
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn-search">Buscar Viajes</button>
                        </form>
                    </section>

                    <div className="dashboard-layout">
                        <section className="results-container">
                            <h3>
                                Viajes Disponibles Ahora {rides.length > 0 ? `(${rides.length})` : ''}
                            </h3>

                            {isLoading && <p>Cargando rutas disponibles desde el servidor...</p>}
                            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                            {!isLoading && !error && rides.length === 0 && (
                                <p style={{ color: '#64748b', padding: '2rem 0' }}>No se encontraron viajes con estos criterios de búsqueda.</p>
                            )}

                            <div className="rides-grid">
                                {/* Mapeo de datos REALES de la base de datos */}
                                {!isLoading && rides.map(ride => {
                                    const formattedDate = new Date(ride.departureAt).toLocaleString('es-EC', {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                    });

                                    return (
                                        <div key={ride.id} className="ride-card">
                                            <div className="card-header">
                                                <div className="driver-info">
                                                    {/* Inicial del conductor como avatar */}
                                                    <div className="driver-avatar" style={{ backgroundColor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                        {ride.driverName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="driver-meta">
                                                        <span className="driver-name">{ride.driverName}</span>
                                                        <span className="driver-major">Conductor Verificado</span>
                                                    </div>
                                                </div>
                                                <div className="rating-tag">
                                                    <i className="ti ti-star-filled"></i>
                                                    <span>5.0</span> {/* Dato hardcodeado hasta el módulo de ratings */}
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
                                                    // [CAMBIO CLAVE] Agregamos el objeto `ride` al estado de la navegación
                                                    onClick={() => navigate(`/rides/${ride.id}/join`, { state: { ride } })}
                                                >
                                                    Ver Viaje
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SearchRidesView;