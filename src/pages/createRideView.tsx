import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createRide } from '../services/rideService';
import { localDatetimeToIso } from '../utils/dateUtils';
import type { CreateRidePayload } from '../types/rides';
import AppSidebar from '../components/layout/AppSidebar';
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
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<RideFormData>();

    const onSubmit = async (data: RideFormData) => {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // Unir fecha y hora para transformarlo a ISO 8601 local
            const combinedDateTime = `${data.date}T${data.time}`;
            const isoDepartureAt = localDatetimeToIso(combinedDateTime);

            // Construir el payload exacto que pide el backend
            const payload: CreateRidePayload = {
                originZone: data.originZone,
                destinationZone: data.destinationZone,
                departureAt: isoDepartureAt,
                seatCapacity: Number(data.seatCapacity),
                notes: null
            };

            // Enviar al backend
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
            <AppSidebar />

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