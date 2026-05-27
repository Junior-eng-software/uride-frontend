# Sprint 11 — Frontend: Campana de notificaciones funcional

## Contexto

El backend del Sprint 11 ya implementó notificaciones persistentes.

Endpoints disponibles:

```text
GET /api/notifications
PUT /api/notifications/{id}/read
```

````

Desde frontend, el proyecto usa `axiosClient`, que ya tiene `/api` configurado en `baseURL`.

Por tanto, desde frontend las rutas correctas son:

```text
GET /notifications
PUT /notifications/{id}/read
```

No usar `/api/notifications` desde frontend.

## Objetivo

Implementar una campana de notificaciones funcional para que el usuario autenticado pueda:

1. Ver cuántas notificaciones no leídas tiene.
2. Abrir un dropdown de notificaciones.
3. Leer título, mensaje y fecha de cada notificación.
4. Marcar una notificación como leída al hacer clic.
5. Ver estados de carga, vacío y error.
6. Evitar rutas duplicadas `/api/api`.
7. Evitar conflictos con la API global `window.Notification`.

## Alcance

Implementar solo frontend.

No modificar backend.
No crear endpoints.
No modificar migraciones.
No usar localStorage para persistir notificaciones.
No hardcodear notificaciones.

---

# Archivos a crear

Crear:

```text
src/types/notification.ts
src/services/notificationService.ts
src/components/notifications/NotificationBell.tsx
src/components/notifications/NotificationBell.css
```

---

# Archivos a revisar para integración

Antes de insertar `<NotificationBell />`, buscar si existe un layout/header compartido.

Revisar archivos como:

```text
src/layouts/*
src/components/layout/*
src/components/Header*
src/components/TopBar*
src/pages/DashboardView.tsx
src/pages/AdminDashboardView.tsx
src/pages/AdminReportDetailView.tsx
```

## Regla crítica de integración

Si existe un layout/header/topbar compartido que envuelve el dashboard de estudiante, el panel admin y el detalle admin:

```text
Integrar NotificationBell únicamente en ese layout/header compartido.
```

No agregar `<NotificationBell />` repetido en `DashboardView`, `AdminDashboardView` y `AdminReportDetailView` si ya existe un layout común.

Si no existe layout compartido, integrar solo donde actualmente aparece visualmente la campana.

No duplicar campanas.

---

# T13-01 — Crear tipos de notificación

Crear archivo:

```text
src/types/notification.ts
```

Contenido:

```ts
export type AppNotificationType = "Warning" | "Suspension" | "ReportDismissed";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
}
```

## Importante

No usar:

```ts
export interface Notification {}
```

porque `Notification` ya existe como API global del navegador.

No agregar tipos huérfanos como:

```ts
"ReportResolved";
"General";
```

porque el backend actual solo genera:

```text
Warning
Suspension
ReportDismissed
```

---

# T13-02 — Crear notificationService.ts

Crear archivo:

```text
src/services/notificationService.ts
```

Contenido base:

```ts
import axiosClient from "../api/axiosClient";
import type { AppNotification } from "../types/notification";

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await axiosClient.get<AppNotification[]>("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<void> => {
  await axiosClient.put(`/notifications/${notificationId}/read`);
};
```

## Reglas obligatorias

No usar:

```ts
import api from "./api";
```

No usar:

```ts
axiosClient.get("/api/notifications");
axiosClient.put(`/api/notifications/${id}/read`);
```

Usar siempre:

```ts
axiosClient.get("/notifications");
axiosClient.put(`/notifications/${id}/read`);
```

---

# T13-03 — Crear NotificationBell

Crear archivo:

```text
src/components/notifications/NotificationBell.tsx
```

El componente debe:

- Cargar notificaciones al montar.
- Mostrar contador de no leídas.
- Abrir/cerrar dropdown.
- Mostrar estado de carga.
- Mostrar estado vacío.
- Mostrar estado de error.
- Mostrar notificaciones retornadas por backend.
- Marcar como leída al hacer clic.
- Actualizar UI solo después de respuesta exitosa del backend.
- Manejar errores con `try/catch`.
- Cerrar dropdown al hacer clic fuera.
- No usar `any`.

Implementación base:

```tsx
import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";
import type { AppNotification } from "../../types/notification";
import "./NotificationBell.css";

const formatNotificationDate = (value: string) => {
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.warn("No se pudieron cargar las notificaciones", error);
        setErrorMessage("No se pudieron cargar las notificaciones.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.isRead) return;

    try {
      await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      console.warn("No se pudo marcar la notificación como leída", error);
      setErrorMessage("No se pudo marcar la notificación como leída.");
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={containerRef}>
      <button
        type="button"
        className="notification-bell-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Abrir notificaciones"
      >
        <span className="notification-bell-icon" aria-hidden="true">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <header className="notifications-header">
            <div>
              <h3>Notificaciones</h3>
              <p>{unreadCount} sin leer</p>
            </div>
          </header>

          <div className="notifications-list">
            {isLoading && (
              <p className="notification-empty">Cargando notificaciones...</p>
            )}

            {!isLoading && errorMessage && (
              <p className="notification-error">{errorMessage}</p>
            )}

            {!isLoading && !errorMessage && notifications.length === 0 && (
              <p className="notification-empty">No tienes notificaciones.</p>
            )}

            {!isLoading &&
              !errorMessage &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item ${
                    notification.isRead ? "read" : "unread"
                  } ${notification.type.toLowerCase()}`}
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <div className="notification-item-header">
                    <strong>{notification.title}</strong>

                    {!notification.isRead && (
                      <span className="unread-dot" aria-label="No leída" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <span className="notification-date">
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

## Nota de icono

Si el proyecto ya usa una librería de iconos, reemplazar el emoji por el icono existente de campana.

No introducir una nueva dependencia solo por el icono.

---

# T13-04 — Crear CSS de NotificationBell

Crear archivo:

```text
src/components/notifications/NotificationBell.css
```

Contenido base:

```css
.notification-bell-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notification-bell-button {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.notification-bell-button:hover {
  background: #f1f5f9;
}

.notification-bell-icon {
  font-size: 1.15rem;
  line-height: 1;
}

.notification-count {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 2rem));
  max-height: 460px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  z-index: 1000;
}

.notifications-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.notifications-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.notifications-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.notifications-list {
  max-height: 380px;
  overflow-y: auto;
}

.notification-item {
  width: 100%;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  text-align: left;
  padding: 0.9rem 1rem;
  cursor: pointer;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #f8fafc;
}

.notification-item.read {
  opacity: 0.76;
}

.notification-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.notification-item strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.notification-item p {
  margin: 0.35rem 0;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.45;
}

.notification-date {
  color: #94a3b8;
  font-size: 0.75rem;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  flex: 0 0 auto;
}

.notification-empty,
.notification-error {
  margin: 0;
  padding: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.notification-error {
  color: #b91c1c;
}

.notification-item.warning {
  border-left: 4px solid #f59e0b;
}

.notification-item.suspension {
  border-left: 4px solid #ef4444;
}

.notification-item.reportdismissed {
  border-left: 4px solid #64748b;
}
```

Ajustar colores si el proyecto ya tiene variables CSS globales.

---

# T13-05 — Integrar NotificationBell en el lugar correcto

Buscar la campana visual existente.

Regla:

```text
Reemplazar la campana decorativa existente por <NotificationBell />.
```

Preferencia:

```text
Si existe layout/header compartido, integrar NotificationBell únicamente ahí.
```

No hacer esto:

```tsx
<NotificationBell /> en DashboardView
<NotificationBell /> en AdminDashboardView
<NotificationBell /> en AdminReportDetailView
```

si esas vistas ya usan el mismo layout/header.

Solo integrar en varias vistas si no existe layout compartido y la campana está duplicada manualmente en cada una.

---

# T13-06 — Revisar orden de suspensión administrativa

Revisar `AdminReportDetailView.tsx`.

En la acción `suspend`, el orden debe ser exactamente:

```ts
await suspendUser(report.reportedId);
await updateReportStatus(report.id, "Resolved");
```

No invertir.

## Motivo técnico

El backend actual genera:

```text
suspendUser()
→ Notification Type: Suspension

updateReportStatus(Resolved)
→ Notification Type: Warning solo si report.Reported.IsSuspended == false
```

Entonces, si primero se suspende, luego al resolver el reporte el backend no debe crear `Warning`, porque el usuario ya está suspendido.

Para Advertir:

```ts
await updateReportStatus(report.id, "Resolved");
```

Para Desestimar:

```ts
await updateReportStatus(report.id, "Dismissed");
```

No modificar backend.

---

# T13-07 — Documentar limitación MVP

Agregar comentario breve en el código o en el reporte de entrega:

```text
Las notificaciones se cargan al montar la campana. En este Sprint no se implementa actualización en tiempo real mediante WebSocket, SignalR o polling.
```

No implementar WebSocket.
No implementar SignalR.
No implementar polling todavía.

---

# Restricciones

- No modificar backend.
- No crear endpoints nuevos.
- No usar localStorage para persistir notificaciones.
- No hardcodear notificaciones.
- No usar interfaz llamada `Notification`.
- No usar tipos huérfanos si el backend no los genera.
- No usar `/api/notifications` desde frontend.
- No usar `api`; usar `axiosClient`.
- No hacer actualización optimista sin `try/catch`.
- No usar `any`.
- No duplicar `<NotificationBell />` en varias vistas si existe layout/header compartido.
- No romper DashboardView.
- No romper AdminDashboardView.
- No romper AdminReportDetailView.
- No implementar SignalR/WebSocket/polling en este Sprint.
- TypeScript debe compilar sin errores.

---

# Validaciones esperadas

Ejecutar:

```bash
npm run build
```

Debe compilar sin errores.

## Flujo Advertencia

```text
Admin aplica Advertir.
Usuario denunciado inicia sesión.
Campana muestra 1 notificación no leída.
Dropdown muestra Advertencia administrativa.
Click en notificación.
Contador baja.
```

## Flujo Suspensión

```text
Admin aplica Suspender.
Frontend ejecuta primero suspendUser y luego updateReportStatus.
Usuario denunciado recibe Cuenta suspendida.
No debe recibir Advertencia administrativa en el flujo normal.
```

## Flujo Desestimación

```text
Admin desestima reporte.
Usuario denunciante recibe Reporte desestimado.
```

## Flujo sin datos

```text
Usuario sin notificaciones abre campana.
Se muestra: No tienes notificaciones.
```

---

# Entrega esperada

Al finalizar, reportar:

1. Archivos creados.
2. Archivos modificados.
3. Dónde se integró `NotificationBell`.
4. Confirmar que se usa `axiosClient`.
5. Confirmar que no se duplicó `/api`.
6. Confirmar que la interfaz se llama `AppNotification`.
7. Confirmar que solo se usan tipos `Warning`, `Suspension` y `ReportDismissed`.
8. Confirmar que marcar como leída usa `try/catch`.
9. Confirmar que `npm run build` pasa sin errores.
10. Confirmar que `suspend` ejecuta primero `suspendUser` y luego `updateReportStatus`.
11. Indicar que no hay actualización en tiempo real todavía; las notificaciones se cargan al montar la campana.

`
````
