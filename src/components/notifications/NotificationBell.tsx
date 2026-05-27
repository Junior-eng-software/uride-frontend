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

    // MVP Sprint 11: se cargan al montar; sin WebSocket, SignalR ni polling.
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
      setErrorMessage(null);
    } catch (error) {
      console.warn("No se pudo marcar la notificacion como leida", error);
      setErrorMessage("No se pudo marcar la notificacion como leida.");
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
        <i className="ti ti-bell notification-bell-icon" aria-hidden="true"></i>

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
                      <span className="unread-dot" aria-label="No leida" />
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
