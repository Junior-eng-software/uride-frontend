import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createRide } from '../services/rideService';
import { localDatetimeToIso } from '../utils/dateUtils';
import type { CreateRidePayload } from '../types/rides';
import './CreateRideView.css';
import axios from 'axios';

// Interfaz exclusiva para los campos del formulario
interface RideFormData {
    originZone: string;
    destinationZone: string;
    date: string;
    time: string;
    seatCapacity: number;
}

const CreateRideView: React.FC = () => {
    const [preferences, setPreferences] = useState({
        music: true,
        pets: false,
        womenOnly: false,
        conversation: true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<RideFormData>();

    const togglePreference = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const onSubmit = async (data: RideFormData) => {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // 1. Mapear preferencias activas a un string. 
            // Eliminamos la destructuración de la clave (_) para evitar el error de ESLint.
            const activePrefs = Object.keys(preferences)
                .filter(key => preferences[key as keyof typeof preferences])
                .map(key => {
                    const labels: Record<string, string> = {
                        music: 'Música', pets: 'Mascotas', womenOnly: 'Solo Mujeres', conversation: 'Conversación'
                    };
                    return labels[key];
                })
                .join(', ');

            const finalNotes = activePrefs ? `Preferencias: ${activePrefs}.` : null;

            // 2. Unir fecha y hora para transformarlo a ISO 8601 local
            const combinedDateTime = `${data.date}T${data.time}`;
            const isoDepartureAt = localDatetimeToIso(combinedDateTime);

            // 3. Construir el payload exacto que pide el backend
            const payload: CreateRidePayload = {
                originZone: data.originZone,
                destinationZone: data.destinationZone,
                departureAt: isoDepartureAt,
                seatCapacity: Number(data.seatCapacity),
                notes: finalNotes
            };

            // 4. Enviar al backend
            await createRide(payload);

            setSuccessMessage('¡Viaje publicado exitosamente!');
            reset(); // Limpia el formulario

            // Atrapamos el error explícitamente con tipo 'unknown' para respetar reglas estrictas de TS
        } catch (error: unknown) {
            // Si el linter (ESLint) te marca esto como advertencia, puedes borrar esta línea sin problema
            console.error(error);

            const errorMsg = axios.isAxiosError(error)
                ? error.response?.data?.detail ?? 'Ocurrió un error al intentar publicar el viaje. Intenta de nuevo.'
                : 'Ocurrió un error al intentar publicar el viaje. Intenta de nuevo.';

            setErrorMessage(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="u-ride-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <i className="ti ti-car"></i>
                    <span>U-Ride</span>
                </div>
                <nav>
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <i className="ti ti-dashboard"></i>
                            <span>Dashboard</span>
                        </li>
                        <li className="nav-item">
                            <i className="ti ti-user"></i>
                            <span>Mi Perfil</span>
                        </li>
                        <li className="nav-item active">
                            <i className="ti ti-route"></i>
                            <span>Publicar Viaje</span>
                        </li>
                        <li className="nav-item">
                            <i className="ti ti-message"></i>
                            <span>Mensajes</span>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <h1>Crear una nueva ruta</h1>
                    <div className="user-profile">
                        <div className="user-info">
                            <span className="user-name">Usuario Conductor</span>
                            <span className="user-role">Modo Conductor</span>
                        </div>
                        <div className="avatar"></div>
                    </div>
                </header>

                <div className="view-layout">
                    {/* Map Column */}
                    <div className="map-placeholder">
                        [Placeholder: Integración futura del Mapa]
                    </div>

                    {/* Form Column */}
                    <form className="form-card" onSubmit={handleSubmit(onSubmit)}>
                        <h2>Detalles del Viaje</h2>

                        {/* Mensajes de feedback */}
                        {errorMessage && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errorMessage}</div>}
                        {successMessage && <div style={{ color: 'green', fontSize: '0.875rem', fontWeight: 'bold' }}>{successMessage}</div>}

                        <div className="input-group">
                            <label>Origen</label>
                            <div className="input-with-icon">
                                <i className="ti ti-circle-dot"></i>
                                <input
                                    type="text"
                                    placeholder="Campus UTA (Huachi)"
                                    {...register('originZone', { required: true })}
                                />
                            </div>
                            {errors.originZone && <span style={{ color: 'red', fontSize: '0.75rem' }}>Requerido</span>}
                        </div>

                        <div className="input-group">
                            <label>Destino</label>
                            <div className="input-with-icon">
                                <i className="ti ti-map-pin"></i>
                                <input
                                    type="text"
                                    placeholder="¿Hacia dónde vas?"
                                    {...register('destinationZone', { required: true })}
                                />
                            </div>
                            {errors.destinationZone && <span style={{ color: 'red', fontSize: '0.75rem' }}>Requerido</span>}
                        </div>

                        <div className="date-time-row">
                            <div className="input-group">
                                <label>Fecha</label>
                                <div className="input-with-icon">
                                    <i className="ti ti-calendar"></i>
                                    <input
                                        type="date"
                                        {...register('date', { required: true })}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Hora de Salida</label>
                                <div className="input-with-icon">
                                    <i className="ti ti-clock"></i>
                                    <input
                                        type="time"
                                        {...register('time', { required: true })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Plazas Disponibles (Pasajeros)</label>
                            <div className="input-with-icon">
                                <i className="ti ti-users"></i>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    defaultValue={3}
                                    {...register('seatCapacity', { required: true, min: 1, max: 4 })}
                                />
                            </div>
                        </div>

                        <div className="preferences-section">
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
                                Preferencias del Viaje
                            </label>
                            <div className="preference-grid">
                                <button
                                    type="button"
                                    className={`toggle-btn ${preferences.music ? 'active' : ''}`}
                                    onClick={() => togglePreference('music')}
                                >
                                    <i className="ti ti-music"></i>
                                    <span>Música</span>
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${preferences.pets ? 'active' : ''}`}
                                    onClick={() => togglePreference('pets')}
                                >
                                    <i className="ti ti-paw"></i>
                                    <span>Mascotas</span>
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${preferences.womenOnly ? 'active' : ''}`}
                                    onClick={() => togglePreference('womenOnly')}
                                >
                                    <i className="ti ti-woman"></i>
                                    <span>Solo Mujeres</span>
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${preferences.conversation ? 'active' : ''}`}
                                    onClick={() => togglePreference('conversation')}
                                >
                                    <i className="ti ti-messages"></i>
                                    <span>Conversación</span>
                                </button>
                            </div>
                        </div>

                        <button className="submit-btn" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <span>Publicando...</span>
                            ) : (
                                <>
                                    <i className="ti ti-send"></i>
                                    Publicar Viaje
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateRideView;