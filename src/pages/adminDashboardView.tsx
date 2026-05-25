// AdminDashboardView.tsx
import React, { useEffect, useState } from 'react';
import { getAdminReports, suspendUser, updateReportStatus } from '../services/adminService';
import type { AdminReport } from '../types/admin';
import './AdminDashboardView.css';

const AdminDashboardView: React.FC = () => {
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAdminReports();
                setReports(data);
            } catch (error) {
                console.error('Error cargando reportes de admin', error);
                setError('No se pudieron cargar los reportes.');
            } finally {
                setIsLoading(false);
            }
        };

        const timer = window.setTimeout(() => {
            void fetchReports();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const filteredReports = reports.filter(report => {
        if (filter === 'All') return true;
        return report.status === filter;
    });

    const handleWarn = () => {
        // Intencionalmente sin acción: no fue requerida por este cambio.
    };

    const handleSuspend = async (report: AdminReport) => {
        if (!window.confirm(`¿Suspender a ${report.reportedName}? Esta acción suspende su acceso.`)) {
            return;
        }

        try {
            setError(null);
            await suspendUser(report.reportedId, { isSuspended: true });
            await updateReportStatus(report.id, 'Resolved');
            setReports((currentReports) =>
                currentReports.map((currentReport) =>
                    currentReport.id === report.id
                        ? { ...currentReport, status: 'Resolved' }
                        : currentReport,
                ),
            );
        } catch (error) {
            console.error('Error al suspender al usuario', error);
            setError('No se pudo suspender al usuario ni actualizar el reporte.');
        }
    };

    const handleDismiss = async (report: AdminReport) => {
        try {
            setError(null);
            await updateReportStatus(report.id, 'Dismissed');
            setReports((currentReports) =>
                currentReports.map((currentReport) =>
                    currentReport.id === report.id
                        ? { ...currentReport, status: 'Dismissed' }
                        : currentReport,
                ),
            );
        } catch (error) {
            console.error('Error al desestimar el reporte', error);
            setError('No se pudo desestimar el reporte.');
        }
    };

    if (isLoading) {
        return (
            <div className="u-ride-layout admin-layout">
                <main className="main-content">
                    <div className="view-container">
                        <p>Cargando reportes...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="u-ride-layout admin-layout">
                <main className="main-content">
                    <div className="view-container">
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="u-ride-layout admin-layout">
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="admin-avatar">U</div>
                    <div className="admin-info">
                        <span className="admin-name">U-Ride Admin</span>
                        <span className="admin-role">Gestión Logística</span>
                    </div>
                </div>

                <nav className="nav-menu">
                    <li className="nav-item active">
                        <i className="ti ti-dashboard"></i>
                        <span>Panel de Control</span>
                    </li>

                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <i className="ti ti-menu-2"></i>
                        </button>
                        <div className="search-bar">
                            <i className="ti ti-search"></i>
                            <input type="text" placeholder="Buscar..." />
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="notification-bell">
                            <i className="ti ti-bell"></i>
                            <span className="badge-dot"></span>
                        </div>
                        <div className="user-profile">
                            <i className="ti ti-user-circle"></i>
                        </div>
                    </div>
                </header>

                <div className="view-container">
                    <div className="page-header">
                        <h1>Panel de Control</h1>
                        <p>Resumen general de la plataforma U-Ride.</p>
                    </div>

                    {/* Reports Table Section */}
                    <section className="table-section card">
                        <div className="section-header">
                            <h2>Gestión de Reportes</h2>
                            <div className="table-actions">
                                <div className="filter-tabs">
                                    <button
                                        className={`filter-btn ${filter === 'All' ? 'active' : ''}`}
                                        onClick={() => setFilter('All')}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        className={`filter-btn ${filter === 'Pending' ? 'active' : ''}`}
                                        onClick={() => setFilter('Pending')}
                                    >
                                        Pendientes <span className="tab-count">2</span>
                                    </button>
                                    <button
                                        className={`filter-btn ${filter === 'Resolved' ? 'active' : ''}`}
                                        onClick={() => setFilter('Resolved')}
                                    >
                                        Resueltos
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>FECHA</th>
                                        <th>DENUNCIANTE</th>
                                        <th>DENUNCIADO</th>
                                        <th>MOTIVO</th>
                                        <th>EVIDENCIA</th>
                                        <th>ESTADO</th>
                                        <th className="text-right">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(report => (
                                        <tr key={report.id}>
                                            <td className="date-cell">
                                                <span className="primary">Hoy, 10:42</span>
                                                <span className="secondary">ID: #R-104</span>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-mini">AG</div>
                                                    <span>{report.reporterName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-mini reported">MR</div>
                                                    <span className="reported-name">{report.reportedName}</span>
                                                </div>
                                            </td>
                                            <td className="reason-cell">{report.reason}</td>
                                            <td>
                                                {report.evidenceUrl ? (
                                                    <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer" className="evidence-link">
                                                        <i className="ti ti-link"></i> Ver captura
                                                    </a>
                                                ) : (
                                                    <span className="no-evidence">Sin evidencia</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${report.status.toLowerCase()}`}>
                                                    {report.status === 'Pending' ? 'Pendiente' : report.status === 'Resolved' ? 'Resuelto' : 'Desestimado'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action warn"
                                                        title="Advertir"
                                                        onClick={() => handleWarn()}
                                                    >
                                                        <i className="ti ti-alert-circle"></i>
                                                    </button>
                                                    <button
                                                        className="btn-action suspend"
                                                        title="Suspender"
                                                        onClick={() => void handleSuspend(report)}
                                                    >
                                                        <i className="ti ti-user-off"></i>
                                                    </button>
                                                    <button
                                                        className="btn-action dismiss"
                                                        title="Desestimar"
                                                        onClick={() => void handleDismiss(report)}
                                                    >
                                                        <i className="ti ti-x"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="table-footer">
                            <span>Mostrando {filteredReports.length} de {reports.length} reportes</span>
                            <div className="pagination">
                                <button className="btn-page" disabled>Anterior</button>
                                <button className="btn-page" disabled>Siguiente</button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardView;
