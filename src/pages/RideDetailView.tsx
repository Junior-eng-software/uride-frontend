import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { cancelRide, getMyRides, getRideById } from "../services/rideService";
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
  const [isConfirmedPassenger, setIsConfirmedPassenger] = useState(false);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancellingRide, setIsCancellingRide] = useState(false);
  const currentUserId = getCurrentUserId();
  const isDriver = ride?.driverId === currentUserId;
  const normalizedStatus = ride?.status.toLowerCase() ?? "";
  const isCompletedRide = normalizedStatus === "completed";
  const canCancelRide =
    isDriver && ride?.status !== "Completed" && ride?.status !== "Cancelled";
  const shouldCheckPassengerParticipation = Boolean(
    ride?.id && currentUserId && !isDriver,
  );
  const effectiveIsConfirmedPassenger = shouldCheckPassengerParticipation
    ? isConfirmedPassenger
    : false;
  const effectiveIsCheckingParticipation = shouldCheckPassengerParticipation
    ? isCheckingParticipation
    : false;
  const canPassengerRateDriver =
    !isDriver && isCompletedRide && effectiveIsConfirmedPassenger;

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

  useEffect(() => {
    if (!shouldCheckPassengerParticipation || !ride?.id) return;

    const checkPassengerParticipation = async () => {
      try {
        setIsCheckingParticipation(true);
        setIsConfirmedPassenger(false);

        const myRides = await getMyRides();
        const belongsToCurrentUser = myRides.some(
          (myRide) => myRide.id === ride.id,
        );

        setIsConfirmedPassenger(belongsToCurrentUser);
      } catch (error) {
        console.warn(
          "No se pudo verificar la participacion del usuario en el viaje",
          error,
        );
        setIsConfirmedPassenger(false);
      } finally {
        setIsCheckingParticipation(false);
      }
    };

    void checkPassengerParticipation();
  }, [ride?.id, shouldCheckPassengerParticipation]);

  const handleConfirmCancelRide = async () => {
    if (!rideId) {
      return;
    }

    const trimmedReason = cancelReason.trim();

    if (!trimmedReason) {
      setCancelError("Debe ingresar un motivo de cancelación.");
      return;
    }

    if (trimmedReason.length > 500) {
      setCancelError(
        "El motivo de cancelación no puede superar los 500 caracteres.",
      );
      return;
    }

    try {
      setIsCancellingRide(true);
      setCancelError(null);

      await cancelRide(rideId, {
        reason: trimmedReason,
      });

      setIsCancelModalOpen(false);
      setCancelReason("");

      const updatedRide = await getRideById(rideId);
      setRide(updatedRide);
    } catch (error) {
      let message = "Error al cancelar el viaje. Inténtalo nuevamente.";

      if (axios.isAxiosError(error)) {
        const backendMessage =
          typeof error.response?.data === "string"
            ? error.response.data
            : error.response?.data?.detail ?? error.response?.data?.message;

        if (backendMessage) {
          message = backendMessage;
        }
      }

      setCancelError(message);
    } finally {
      setIsCancellingRide(false);
    }
  };

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

  return (
    <main className="ride-detail-page">
      {isCancellingRide && (
        <div className="transaction-overlay">
          <div className="transaction-box">
            <span className="spinner"></span>
            <p>Cancelando viaje...</p>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="cancel-modal-backdrop">
          <div className="cancel-modal">
            <h3>Cancelar viaje</h3>

            <p>
              Esta acción cancelará el viaje y notificará a los pasajeros
              aceptados.
            </p>

            <label htmlFor="cancelReason">Motivo de cancelación</label>

            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              maxLength={500}
              placeholder="Ej: Me equivoqué en la hora de salida"
              disabled={isCancellingRide}
            />

            {cancelError && (
              <p className="cancel-error-message">{cancelError}</p>
            )}

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancellingRide}
              >
                Volver
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={() => void handleConfirmCancelRide()}
                disabled={isCancellingRide}
              >
                {isCancellingRide ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

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

            {canCancelRide && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setCancelError(null);
                  setCancelReason("");
                  setIsCancelModalOpen(true);
                }}
              >
                Cancelar viaje
              </button>
            )}

            {canPassengerRateDriver && (
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/rides/${ride.id}/manage`, {
                    state: { ride },
                  })
                }
              >
                Calificar conductor
              </button>
            )}
          </div>

          {!isDriver && effectiveIsCheckingParticipation && (
            <p className="detail-action-note">
              Verificando acciones disponibles...
            </p>
          )}

          {!isDriver && effectiveIsConfirmedPassenger && !isCompletedRide && (
            <p className="detail-action-note">
              Las acciones del pasajero estaran disponibles cuando el viaje
              finalice.
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default RideDetailView;
