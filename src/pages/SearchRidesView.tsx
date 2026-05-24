import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchRides } from '../services/rideService';
import type { Ride, RideSearchFilters } from '../types/rides';
import { localDatetimeToIso } from '../utils/dateUtils';
import './SearchRidesView.css';
import { useNavigate } from 'react-router-dom';

const SearchRidesView: React.FC = () => {
    // 1. Estados de la Interfaz (Stitch)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filters, setFilters] = useState({
        onlyWomen: false,
        musicAllowed: true,
        petsAllowed: false,
        minRating: '4.0',
    });

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

            // 1. Traemos los viajes desde .NET (filtrando solo por origen/destino/fecha)
            const rawData = await searchRides(searchParams);

            // 2. [NUEVO] Filtramos en memoria usando los checkboxes del sidebar
            const filteredData = rawData.filter(ride => {
                // El campo notes podría ser null, lo convertimos a string vacío por seguridad
                const rideNotes = ride.notes || "";

                // Si el usuario marcó "Solo mujeres", exigimos que la nota contenga esa frase
                if (filters.onlyWomen && !rideNotes.includes('Solo Mujeres')) return false;

                // Si el usuario marcó "Música", exigimos que la nota la contenga
                if (filters.musicAllowed && !rideNotes.includes('Música')) return false;

                // Si el usuario marcó "Mascotas", exigimos que la nota la contenga
                if (filters.petsAllowed && !rideNotes.includes('Mascotas')) return false;

                return true; // Si pasa todos los filtros (o si no hay filtros activos), lo mostramos
            });

            // 3. Guardamos los viajes ya filtrados
            setRides(filteredData);

        } catch (err) {
            console.error(err);
            setError('Error al cargar los viajes disponibles desde el servidor.');
        } finally {
            setIsLoading(false);
        }
    }, [originFilter, destinationFilter, dateFilter, filters]);

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

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="logo">
                    <i className="ti ti-car"></i>
                    <span>U-Ride</span>
                </div>
                <nav>
                    <ul className="nav-menu">
                        <li className="nav-item active"><i className="ti ti-dashboard"></i><span>Dashboard</span></li>
                        <li className="nav-item"><i className="ti ti-user"></i><span>Mi Perfil</span></li>
                        <li className="nav-item"><i className="ti ti-route"></i><span>Mis Viajes</span></li>
                        <li className="nav-item"><i className="ti ti-message"></i><span>Mensajes</span></li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <i className="ti ti-menu-2"></i>
                    </div>
                    <div className="search-bar">
                        <i className="ti ti-search"></i>
                        <input type="text" placeholder="Buscar viajes, usuarios..." />
                    </div>
                    <div className="header-actions">
                        <div className="notification-icon">
                            <i className="ti ti-bell"></i>
                            <span className="badge">2</span>
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
                        {/* Filters Sidebar */}
                        <aside className="filters-card">
                            <div className="filter-group">
                                <h3><i className="ti ti-adjustments-horizontal"></i> Filtros</h3>
                                <div className="filter-section">
                                    <label className="section-label">PREFERENCIAS</label>
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={filters.onlyWomen}
                                            onChange={(e) => setFilters({ ...filters, onlyWomen: e.target.checked })}
                                        />
                                        <span>Solo mujeres</span>
                                    </label>
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={filters.musicAllowed}
                                            onChange={(e) => setFilters({ ...filters, musicAllowed: e.target.checked })}
                                        />
                                        <span>Música permitida</span>
                                    </label>
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={filters.petsAllowed}
                                            onChange={(e) => setFilters({ ...filters, petsAllowed: e.target.checked })}
                                        />
                                        <span>Mascotas permitidas</span>
                                    </label>
                                </div>

                                <div className="filter-section">
                                    <label className="section-label">PUNTUACIÓN MÍNIMA</label>
                                    <select
                                        className="select-filter"
                                        value={filters.minRating}
                                        onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                                    >
                                        <option value="4.0">4.0 Estrellas o más</option>
                                        <option value="4.5">4.5 Estrellas o más</option>
                                    </select>
                                </div>
                            </div>
                        </aside>

                        {/* Results Grid */}
                        <section className="results-container">
                            <h3>
                                Viajes Disponibles Ahora {rides.length > 0 ? `(${rides.length})` : ''}
                            </h3>

                            {isLoading && <p>Cargando rutas disponibles desde el servidor...</p>}
                            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                            {!isLoading && !error && rides.length === 0 && (
                                <p style={{ color: '#64748b', padding: '2rem 0' }}>No se encontraron viajes con estos filtros.</p>
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