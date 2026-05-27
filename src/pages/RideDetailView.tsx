import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRideById } from "../services/rideService";
import type { Ride } from "../types/rides";
import { getCurrentUserId } from "../utils/auth";
import "./RideDetailView.css";

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusLabel = (status: string) => {
  if (status === "Completed") return "Completado";
  if (status === "Published") return "Publicado";
  if (status === "Cancelled") return "Cancelado";
  return status;
};

const RideDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = useParams<{ rideId: string }>();
  const initialRide = (location.state as { ride?: Ride } | null)?.ride;

  const [ride, setRide] = useState<Ride | null>(initialRide ?? null);
  const [isLoading, setIsLoading] = useState(!initialRide);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ride || !rideId) return;

    const fetchRide = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const data = await getRideById(rideId);
        setRide(data);
      } catch (error) {
        console.error("Error cargando detalle del viaje", error);
        setErrorMessage("No se pudo cargar el detalle del viaje.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRide();
  }, [ride, rideId]);

  if (isLoading) {
    return (
      <main className="ride-detail-page">
        <div className="detail-card">
          <p>Cargando detalle del viaje...</p>
        </div>
      </main>
    );
  }

  if (errorMessage || !ride) {
    return (
      <main className="ride-detail-page">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          {"<-"} Volver al Dashboard
        </button>

        <div className="detail-card">
          <h1>No se pudo cargar el viaje</h1>
          <p>{errorMessage ?? "El viaje solicitado no esta disponible."}</p>
        </div>
      </main>
    );
  }

  const currentUserId = getCurrentUserId();
  const isDriver = ride.driverId === currentUserId;

  return (
    <main className="ride-detail-page">
      <header className="ride-detail-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          {"<-"} Volver al Dashboard
        </button>

        <div>
          <span className="detail-eyebrow">Detalle del viaje</span>
          <h1>
            {ride.originZone} {"->"} {ride.destinationZone}
          </h1>
          <p>Consulta la informacion completa del viaje generado.</p>
        </div>
      </header>

      <section className="ride-summary-hero">
        <div>
          <span className="summary-label">Estado</span>
          <span className={`status-badge ${ride.status.toLowerCase()}`}>
            {getStatusLabel(ride.status)}
          </span>
        </div>

        <div>
          <span className="summary-label">Fecha y hora</span>
          <strong>{formatDateTime(ride.departureAt)}</strong>
        </div>

        <div>
          <span className="summary-label">Ruta</span>
          <strong>
            {ride.originZone} {"->"} {ride.destinationZone}
          </strong>
        </div>
      </section>

      <div className="ride-detail-grid">
        <section className="detail-card">
          <h2>Informacion general</h2>

          <div className="info-list">
            {ride.notes ? (
              <div>
                <span>Notas del viaje</span>
                <strong>{ride.notes}</strong>
              </div>
            ) : (
              <p>Este viaje no tiene notas adicionales.</p>
            )}
          </div>
        </section>

        <section className="detail-card">
          <h2>Conductor</h2>
          <p>{ride.driverName}</p>
        </section>

        <section className="detail-card">
          <h2>Disponibilidad</h2>

          <div className="info-list">
            <div>
              <span>Asientos disponibles</span>
              <strong>{ride.availableSeats}</strong>
            </div>
            <div>
              <span>Asientos aceptados</span>
              <strong>{ride.acceptedSeats}</strong>
            </div>
            <div>
              <span>Capacidad total</span>
              <strong>{ride.seatCapacity}</strong>
            </div>
          </div>
        </section>

        <section className="detail-card">
          <h2>Estado de calificacion</h2>
          <p>
            Revisa desde la gestion del viaje si tienes una calificacion
            pendiente o enviada.
          </p>
        </section>

        <section className="detail-card">
          <h2>Seguridad del viaje</h2>
          <p>
            Manten la comunicacion dentro de la plataforma y reporta cualquier
            comportamiento inadecuado desde las pantallas de gestion.
          </p>
        </section>

        <section className="detail-card full-width">
          <h2>Acciones disponibles</h2>

          <div className="detail-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Volver
            </button>

            {isDriver && (
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/rides/${ride.id}/manage`, {
                    state: { ride },
                  })
                }
              >
                Gestionar viaje
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default RideDetailView;
