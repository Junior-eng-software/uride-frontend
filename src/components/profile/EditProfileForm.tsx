// src/components/profile/EditProfileForm.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axiosClient';
import { AxiosError } from 'axios';
import './EditProfileForm.css';
import AppSidebar from '../layout/AppSidebar';

import { Link } from 'react-router-dom';

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, ' ');

const isValidFullName = (value: string) =>
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:[-\s][A-Za-zÁÉÍÓÚáéíóúÑñ]+)+$/.test(
        normalizeFullName(value)
    );

// ── Schema Zod para campos editables ───────────────────────────────────
const editProfileSchema = z.object({
    fullName: z.string()
        .refine(isValidFullName, {
            message: 'El nombre debe contener al menos dos palabras y solo letras, tildes, ñ o guiones.'
        }),
    career: z.string().min(1, 'Selecciona o ingresa tu carrera'),
    referenceZone: z.string().max(150, 'Máximo 150 caracteres').optional(),
    phone: z.string()
        .optional()
        .refine(val => !val || /^09\d{8}$/.test(val), {
            message: 'El teléfono debe tener 10 dígitos y empezar con 09.'
        })
});

type EditProfileData = z.infer<typeof editProfileSchema>;

// ── Helper: iniciales para el avatar ──────────────────────────────────
const getInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
};

export default function EditProfileForm() {
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ── Estado adicional solo para UI (nombre cargado para el avatar) ──
    const [loadedName, setLoadedName] = useState('');
    const [institutionalEmail, setInstitutionalEmail] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditProfileData>({
        resolver: zodResolver(editProfileSchema)
    });

    // ── useEffect MODIFICADO ───────────────────────────────────────────
    useEffect(() => {
        api.get('/users/me')
            .then(res => {
                setValue('fullName', res.data.fullName);
                setInstitutionalEmail(res.data.email);
                setValue('career', res.data.career ?? '');
                setValue('referenceZone', res.data.referenceZone ?? '');
                setValue('phone', res.data.phone || '');
                setLoadedName(res.data.fullName);
            })
            .catch(() => {
                setStatusMessage({ type: 'error', text: 'No se pudieron cargar tus datos actuales.' });
            });
    }, [setValue]);

    // ── Guardado de campos editables ───────────────────────────────────
    const onSubmit = async (data: EditProfileData) => {
        setIsLoading(true);
        setStatusMessage(null);

        // Limpiar espacios y preparar el body
        const normalizedFullName = normalizeFullName(data.fullName);
        const payload = {
            fullName: normalizedFullName,
            career: data.career.trim(),
            referenceZone: data.referenceZone?.trim() || null,
            phone: data.phone?.trim() || null
        };

        try {
            const response = await api.put('/users/me', payload);
            if (response.status === 200) {
                setLoadedName(payload.fullName);
                setStatusMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                setStatusMessage({ type: 'error', text: error.response.data.message || 'Error al actualizar.' });
            } else {
                setStatusMessage({ type: 'error', text: 'Error de conexión.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ── Nombre en tiempo real para el avatar ───────────────────────────
    const watchedName = watch('fullName') || loadedName;

    // ── JSX rediseñado ─────────────────────────────────────────────────
    return (
        <div className="ep-app-shell">
            {/* ── Sidebar ── */}
            <AppSidebar />

            {/* ── Contenido principal ── */}
            <main className="ep-main">
                {/* Header */}
                <header className="ep-main-header">
                    <div className="ep-header-breadcrumb">
                        <Link to="/profile" className="ep-breadcrumb-back">
                            <i className="ti ti-arrow-left" aria-hidden="true"></i>
                        </Link>
                        <h1 className="ep-main-title">Editar Perfil</h1>
                    </div>
                    <div className="ep-header-user">
                        <div className="ep-header-avatar">
                            {watchedName ? getInitials(watchedName) : 'U'}
                        </div>
                        <span className="ep-header-name">
                            {watchedName?.split(' ')[0] ?? 'Usuario'}
                        </span>
                    </div>
                </header>

                {/* Área de contenido */}
                <div className="ep-content-area">
                    <div className="ep-profile-card">
                        <Link to="/profile" className="ep-card-cancel-btn" title="Cancelar edición">
                            <i className="ti ti-x" aria-hidden="true"></i>
                        </Link>

                        <div className="ep-avatar-wrapper">
                            <div className="ep-avatar">
                                {watchedName ? getInitials(watchedName) : 'U'}
                            </div>
                            <div className="ep-avatar-edit-ring" title="El avatar se actualiza con tu nombre">
                                <i className="ti ti-pencil" aria-hidden="true"></i>
                            </div>
                        </div>

                        <p className="ep-card-subtitle">
                            Actualiza tu información de cuenta
                        </p>
                        <p className="ep-card-university">
                            Universidad Técnica de Ambato (UTA)
                        </p>

                        {statusMessage && (
                            <div className={`ep-status-alert ep-status-alert--${statusMessage.type}`}>
                                <i className={`ti ${statusMessage.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} aria-hidden="true"></i>
                                <span>{statusMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="ep-form" noValidate>
                            {/* Nombre Completo */}
                            <div className="ep-field-group">
                                <label className="ep-field-label">
                                    <div className="ep-field-label-icon">
                                        <i className="ti ti-user" aria-hidden="true"></i>
                                    </div>
                                    Nombre Completo
                                </label>
                                <div className={`ep-field-wrapper ${errors.fullName ? 'ep-field-wrapper--error' : ''}`}>
                                    <i className="ti ti-user ep-field-icon" aria-hidden="true"></i>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        className="ep-field-input"
                                        {...register('fullName')}
                                    />
                                </div>
                                {errors.fullName && (
                                    <span className="ep-field-error">
                                        <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                                        {errors.fullName.message}
                                    </span>
                                )}
                            </div>

                            {/* Correo Institucional */}
                            <div className="ep-field-group">
                                <label className="ep-field-label">
                                    <div className="ep-field-label-icon">
                                        <i className="ti ti-mail" aria-hidden="true"></i>
                                    </div>
                                    Correo Institucional
                                </label>
                                <div className="ep-field-wrapper ep-field-wrapper--readonly">
                                    <i className="ti ti-mail ep-field-icon" aria-hidden="true"></i>
                                    <input
                                        type="email"
                                        className="ep-field-input"
                                        value={institutionalEmail}
                                        readOnly
                                    />
                                </div>
                                <span className="ep-field-help">
                                    No editable · identifica tu cuenta institucional
                                </span>
                            </div>

                            {/* Carrera */}
                            <div className="ep-field-group">
                                <label className="ep-field-label">
                                    <div className="ep-field-label-icon">
                                        <i className="ti ti-book" aria-hidden="true"></i>
                                    </div>
                                    CARRERA
                                </label>
                                <div className={`ep-field-wrapper ${errors.career ? 'ep-field-wrapper--error' : ''}`}>
                                    <i className="ti ti-book ep-field-icon" aria-hidden="true"></i>
                                    <input
                                        type="text"
                                        placeholder="Ej. Software"
                                        className="ep-field-input"
                                        {...register('career')}
                                    />
                                </div>
                                {errors.career && (
                                    <span className="ep-field-error">
                                        <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                                        {errors.career.message}
                                    </span>
                                )}
                            </div>

                            {/* Zona/Barrio de referencia */}
                            <div className="ep-field-group">
                                <label className="ep-field-label">
                                    <div className="ep-field-label-icon">
                                        <i className="ti ti-map-pin" aria-hidden="true"></i>
                                    </div>
                                    ZONA/BARRIO DE REFERENCIA
                                </label>
                                <div className={`ep-field-wrapper ${errors.referenceZone ? 'ep-field-wrapper--error' : ''}`}>
                                    <i className="ti ti-map-pin ep-field-icon" aria-hidden="true"></i>
                                    <input
                                        type="text"
                                        placeholder="Ej. Huachi Chico"
                                        className="ep-field-input"
                                        maxLength={150}
                                        {...register('referenceZone')}
                                    />
                                </div>
                                {errors.referenceZone && (
                                    <span className="ep-field-error">
                                        <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                                        {errors.referenceZone.message}
                                    </span>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div className="ep-field-group">
                                <label className="ep-field-label">
                                    <div className="ep-field-label-icon">
                                        <i className="ti ti-phone" aria-hidden="true"></i>
                                    </div>
                                    Teléfono
                                    <span className="ep-field-optional">Opcional</span>
                                </label>
                                <div className={`ep-field-wrapper ${errors.phone ? 'ep-field-wrapper--error' : ''}`}>
                                    <i className="ti ti-phone ep-field-icon" aria-hidden="true"></i>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="09XXXXXXXX"
                                        className="ep-field-input"
                                        {...register('phone', {
                                            onChange: (e) => {
                                                const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                e.target.value = onlyDigits;
                                            }
                                        })}
                                    />
                                </div>
                                {errors.phone && (
                                    <span className="ep-field-error">
                                        <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                                        {errors.phone.message}
                                    </span>
                                )}
                            </div>

                            {/* ── Botones de acción ── */}
                            <div className="ep-card-actions">
                                <button
                                    type="submit"
                                    className="ep-btn-save"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <i className="ti ti-loader-2 ep-spin" aria-hidden="true"></i>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-device-floppy" aria-hidden="true"></i>
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>

                                <Link to="/profile" className="ep-btn-cancel">
                                    <i className="ti ti-arrow-back-up" aria-hidden="true"></i>
                                    Cancelar
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
