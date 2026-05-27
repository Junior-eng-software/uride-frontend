import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/notifications/NotificationBell';
import { getAdminReports } from '../services/adminService';
import type { AdminReport, ReportStatus } from '../types/admin';
import './adminDashboardView.css';

type ReportFilter = 'All' | 'Pending' | 'Resolved';

const getInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
};

const getStatusLabel = (status: ReportStatus): string => {
    if (status === 'Pending') return 'Pendiente';
    if (status === 'Resolved') return 'Resuelto';
    return 'Desestimado';
};

const truncateText = (value: string, maxLength = 60): string => {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength)}...`;
};

const AdminDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<ReportFilter>('All');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAdminReports();
                setReports(data);
            } catch (fetchError) {
                console.error('Error cargando reportes de admin', fetchError);
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

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const pendingCount = reports.filter((report) => report.status === 'Pending').length;

    const filteredReports = reports.filter((report) => {
        const matchesStatus = filter === 'All' || report.status === filter;
        const matchesSearch =
            !normalizedSearchTerm ||
            report.reporterName.toLowerCase().includes(normalizedSearchTerm) ||
            report.reportedName.toLowerCase().includes(normalizedSearchTerm) ||
            report.reason.toLowerCase().includes(normalizedSearchTerm) ||
            report.status.toLowerCase().includes(normalizedSearchTerm);

        return matchesStatus && matchesSearch;
    });

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

    return (
        <div className="u-ride-layout admin-layout admin-dashboard-page">
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="admin-avatar">U</div>
                    <div className="admin-info">
                        <span className="admin-name">U-Ride Admin</span>
                        <span className="admin-role">Gestion Logistica</span>
                    </div>
                </div>

                <nav className="nav-menu">
                    <li className="nav-item active">
                        <i className="ti ti-dashboard"></i>
                        <span>Panel de Control</span>
                    </li>
                </nav>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <i className="ti ti-menu-2"></i>
                        </button>
                        <div className="search-bar">
                            <i className="ti ti-search"></i>
                            <input
                                className="admin-search-input"
                                type="text"
                                placeholder="Buscar reportes..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                    </div>
                    <div className="header-right">
                        <NotificationBell />
                        <div className="user-profile">
                            <i className="ti ti-user-circle"></i>
                        </div>
                    </div>
                </header>

                <div className="view-container admin-content">
                    <header className="admin-page-header">
                        <span className="admin-section-eyebrow">Administración</span>
                        <h1>Panel de Control</h1>
                        <p>Resumen general de la plataforma U-Ride.</p>
                    </header>

                    {error && <p className="admin-error">{error}</p>}

                    <section className="reports-card">
                        <div className="reports-card-header">
                            <div>
                                <span className="admin-section-eyebrow">Reportes</span>
                                <h2>Gestión de reportes</h2>
                            </div>

                            <div className="report-tabs">
                                <button
                                    className={`report-tab ${filter === 'All' ? 'active' : ''}`}
                                    onClick={() => setFilter('All')}
                                >
                                    Todos
                                </button>
                                <button
                                    className={`report-tab ${filter === 'Pending' ? 'active' : ''}`}
                                    onClick={() => setFilter('Pending')}
                                >
                                    Pendientes <span className="tab-count">{pendingCount}</span>
                                </button>
                                <button
                                    className={`report-tab ${filter === 'Resolved' ? 'active' : ''}`}
                                    onClick={() => setFilter('Resolved')}
                                >
                                    Resueltos
                                </button>
                            </div>
                        </div>

                        <div className="reports-table-wrapper">
                            <table className="reports-table">
                                <thead>
                                    <tr>
                                        <th>FECHA</th>
                                        <th>DENUNCIANTE</th>
                                        <th>DENUNCIADO</th>
                                        <th>MOTIVO</th>
                                        <th>ESTADO</th>
                                        <th className="text-right">ACCION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((report) => (
                                        <tr key={report.id}>
                                            <td className="date-cell">
                                                <span className="primary">
                                                    {new Date(report.createdAt).toLocaleString('es-EC', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                    })}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-mini">{getInitials(report.reporterName)}</div>
                                                    <span>{report.reporterName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-mini reported">{getInitials(report.reportedName)}</div>
                                                    <span className="reported-name">{report.reportedName}</span>
                                                </div>
                                            </td>
                                            <td className="reason-cell">{truncateText(report.reason)}</td>
                                            <td>
                                                <span className={`report-status-badge ${report.status.toLowerCase()}`}>
                                                    {getStatusLabel(report.status)}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="btn-view-detail"
                                                    onClick={() =>
                                                        navigate(`/admin/reports/${report.id}`, {
                                                            state: { report },
                                                        })
                                                    }
                                                >
                                                    Ver detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredReports.length === 0 && (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="empty-reports-state">
                                                    <h3>No hay reportes para mostrar</h3>
                                                    <p>No existen reportes que coincidan con los filtros seleccionados.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
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
