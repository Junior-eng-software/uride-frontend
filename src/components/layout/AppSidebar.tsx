import React from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

export type AppSidebarRouteKey =
    | 'dashboard'
    | 'profile'
    | 'createRide'
    | 'searchRides';

export interface AppSidebarItem {
    key: AppSidebarRouteKey;
    label: string;
    to: string;
    iconClassName: string;
    end?: boolean;
}

// Rutas reales confirmadas en App.tsx para la unificacion del sidebar.
export const APP_SIDEBAR_ROUTES: readonly AppSidebarItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        to: '/dashboard',
        iconClassName: 'ti ti-dashboard',
    },
    {
        key: 'profile',
        label: 'Mi Perfil',
        to: '/profile',
        iconClassName: 'ti ti-user',
    },
    {
        key: 'createRide',
        label: 'Publicar Viaje',
        to: '/rides/create',
        iconClassName: 'ti ti-route',
    },
    {
        key: 'searchRides',
        label: 'Buscar Viajes',
        to: '/rides/search',
        iconClassName: 'ti ti-search',
    },
] as const;

interface AppSidebarProps {
    items?: readonly AppSidebarItem[];
    className?: string;
    logoText?: string;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
    items = APP_SIDEBAR_ROUTES,
    className,
    logoText = 'U-Ride',
}) => {
    const asideClassName = className
        ? `app-sidebar ${className}`
        : 'app-sidebar';

    return (
        <aside className={asideClassName}>
            <div className="app-sidebar-logo">
                <i className="ti ti-car" aria-hidden="true"></i>
                <span>{logoText}</span>
            </div>

            <nav className="app-sidebar-nav" aria-label="Principal">
                <ul className="app-sidebar-menu">
                    {items.map((item) => (
                        <li key={item.key}>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `app-sidebar-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className={item.iconClassName} aria-hidden="true"></i>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default AppSidebar;
