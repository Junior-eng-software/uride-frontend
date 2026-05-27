import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getRideRatings, submitRideRating } from '../services/ratingService';
import type { Ride } from '../types/rides';
import type { RatingNavigationState } from '../types/rating';
import { getCurrentUserId } from '../utils/auth';
import ReportUserModal from '../components/ReportUserModal';
import AppSidebar from '../components/layout/AppSidebar';
import './RideRatingView.css';

const RideRatingView: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rating, setRating] = useState<number>(4);
    const [review, setReview] = useState<string>('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ride = location.state?.ride as Ride | undefined;
    const rateeState = location.state as RatingNavigationState | undefined;
    const currentUserId = getCurrentUserId();

    const rateeId = rateeState?.rateeId;
    const rateeName = rateeState?.rateeName ?? 'Usuario';
    const rateeInitials = rateeName.trim().slice(0, 2).toUpperCase() || 'US';
    const originZone = ride?.originZone ?? 'Origen no disponible';
    const destinationZone = ride?.destinationZone ?? 'Destino no disponible';

    useEffect(() => {
        if (rateeId) {
            return;
        }

        navigate('/rides/search');
    }, [navigate, rateeId]);

    const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);

    const handleStarClick = useCallback((value: number) => {
        setRating(value);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!id) {
            setSubmitError('No se encontró el viaje para enviar la calificación.');
            return;
        }

        if (!rateeId) {
            setSubmitError('No se pudo identificar al usuario a calificar.');
            return;
        }

        try {
            setSubmitError(null);
            setIsSubmitting(true);

            // Verificación defensiva — protege contra acceso directo por URL
            const currentRatings = await getRideRatings(id);
            const alreadyRated = currentRatings.some(
                r => r.raterId === currentUserId && r.rateeId === rateeId
            );

            if (alreadyRated) {
                setSubmitError('Ya enviaste una calificación para este usuario en este viaje.');
                return;
            }

            await submitRideRating(id, {
                rateeId,
                score: rating,
                comment: review.trim() || undefined,
            });

            navigate('/dashboard', {
                state: { successMessage: 'Calificación enviada correctamente' },
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setSubmitError('Esta calificación ya fue enviada anteriormente.');
                return;
            }
            console.error('Error al enviar la calificación', error);
            setSubmitError('Hubo un problema al guardar tu calificación.');
        } finally {
            setIsSubmitting(false);
        }
    }, [id, navigate, rateeId, rating, review, currentUserId]);

    const handleReport = useCallback(() => {
        setIsReportOpen(true);
    }, []);

    if (!ride) {
        return null;
    }

    return (
        <div className="u-ride-layout">
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <AppSidebar className={sidebarOpen ? 'open' : ''} />

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <div className="menu-toggle" onClick={toggleSidebar}>
                            <i className="ti ti-menu-2" aria-hidden="true"></i>
                        </div>
                        <h1>Resumen del Viaje</h1>
                    </div>
                    <div className="user-profile">
                        <div className="avatar-small" aria-hidden="true">
                            <i className="ti ti-device-mobile"></i>
                        </div>
                    </div>
                </header>

                <div className="view-container">
                    <div className="rating-card">
                        <div className="grid-layout">
                            <section className="profile-column">
                                <div className="avatar-large">{rateeInitials}</div>
                                <div className="driver-name">{rateeName}</div>
                                <div className="driver-sub">Conductor</div>

                                <div className="route-summary" style={{ marginTop: '1.5rem' }}>
                                    <h4 className="section-label">Ruta del Viaje</h4>
                                    <div className="route-item">
                                        <i className="ti ti-map-pin origin" aria-hidden="true"></i>
                                        <span>{originZone}</span>
                                    </div>
                                    <div className="route-line" />
                                    <div className="route-item">
                                        <i className="ti ti-map-pin-filled destination" aria-hidden="true"></i>
                                        <span>{destinationZone}</span>
                                    </div>
                                </div>
                            </section>

                            <form className="form-column" onSubmit={handleSubmit}>
                                <h3 className="welcome-title">Califica tu experiencia con {rateeName}</h3>
                                <p className="description">
                                    Tu opinión ayuda a mantener la comunidad de U-Ride segura y confiable para todos los estudiantes.
                                </p>

                                <div className="rating-section">
                                    <label className="input-label">1. Califica tu experiencia con {rateeName}</label>
                                    <div className="stars-container" aria-label="Selector de calificación">
                                        {[1, 2, 3, 4, 5].map((starValue) => {
                                            const isSelected = starValue <= rating;

                                            return (
                                                <button
                                                    key={starValue}
                                                    className={`star-btn ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleStarClick(starValue)}
                                                    type="button"
                                                    aria-label={`Calificar con ${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
                                                    aria-pressed={isSelected}
                                                >
                                                    <span aria-hidden="true">{isSelected ? '★' : '☆'}</span>
                                                </button>
                                            );
                                        })}

                                        <span className="rating-value">{rating}.0</span>
                                    </div>
                                </div>

                                <div className="review-section">
                                    <label className="input-label">2. Escribe una reseña pública (Opcional)</label>
                                    <textarea
                                        placeholder="¿Cómo fue la conducción? ¿El ambiente en el vehículo fue agradable?"
                                        value={review}
                                        onChange={(e) => setReview(e.target.value)}
                                        aria-label="Reseña pública sobre el viaje"
                                    />
                                </div>

                                {submitError && (
                                    <p
                                        style={{
                                            color: submitError === 'Reporte enviado correctamente.' ? '#16a34a' : '#ef4444',
                                            fontSize: '0.875rem',
                                            marginBottom: '1rem',
                                        }}
                                    >
                                        {submitError}
                                    </p>
                                )}

                                <footer className="card-footer rating-actions">
                                    <button className="btn-report-modern" type="button" onClick={handleReport}>
                                        <span className="btn-icon-soft">
                                            <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                                        </span>
                                        <span>Reportar problema grave</span>
                                    </button>

                                    <button
                                        className="btn-submit-modern"
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        <span>
                                            {isSubmitting ? 'Publicando...' : 'Publicar calificación'}
                                        </span>

                                        <i
                                            className={`ti ${isSubmitting ? 'ti-loader-2' : 'ti-send'}`}
                                            aria-hidden="true"
                                        ></i>
                                    </button>
                                </footer>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <ReportUserModal
                isOpen={isReportOpen}
                onClose={(submitted?: boolean) => {
                    setIsReportOpen(false);
                    if (submitted) {
                        setSubmitError('Reporte enviado correctamente.');
                    }
                }}
                reportedId={rateeId ?? ''}
                reportedName={rateeName ?? 'Usuario'}
                rideId={id ?? ''}
            />
        </div>
    );
};

export default RideRatingView;
