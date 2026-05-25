import React, { useState } from 'react';
import { submitReport } from '../services/reportService';
import '../pages/reportUserModal.css';

interface ReportUserModalProps {
    isOpen: boolean;
    onClose: (submitted?: boolean) => void;
    reportedId: string;
    reportedName: string;
    rideId: string;
}

const ReportUserModal: React.FC<ReportUserModalProps> = ({
    isOpen,
    onClose,
    reportedId,
    reportedName,
    rideId,
}) => {
    const [reason, setReason] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    if (!isOpen) return null;

    const isReasonValid = reason.trim().length >= 10;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReasonValid) return;

        await submitReport({
            reportedId,
            rideId,
            reason: reason.trim(),
            evidenceUrl: evidenceUrl.trim() || undefined,
        });

        setReason('');
        setEvidenceUrl('');
        onClose(true);
    };

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Reportar a {reportedName}</h2>
                    <button className="btn-close" onClick={() => onClose()}>
                        <i className="ti ti-x"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="report-form">
                            <div className="input-group">
                                <label htmlFor="reason">Motivo del reporte (Obligatorio)</label>
                                <textarea
                                    id="reason"
                                    placeholder="Describe detalladamente la conducta indebida o el problema ocurrido durante el viaje..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                ></textarea>
                                <span className={`validation-hint ${reason.length > 0 && !isReasonValid ? 'invalid' : ''}`}>
                                    {isReasonValid
                                        ? 'Longitud minima cumplida'
                                        : `Minimo 10 caracteres (faltan ${Math.max(0, 10 - reason.length)})`}
                                </span>
                            </div>

                            <div className="input-group">
                                <label htmlFor="evidence">Enlace de evidencia (Opcional)</label>
                                <input
                                    id="evidence"
                                    type="url"
                                    placeholder="https://ejemplo.com/evidencia"
                                    value={evidenceUrl}
                                    onChange={(e) => setEvidenceUrl(e.target.value)}
                                />
                                <span className="validation-hint">
                                    Puedes incluir un enlace a imagenes o capturas que respalden tu reporte.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => onClose()}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={!isReasonValid}
                        >
                            Enviar Reporte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportUserModal;
