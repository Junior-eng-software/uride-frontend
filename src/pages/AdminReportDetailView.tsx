import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAdminReports, suspendUser, updateReportStatus } from '../services/adminService';
import type { AdminReport, ReportStatus } from '../types/admin';
import './AdminReportDetailView.css';

type AdminAction = 'warn' | 'suspend' | 'dismiss';
type ToastType = 'success' | 'error';

const getStatusLabel = (status: ReportStatus): string => {
    if (status === 'Pending') return 'Pendiente';
    if (status === 'Resolved') return 'Resuelto';
    return 'Desestimado';
};

const AdminReportDetailView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reportId } = useParams<{ reportId: string }>();
    const initialReport = (location.state as { report?: AdminReport } | null)?.report;

    const [report, setReport] = useState<AdminReport | null>(initialReport ?? null);
    const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
    const [isLoading, setIsLoading] = useState(!initialReport);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<ToastType | null>(null);
    const toastTimerRef = useRef<number | null>(null);

    const showToast = (message: string, type: ToastType) => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        setToastMessage(message);
        setToastType(type);

        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
            setToastType(null);
            toastTimerRef.current = null;
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (report || !reportId) return;

        const fetchReport = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const reports = await getAdminReports();
                const foundReport = reports.find((item) => item.id === reportId) ?? null;

                if (!foundReport) {
                    setError('No se encontro el reporte solicitado.');
                    return;
                }

                setReport(foundReport);
            } catch (fetchError) {
                console.error('Error cargando detalle del reporte', fetchError);
                setError('No se pudo cargar el detalle del reporte.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchReport();
    }, [report, reportId]);

    const confirmAdminAction = async () => {
        if (!report || !selectedAction) return;

        try {
            setIsActionLoading(true);
            setError(null);

            if (selectedAction === 'warn') {
                await updateReportStatus(report.id, 'Resolved');
            }

            if (selectedAction === 'suspend') {
                await suspendUser(report.reportedId, { isSuspended: true });
                await updateReportStatus(report.id, 'Resolved');
            }

            if (selectedAction === 'dismiss') {
                await updateReportStatus(report.id, 'Dismissed');
            }

            const nextStatus: ReportStatus =
                selectedAction === 'dismiss' ? 'Dismissed' : 'Resolved';

            setReport({
                ...report,
                status: nextStatus,
            });

            showToast(
                selectedAction === 'warn'
                    ? 'Advertencia registrada correctamente.'
                    : selectedAction === 'suspend'
                        ? 'Usuario suspendido y reporte resuelto.'
                        : 'Reporte desestimado correctamente.',
                'success',
            );

            setSelectedAction(null);
        } catch (actionError) {
            console.error('Error procesando accion administrativa', actionError);
            showToast('No se pudo procesar la accion administrativa.', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return <p>Cargando detalle del reporte...</p>;
    }

    if (error || !report) {
        return (
            <main className="admin-report-detail-page">
                <button className="btn-back" onClick={() => navigate('/admin')}>
                    Volver al panel
                </button>
                <p>{error ?? 'No se encontro el reporte.'}</p>
            </main>
        );
    }

    return (
        <main className="admin-report-detail-page">
            {isActionLoading && (
                <div className="transaction-overlay">
                    <div className="transaction-box">
                        <span className="spinner"></span>
                        <p>Procesando accion administrativa...</p>
                    </div>
                </div>
            )}

            {toastMessage && toastType && (
                <div className={`floating-toast ${toastType}`}>{toastMessage}</div>
            )}

            <header className="detail-page-header">
                <button className="btn-back" onClick={() => navigate('/admin')}>
                    ← Volver al panel
                </button>

                <div>
                    <span className="detail-eyebrow">Revision administrativa</span>
                    <h1>Detalle del reporte</h1>
                    <p>Revise la informacion completa antes de aplicar una accion administrativa.</p>
                </div>
            </header>

            <section className="report-summary-hero">
                <div>
                    <span className="summary-label">Estado actual</span>
                    <span className={`status-badge ${report.status.toLowerCase()}`}>
                        {getStatusLabel(report.status)}
                    </span>
                </div>

                <div>
                    <span className="summary-label">Reporte</span>
                    <strong className="mono-text">{report.id}</strong>
                </div>
            </section>

            <div className="report-detail-grid">
                <section className="detail-card">
                    <h2>Personas involucradas</h2>

                    <div className="people-grid">
                        <div className="person-card">
                            <span>Denunciante</span>
                            <strong>{report.reporterName}</strong>
                        </div>

                        <div className="person-card reported">
                            <span>Denunciado</span>
                            <strong>{report.reportedName}</strong>
                        </div>
                    </div>
                </section>

                <section className="detail-card">
                    <h2>Informacion del viaje</h2>

                    {report.rideId ? (
                        <p>
                            Viaje relacionado: <strong className="mono-text">{report.rideId}</strong>
                        </p>
                    ) : (
                        <p>No se encontro un viaje relacionado para este reporte.</p>
                    )}
                </section>

                <section className="detail-card full-width">
                    <h2>Motivo completo del reporte</h2>
                    <p className="report-reason-full">{report.reason}</p>
                </section>

                <section className="detail-card full-width">
                    <h2>Evidencia</h2>

                    {report.evidenceUrl ? (
                        <a
                            href={report.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-button"
                        >
                            Abrir evidencia adjunta
                        </a>
                    ) : (
                        <div className="empty-evidence">
                            <strong>Sin evidencia adjunta</strong>
                            <p>
                                Este reporte no contiene evidencia. La decision debe basarse en el motivo registrado y la revision administrativa.
                            </p>
                        </div>
                    )}
                </section>

                <section className="detail-card full-width decision-card">
                    <h2>Decision administrativa</h2>

                    <div className="admin-action-selector">
                        <button
                            className={`action-option warn ${selectedAction === 'warn' ? 'selected' : ''}`}
                            onClick={() => setSelectedAction('warn')}
                            disabled={isActionLoading || report.status !== 'Pending'}
                        >
                            <strong>Advertir</strong>
                            <span>Falta leve o primera incidencia.</span>
                        </button>

                        <button
                            className={`action-option suspend ${selectedAction === 'suspend' ? 'selected' : ''}`}
                            onClick={() => setSelectedAction('suspend')}
                            disabled={isActionLoading || report.status !== 'Pending'}
                        >
                            <strong>Suspender</strong>
                            <span>Conducta grave, reincidencia o riesgo para la comunidad.</span>
                        </button>

                        <button
                            className={`action-option dismiss ${selectedAction === 'dismiss' ? 'selected' : ''}`}
                            onClick={() => setSelectedAction('dismiss')}
                            disabled={isActionLoading || report.status !== 'Pending'}
                        >
                            <strong>Desestimar</strong>
                            <span>Informacion insuficiente o reporte no verificable.</span>
                        </button>
                    </div>

                    {report.status !== 'Pending' && (
                        <p className="resolved-note">
                            Este reporte ya fue procesado. No se pueden aplicar nuevas acciones.
                        </p>
                    )}

                    {selectedAction && report.status === 'Pending' && (
                        <div className={`decision-explanation ${selectedAction}`}>
                            {selectedAction === 'warn' && (
                                <p>La advertencia resuelve el reporte sin suspender al usuario denunciado.</p>
                            )}

                            {selectedAction === 'suspend' && (
                                <p>La suspension restringe el acceso del usuario denunciado y marca el reporte como resuelto.</p>
                            )}

                            {selectedAction === 'dismiss' && (
                                <p>La desestimacion cierra el reporte sin aplicar sancion.</p>
                            )}
                        </div>
                    )}

                    <div className="decision-footer">
                        <button
                            className="btn-secondary"
                            onClick={() => setSelectedAction(null)}
                            disabled={!selectedAction || isActionLoading}
                        >
                            Limpiar seleccion
                        </button>

                        <button
                            className={`btn-confirm-action ${selectedAction ?? ''}`}
                            onClick={() => void confirmAdminAction()}
                            disabled={!selectedAction || isActionLoading || report.status !== 'Pending'}
                        >
                            {isActionLoading
                                ? 'Procesando...'
                                : selectedAction === 'warn'
                                    ? 'Confirmar advertencia'
                                    : selectedAction === 'suspend'
                                        ? 'Confirmar suspension'
                                        : selectedAction === 'dismiss'
                                            ? 'Confirmar desestimacion'
                                            : 'Seleccione una accion'}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default AdminReportDetailView;
