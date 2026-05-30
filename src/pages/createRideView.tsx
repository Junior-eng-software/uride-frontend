import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createRide } from '../services/rideService';
import { getUserMe, type CurrentUser } from '../services/userService';
import { localDatetimeToIso } from '../utils/dateUtils';
import type { CreateRidePayload } from '../types/rides';
import AppSidebar from '../components/layout/AppSidebar';
import './createRideView.css';
import axios from 'axios';

// Interfaz exclusiva para los campos del formulario
interface RideFormData {
    originZone: string;
    destinationZone: string;
    date: string;
    time: string;
    seatCapacity: number;
    estimatedCostPerPassenger: number;
}

type ToastType = 'success' | 'error';

const MINIMUM_DEPARTURE_MINUTES_AHEAD = 15;

const getCombinedDepartureDateTime = (
    dateValue: string,
    timeValue: string,
): Date | null => {
    if (!dateValue || !timeValue) {
        return null;
    }

    const combined = new Date(`${dateValue}T${timeValue}`);

    if (Number.isNaN(combined.getTime())) {
        return null;
    }

    return combined;
};

const validateDepartureDateTime = (
    dateValue: string,
    timeValue: string,
): string | null => {
    const departureDateTime = getCombinedDepartureDateTime(dateValue, timeValue);

    if (!departureDateTime) {
        return 'Selecciona una fecha y hora de salida válidas.';
    }

    const minimumAllowedDateTime = new Date(
        Date.now() + MINIMUM_DEPARTURE_MINUTES_AHEAD * 60 * 1000,
    );

    if (departureDateTime < minimumAllowedDateTime) {
        return 'La fecha y hora del viaje debe ser al menos 15 minutos posterior a la hora actual.';
    }

    return null;
};

const getInitials = (fullName?: string | null): string => {
    if (!fullName) return 'U';

    const parts = fullName.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return 'U';

    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';

    return `${first}${second}`.toUpperCase();
};

const CreateRideView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<ToastType | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const todayInputValue = new Date().toISOString().split('T')[0];

    const { register, handleSubmit, reset, formState: { errors } } = useForm<RideFormData>();

    const showToast = (message: string, type: ToastType) => {
        setToastMessage(message);
        setToastType(type);
    };

    useEffect(() => {
        if (!toastMessage) return;

        const timer = window.setTimeout(() => {
            setToastMessage(null);
            setToastType(null);
        }, 3000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [toastMessage]);

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

        void loadCurrentUser();

        return () => {
            isMounted = false;
        };
    }, []);

    const onSubmit = async (data: RideFormData) => {
        setErrorMessage(null);
        setSuccessMessage(null);

        const origin = data.originZone.trim();
        const destination = data.destinationZone.trim();

        const hasAtLeastOneLetter = (value: string) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value);

        if (!hasAtLeastOneLetter(origin)) {
            const msg = 'El origen debe contener al menos una letra.';
            setErrorMessage(msg);
            showToast(msg, 'error');
            return;
        }

        if (!hasAtLeastOneLetter(destination)) {
            const msg = 'El destino debe contener al menos una letra.';
            setErrorMessage(msg);
            showToast(msg, 'error');
            return;
        }

        const estimatedCost = Number(data.estimatedCostPerPassenger);
        if (Number.isNaN(estimatedCost) || estimatedCost < 0 || estimatedCost > 20 || !/^\d+(\.\d{1,2})?$/.test(String(data.estimatedCostPerPassenger))) {
            const msg = 'El aporte debe ser un valor válido entre $0 y $20 con máximo 2 decimales.';
            setErrorMessage(msg);
            showToast(msg, 'error');
            return;
        }

        const departureError = validateDepartureDateTime(data.date, data.time);

        if (departureError) {
            setErrorMessage(departureError);
            showToast(departureError, 'error');
            return;
        }

        try {
            setIsLoading(true);

            // Unir fecha y hora para transformarlo a ISO 8601 local
            const combinedDateTime = `${data.date}T${data.time}`;
            const isoDepartureAt = localDatetimeToIso(combinedDateTime);

            // Construir el payload exacto que pide el backend
            const payload: CreateRidePayload = {
                originZone: origin,
                destinationZone: destination,
                departureAt: isoDepartureAt,
                seatCapacity: Number(data.seatCapacity),
                notes: null,
                estimatedCostPerPassenger: estimatedCost
            };

            // Enviar al backend
            await createRide(payload);

            const successText = '¡Viaje publicado exitosamente!';
            setSuccessMessage(successText);
            showToast(successText, 'success');
            reset(); // Limpia el formulario

            // Atrapamos el error explícitamente con tipo 'unknown' para respetar reglas estrictas de TS
        } catch (error: unknown) {
            // Si el linter (ESLint) te marca esto como advertencia, puedes borrar esta línea sin problema
            console.error(error);

            let errorMsg = 'Ocurrió un error al intentar publicar el viaje. Intenta de nuevo.';

            if (axios.isAxiosError(error)) {
                const backendMessage =
                    typeof error.response?.data === 'string'
                        ? error.response.data
                        : error.response?.data?.detail ?? error.response?.data?.message;

                if (backendMessage) {
                    errorMsg = backendMessage;
                }
            }

            setErrorMessage(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="u-ride-container">
            {isLoading && (
                <div className="transaction-overlay">
                    <div className="transaction-box">
                        <span className="spinner"></span>
                        <p>Publicando viaje...</p>
                    </div>
                </div>
            )}

            {toastMessage && toastType && (
                <div className={`floating-toast ${toastType}`}>{toastMessage}</div>
            )}

            <AppSidebar />

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className="header-inner">
                        <div className="header-copy">
                            <h1>Crear una nueva ruta</h1>
                            <p>Completa los detalles del viaje para que otros estudiantes puedan solicitar un cupo.</p>
                        </div>
                        <div className="user-profile">
                            <div className="user-info">
                                <span className="user-name">{currentUser?.fullName ?? 'Usuario'}</span>
                                <span className="user-role">Modo Conductor</span>
                            </div>
                            <div className="avatar" aria-label="Iniciales del usuario">
                                {getInitials(currentUser?.fullName)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="view-layout">
                    <form className="form-card" onSubmit={handleSubmit(onSubmit)}>
                        <h2>Detalles del Viaje</h2>

                        {/* Mensajes de feedback */}
                        {errorMessage && <div className="form-error-message">{errorMessage}</div>}
                        {successMessage && <div className="form-success-message">{successMessage}</div>}

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
                                        min={todayInputValue}
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

                        <div className="input-group">
                            <label>Aporte sugerido por pasajero</label>
                            <div className="input-with-icon">
                                <i className="ti ti-coin"></i>
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step="0.01"
                                    placeholder="Ej. 1.50"
                                    defaultValue={0}
                                    {...register('estimatedCostPerPassenger', { required: true })}
                                />
                            </div>
                            <span className="field-hint" style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'block' }}>
                                La app no procesa pagos. Este valor es solo informativo para los pasajeros.
                            </span>
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
