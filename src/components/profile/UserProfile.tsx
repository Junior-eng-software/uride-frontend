import { useEffect, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axiosClient';
import AppSidebar from '../layout/AppSidebar';
import './UserProfile.css';

interface UserProfileData {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    career?: string | null;
    referenceZone?: string | null;
    isVerified: boolean;
}

interface ProfileFormData {
    fullName: string;
    career: string;
    referenceZone: string;
    phone: string;
}

type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, ' ');

const isValidFullName = (value: string) =>
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:[-\s][A-Za-zÁÉÍÓÚáéíóúÑñ]+)+$/.test(
        normalizeFullName(value)
    );

const getInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
};

export default function UserProfile() {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [formData, setFormData] = useState<ProfileFormData | null>(null);
    const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get<UserProfileData>('/users/me');
                setProfileData(response.data);
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 401) {
                    setStatusMessage({ type: 'error', text: 'Sesión expirada o no autorizada.' });
                } else {
                    setStatusMessage({ type: 'error', text: 'Ocurrió un error al cargar tu perfil.' });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile().catch(console.error);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const handleEdit = () => {
        if (!profileData) return;

        setFormData({
            fullName: profileData.fullName ?? '',
            career: profileData.career ?? '',
            referenceZone: profileData.referenceZone ?? '',
            phone: profileData.phone ?? ''
        });
        setFormErrors({});
        setStatusMessage(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(null);
        setFormErrors({});
        setStatusMessage(null);
        setIsEditing(false);
    };

    const updateFormField = (field: keyof ProfileFormData, value: string) => {
        setFormData(current => current ? { ...current, [field]: value } : current);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formData || !profileData) return;

        const normalizedFullName = normalizeFullName(formData.fullName);
        const normalizedCareer = formData.career.trim();
        const normalizedReferenceZone = formData.referenceZone.trim();
        const normalizedPhone = formData.phone.trim();
        const nextErrors: ProfileFormErrors = {};

        if (!isValidFullName(normalizedFullName)) {
            nextErrors.fullName = 'El nombre debe contener al menos dos palabras y solo letras, tildes, ñ o guiones.';
        }
        if (!normalizedCareer) {
            nextErrors.career = 'Ingresa tu carrera.';
        }
        if (normalizedReferenceZone.length > 150) {
            nextErrors.referenceZone = 'Máximo 150 caracteres.';
        }
        if (normalizedPhone && !/^09\d{8}$/.test(normalizedPhone)) {
            nextErrors.phone = 'El teléfono debe tener 10 dígitos y empezar con 09.';
        }

        if (Object.keys(nextErrors).length) {
            setFormErrors(nextErrors);
            return;
        }

        const payload = {
            fullName: normalizedFullName,
            career: normalizedCareer,
            referenceZone: normalizedReferenceZone || null,
            phone: normalizedPhone || null
        };

        setIsSaving(true);
        setFormErrors({});
        setStatusMessage(null);

        try {
            const response = await api.put('/users/me', payload);
            setProfileData({
                ...profileData,
                fullName: payload.fullName,
                career: payload.career,
                referenceZone: payload.referenceZone,
                phone: payload.phone
            });
            setFormData(null);
            setIsEditing(false);
            setStatusMessage({ type: 'success', text: response.data.message || 'Perfil actualizado correctamente.' });
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                setStatusMessage({ type: 'error', text: error.response.data.message || 'Error al actualizar el perfil.' });
            } else {
                setStatusMessage({ type: 'error', text: 'Error de conexión.' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="up-app-shell">
                <AppSidebar />
                <main className="up-main">
                    <div className="up-skeleton-wrapper">
                        <div className="up-skeleton up-skeleton--avatar"></div>
                        <div className="up-skeleton up-skeleton--line"></div>
                        <div className="up-skeleton up-skeleton--line-short"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="up-app-shell">
                <AppSidebar />
                <main className="up-main">
                    <div className="up-error-card">
                        <i className="ti ti-shield-off" aria-hidden="true"></i>
                        <h3>Acceso denegado</h3>
                        <p>{statusMessage?.text ?? 'No se pudo cargar tu perfil.'}</p>
                        <button className="up-btn-logout" onClick={handleLogout}>
                            <i className="ti ti-login" aria-hidden="true"></i>
                            Volver al inicio de sesión
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="up-app-shell">
            <AppSidebar />
            <main className="up-main">
                <header className="up-main-header">
                    <div>
                        <h1 className="up-main-title">Mi Perfil Universitario</h1>
                        <p className="up-main-subtitle">Información personal e institucional de tu cuenta</p>
                    </div>
                    <div className="up-header-user">
                        <div className="up-header-avatar">{getInitials(profileData.fullName)}</div>
                        <span className="up-header-name">{profileData.fullName}</span>
                    </div>
                </header>

                <div className="up-content-area">
                    <section className="up-profile-card">
                        <div className="up-profile-summary">
                            <div className="up-avatar-wrapper">
                                <div className="up-avatar">{getInitials(profileData.fullName)}</div>
                                {profileData.isVerified && (
                                    <div className="up-avatar-badge" title="Cuenta verificada">
                                        <i className="ti ti-check" aria-hidden="true"></i>
                                    </div>
                                )}
                            </div>
                            <div className="up-profile-heading">
                                <h2 className="up-profile-name">{profileData.fullName}</h2>
                                <p className="up-profile-university">Universidad Técnica de Ambato (UTA)</p>
                                <div className={`up-verify-badge ${profileData.isVerified ? 'up-verify-badge--ok' : 'up-verify-badge--pending'}`}>
                                    <i className={`ti ${profileData.isVerified ? 'ti-shield-check' : 'ti-shield-exclamation'}`} aria-hidden="true"></i>
                                    {profileData.isVerified ? 'Cuenta Verificada' : 'Verificación Pendiente'}
                                </div>
                            </div>
                        </div>

                        {statusMessage && (
                            <div className={`up-status-alert up-status-alert--${statusMessage.type}`}>
                                <i className={`ti ${statusMessage.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`} aria-hidden="true"></i>
                                <span>{statusMessage.text}</span>
                            </div>
                        )}

                        {isEditing && formData ? (
                            <form className="up-edit-form" onSubmit={handleSubmit} noValidate>
                                <div className="up-section">
                                    <h3 className="up-section-title">Información personal</h3>
                                    <div className="up-fields-grid">
                                        <label className="up-field-group">
                                            <span className="up-field-label">Nombre completo</span>
                                            <input
                                                className={`up-field-input ${formErrors.fullName ? 'up-field-input--error' : ''}`}
                                                value={formData.fullName}
                                                onChange={event => updateFormField('fullName', event.target.value)}
                                            />
                                            {formErrors.fullName && <span className="up-field-error">{formErrors.fullName}</span>}
                                        </label>
                                        <label className="up-field-group">
                                            <span className="up-field-label">Carrera</span>
                                            <input
                                                className={`up-field-input ${formErrors.career ? 'up-field-input--error' : ''}`}
                                                value={formData.career}
                                                onChange={event => updateFormField('career', event.target.value)}
                                            />
                                            {formErrors.career && <span className="up-field-error">{formErrors.career}</span>}
                                        </label>
                                        <label className="up-field-group">
                                            <span className="up-field-label">Zona/Barrio de referencia</span>
                                            <input
                                                className={`up-field-input ${formErrors.referenceZone ? 'up-field-input--error' : ''}`}
                                                value={formData.referenceZone}
                                                maxLength={150}
                                                onChange={event => updateFormField('referenceZone', event.target.value)}
                                            />
                                            {formErrors.referenceZone && <span className="up-field-error">{formErrors.referenceZone}</span>}
                                        </label>
                                        <label className="up-field-group">
                                            <span className="up-field-label">Teléfono <small>Opcional</small></span>
                                            <input
                                                className={`up-field-input ${formErrors.phone ? 'up-field-input--error' : ''}`}
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                value={formData.phone}
                                                onChange={event => updateFormField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                                            />
                                            {formErrors.phone && <span className="up-field-error">{formErrors.phone}</span>}
                                        </label>
                                    </div>
                                </div>

                                <div className="up-section">
                                    <h3 className="up-section-title">Información institucional</h3>
                                    <div className="up-fields-grid">
                                        <label className="up-field-group">
                                            <span className="up-field-label">Correo institucional</span>
                                            <input className="up-field-input up-field-input--readonly" value={profileData.email} readOnly />
                                            <small className="up-field-help">No editable · identifica tu cuenta institucional</small>
                                        </label>
                                        <ProfileReadOnlyField label="Universidad" value="Universidad Técnica de Ambato (UTA)" />
                                        <ProfileReadOnlyField label="Estado de verificación" value={profileData.isVerified ? 'Cuenta verificada' : 'Verificación pendiente'} />
                                        <ProfileReadOnlyField label="ID de cuenta" value={profileData.id} mono />
                                    </div>
                                </div>

                                <div className="up-card-actions up-card-actions--row">
                                    <button type="submit" className="up-btn-edit" disabled={isSaving}>
                                        <i className={`ti ${isSaving ? 'ti-loader-2 up-spin' : 'ti-device-floppy'}`} aria-hidden="true"></i>
                                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                    <button type="button" className="up-btn-cancel" onClick={handleCancel} disabled={isSaving}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="up-sections-grid">
                                    <div className="up-section">
                                        <h3 className="up-section-title">Información institucional</h3>
                                        <ProfileInfoRow icon="ti-mail" label="Correo institucional" value={profileData.email} />
                                        <ProfileInfoRow icon="ti-building" label="Universidad" value="Universidad Técnica de Ambato (UTA)" />
                                        <ProfileInfoRow icon="ti-book" label="Carrera" value={profileData.career} />
                                        <ProfileInfoRow icon="ti-shield-check" label="Estado" value={profileData.isVerified ? 'Cuenta verificada' : 'Verificación pendiente'} />
                                    </div>
                                    <div className="up-section">
                                        <h3 className="up-section-title">Información de contacto</h3>
                                        <ProfileInfoRow icon="ti-map-pin" label="Zona/Barrio de referencia" value={profileData.referenceZone} />
                                        <ProfileInfoRow icon="ti-phone" label="Teléfono" value={profileData.phone} />
                                        <ProfileInfoRow icon="ti-id-badge" label="ID de cuenta" value={profileData.id} mono />
                                    </div>
                                </div>

                                <div className="up-card-divider"></div>
                                <div className="up-card-actions up-card-actions--row">
                                    <button className="up-btn-edit" onClick={handleEdit}>
                                        <i className="ti ti-edit" aria-hidden="true"></i>
                                        Editar perfil
                                    </button>
                                    <button className="up-btn-logout" onClick={handleLogout}>
                                        <i className="ti ti-logout" aria-hidden="true"></i>
                                        Cerrar sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function ProfileInfoRow({ icon, label, value, mono = false }: { icon: string, label: string, value?: string | null, mono?: boolean }) {
    return (
        <div className="up-info-row">
            <div className="up-info-icon"><i className={`ti ${icon}`} aria-hidden="true"></i></div>
            <div className="up-info-content">
                <span className="up-info-label">{label}</span>
                <span className={`up-info-value ${mono ? 'up-info-value--mono' : ''}`}>
                    {value || <span className="up-info-empty">No registrado</span>}
                </span>
            </div>
        </div>
    );
}

function ProfileReadOnlyField({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
    return (
        <label className="up-field-group">
            <span className="up-field-label">{label}</span>
            <input className={`up-field-input up-field-input--readonly ${mono ? 'up-field-input--mono' : ''}`} value={value} readOnly />
        </label>
    );
}
