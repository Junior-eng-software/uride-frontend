# Frontend — Crear RideDetailView profesional para Ver viaje

## Contexto

Ya existe en backend el endpoint:

GET /api/Rides/{rideId}

Desde frontend debe consumirse mediante `axiosClient`, considerando que `axiosClient` ya tiene `/api` en el `baseURL`.

Por tanto, la ruta correcta desde frontend es:

GET /Rides/{rideId}

El Dashboard actualmente muestra viajes recientes con botón `Ver viaje`. El Dashboard debe mantenerse como vista de resumen, no como vista extensa de datos.

El profesor recomendó mejorar el entorno de los datos, controlar los espacios dentro de la ventana y evitar mezclar información extensa dentro de una misma pantalla.

## Objetivo

Crear una página dedicada para visualizar el detalle completo del viaje al hacer clic en `Ver viaje`.

Flujo esperado:

/dashboard
→ muestra resumen de viajes recientes

/rides/:rideId/detail
→ muestra detalle completo del viaje

/rides/:rideId/manage
→ mantiene la gestión operativa existente del viaje

## Decisión UX

No usar modal.
No usar drawer.
No expandir detalles dentro del Dashboard.
No mezclar información extensa en las tarjetas de viajes recientes.
No eliminar ni reescribir ManageRideView.

La información completa debe mostrarse en una página propia, con tarjetas, jerarquía visual y distribución profesional.

---

# Archivos a revisar

Revisar:

src/pages/dashBoardView.tsx
src/pages/ManageRideView.tsx
src/pages/JoinRideView.tsx
src/services/rideService.ts
src/types/ride.ts
src/utils/auth.ts
src/App.tsx
src/routes/\*

Si existe archivo centralizado de rutas, registrar ahí la nueva ruta.

---

# Archivos a crear

Crear:

src/pages/RideDetailView.tsx
src/pages/RideDetailView.css

Modificar si corresponde:

src/services/rideService.ts
src/pages/dashBoardView.tsx
src/pages/JoinRideView.tsx
src/App.tsx o archivo de rutas correspondiente

---

# Reglas importantes

## 1. No romper ManageRideView

ManageRideView debe conservarse para gestión operativa del viaje, por ejemplo:

- solicitudes
- pasajeros
- completar viaje
- calificación
- acciones existentes

No eliminar ni reescribir ManageRideView.

La nueva vista RideDetailView debe ser principalmente informativa.

## 2. Dashboard debe seguir siendo resumen

En dashBoardView.tsx, las tarjetas de Viajes Recientes deben mostrar solo:

- Origen → destino
- Fecha y hora resumida
- Estado
- Badge de calificación enviada si aplica
- Botón Ver viaje

No mostrar en Dashboard:

- detalles extensos
- pasajeros completos
- solicitudes
- formularios
- IDs largos
- contenido de gestión

## 3. Botón Ver viaje

Actualizar el botón Ver viaje para navegar a:

```tsx
navigate(`/rides/${ride.id}/detail`, {
  state: { ride },
});
```

No navegar directamente a manage desde Dashboard.

---

# Tarea 1 — Agregar o ajustar getRideById en rideService

Revisar:

src/services/rideService.ts

Si ya existe getRideById, ajustarlo para usar el endpoint real.

Debe quedar equivalente a:

```ts
import axiosClient from "../api/axiosClient";
import type { Ride } from "../types/ride";

export const getRideById = async (rideId: string): Promise<Ride> => {
  const response = await axiosClient.get<Ride>(`/Rides/${rideId}`);
  return response.data;
};
```

Ajustar imports y tipos al patrón real del proyecto.

No usar:

```ts
axiosClient.get(`/api/Rides/${rideId}`);
```

porque axiosClient ya tiene `/api`.

---

# Tarea 2 — Crear RideDetailView

Crear:

src/pages/RideDetailView.tsx

La vista debe:

- Obtener rideId desde useParams.
- Intentar leer ride desde location.state.
- Si no existe location.state, cargar el viaje con getRideById(rideId).
- Mostrar loading.
- Mostrar error si el viaje no existe.
- Mostrar botón para volver al Dashboard.
- Mostrar datos del viaje en tarjetas profesionales.
- No mostrar datos extensos en texto plano.
- No incluir botones falsos.
- No ejecutar acciones si no existen en el sistema.
- No incluir infraestructura de toast si no se usa.
- No incluir transaction-overlay si no hay acciones de guardado o actualización.

## Importante sobre toast y overlay

Esta vista es informativa.

No declarar:

- toastMessage
- toastType
- toastTimerRef
- showToast
- isActionLoading
- transaction-overlay

si no se usan.

Agregar solo un comentario breve si corresponde:

```tsx
// Toast y overlay pueden añadirse cuando esta vista incorpore acciones de guardado o actualización.
```

---

# Tarea 3 — Control de acceso al botón Gestionar viaje

El botón Gestionar viaje solo debe mostrarse si el usuario actual es el conductor del viaje.

Usar el helper existente:

```ts
import { getCurrentUserId } from "../utils/auth";
```

Dentro del componente:

```ts
const currentUserId = getCurrentUserId();
const isDriver = ride.driverId === currentUserId;
```

En el JSX:

```tsx
{
  isDriver && (
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
  );
}
```

No mostrar Gestionar viaje a pasajeros.

Si el usuario no es conductor, mostrar solo el botón Volver.

---

# Tarea 4 — No inventar driverName

La sección Conductor debe usar únicamente campos reales del tipo Ride/RideResponse.

Antes de usar cualquier propiedad, revisar src/types/ride.ts.

No inventar:

```ts
ride.driverName;
```

si no existe.

Regla:

- Si RideResponse tiene driverName, mostrar driverName.
- Si RideResponse solo tiene driverId, mostrar una tarjeta con:
  "Información del conductor no disponible"
  o mostrar el driverId en formato discreto si el diseño lo requiere.
- No agregar propiedades al tipo Ride si el backend no las devuelve.

Ejemplo seguro:

```tsx
<section className="detail-card">
  <h2>Conductor</h2>

  {"driverName" in ride && typeof ride.driverName === "string" ? (
    <p>{ride.driverName}</p>
  ) : (
    <p>Información del conductor no disponible.</p>
  )}
</section>
```

Si TypeScript no permite ese patrón por el tipo actual, usar el campo real disponible.

No usar any.

---

# Tarea 5 — Evitar duplicación de información

El hero ya debe mostrar:

- Estado
- Fecha y hora
- Ruta

Por tanto, la tarjeta Información general no debe repetir de forma innecesaria lo mismo.

La tarjeta Información general debe mostrar solo campos adicionales disponibles en el modelo, por ejemplo:

- Asientos disponibles
- Punto de encuentro, si existe
- Notas, si existe
- Precio, si existe
- Reglas, si existe
- ID del viaje solo si aporta valor, en formato discreto

Si el modelo solo tiene datos básicos, evitar repetir demasiado y dejar la vista limpia.

---

# Estructura visual requerida

La vista debe tener:

Header:

- Volver al Dashboard
- Título: Detalle del viaje
- Subtítulo: Consulta la información completa del viaje generado.

Hero:

- Estado
- Fecha y hora
- Ruta

Tarjetas:

- Información general
- Conductor
- Disponibilidad
- Estado de calificación
- Seguridad del viaje
- Acciones disponibles

---

# Implementación base orientativa

Adaptar nombres de propiedades al tipo real Ride.

```tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRideById } from "../services/rideService";
import type { Ride } from "../types/ride";
import { getCurrentUserId } from "../utils/auth";
import "./RideDetailView.css";

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const RideDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = useParams<{ rideId: string }>();

  const initialRide = location.state?.ride as Ride | undefined;

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
          ← Volver al Dashboard
        </button>

        <div className="detail-card">
          <h1>No se pudo cargar el viaje</h1>
          <p>{errorMessage ?? "El viaje solicitado no está disponible."}</p>
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
          ← Volver al Dashboard
        </button>

        <div>
          <span className="detail-eyebrow">Detalle del viaje</span>
          <h1>
            {ride.originZone} → {ride.destinationZone}
          </h1>
          <p>Consulta la información completa del viaje generado.</p>
        </div>
      </header>

      <section className="ride-summary-hero">
        <div>
          <span className="summary-label">Estado</span>
          <span className={`status-badge ${ride.status.toLowerCase()}`}>
            {ride.status}
          </span>
        </div>

        <div>
          <span className="summary-label">Fecha y hora</span>
          <strong>{formatDateTime(ride.departureTime)}</strong>
        </div>

        <div>
          <span className="summary-label">Ruta</span>
          <strong>
            {ride.originZone} → {ride.destinationZone}
          </strong>
        </div>
      </section>

      <div className="ride-detail-grid">
        <section className="detail-card">
          <h2>Disponibilidad</h2>

          <div className="info-list">
            <div>
              <span>Asientos disponibles</span>
              <strong>{ride.availableSeats}</strong>
            </div>
          </div>
        </section>

        <section className="detail-card">
          <h2>Conductor</h2>
          <p>Información del conductor no disponible.</p>
        </section>

        <section className="detail-card">
          <h2>Estado de calificación</h2>
          <p>
            Revisa desde la gestión del viaje si tienes una calificación
            pendiente o enviada.
          </p>
        </section>

        <section className="detail-card">
          <h2>Seguridad del viaje</h2>
          <p>
            Mantén la comunicación dentro de la plataforma y reporta cualquier
            comportamiento inadecuado.
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
```

Importante:

- Adaptar originZone, destinationZone, departureTime, availableSeats, driverId, status e id al modelo real.
- No inventar propiedades.
- No dejar botones falsos.
- No usar any.

---

# Tarea 6 — Crear CSS

Crear:

src/pages/RideDetailView.css

```css
.ride-detail-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem clamp(1rem, 4vw, 4rem);
  color: #0f172a;
}

.ride-detail-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-back {
  width: fit-content;
  border: none;
  background: transparent;
  color: #334155;
  font-weight: 700;
  cursor: pointer;
}

.detail-eyebrow {
  color: #16a34a;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ride-detail-header h1 {
  margin: 0.25rem 0;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
}

.ride-detail-header p {
  margin: 0;
  color: #64748b;
}

.ride-summary-hero {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  background: #0f172a;
  color: #ffffff;
  border-radius: 24px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.summary-label {
  display: block;
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}

.ride-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 1.25rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.info-list {
  display: grid;
  gap: 0.75rem;
}

.info-list div {
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.info-list span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 800;
  margin-bottom: 0.35rem;
}

.status-badge {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-weight: 800;
  font-size: 0.8rem;
  background: #ecfdf5;
  color: #166534;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  border: none;
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 900px) {
  .ride-summary-hero,
  .ride-detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }
}
```

---

# Tarea 7 — Registrar ruta

En App.tsx o archivo centralizado de rutas, agregar:

```tsx
<Route path="/rides/:rideId/detail" element={<RideDetailView />} />
```

Si las rutas están protegidas por autenticación, agregarla dentro del bloque protegido.

No dejar esta ruta pública si las demás rutas de usuario requieren login.

---

# Tarea 8 — Actualizar Dashboard

En dashBoardView.tsx, actualizar el botón Ver viaje.

Debe navegar a:

```tsx
navigate(`/rides/${ride.id}/detail`, {
  state: { ride },
});
```

No navegar directamente a manage desde Dashboard.

ManageRideView debe seguir existiendo, pero se accede desde RideDetailView únicamente si el usuario es conductor.

---

# Tarea 9 — Corregir JoinRideView si usa navigate(-1)

Revisar:

src/pages/JoinRideView.tsx

Si el botón Gestionar viaje usa:

```tsx
navigate(-1);
```

actualizarlo para navegar explícitamente a:

```tsx
navigate(`/rides/${ride.id}/manage`, {
  state: { ride },
});
```

o si solo existe rideId:

```tsx
navigate(`/rides/${rideId}/manage`);
```

Preferir pasar state: { ride } si el objeto ride está disponible.

No dejar navegación ambigua con navigate(-1) para gestionar viaje.

---

# Restricciones

- No modificar backend.
- No crear endpoints nuevos.
- No mostrar detalle completo dentro del Dashboard.
- No usar modal.
- No usar drawer.
- No mezclar resumen y detalle.
- No eliminar ManageRideView.
- No mostrar Gestionar viaje a pasajeros.
- No romper flujo de calificaciones.
- No romper flujo de solicitudes.
- No romper Dashboard.
- No inventar propiedades del modelo.
- No usar driverName si no existe.
- No duplicar datos innecesariamente entre hero e información general.
- No dejar código muerto de toast u overlay.
- No usar botones falsos.
- No usar /api/Rides/${rideId} desde frontend.
- Usar axiosClient.
- No usar any.
- TypeScript debe compilar sin errores.

---

# Validaciones esperadas

Ejecutar:

npm run build

Debe compilar sin errores.

Validar manualmente:

1. Dashboard muestra tarjetas resumidas.
2. Clic en Ver viaje.
3. Se abre /rides/:rideId/detail.
4. Se muestra detalle completo del viaje.
5. Al recargar la página, el viaje se carga usando GET /api/Rides/{rideId}.
6. El botón Gestionar viaje aparece solo si el usuario actual es conductor.
7. El botón Gestionar viaje no aparece para pasajeros.
8. Si aparece Gestionar viaje, lleva a /rides/:rideId/manage.
9. No se rompieron calificaciones.
10. No se rompieron solicitudes.
11. No se muestra información extensa dentro del Dashboard.
12. JoinRideView ya no usa navigate(-1) para gestionar viaje si existía esa deuda.

---

# Entrega esperada

Al finalizar, reportar:

1. Archivos creados.
2. Archivos modificados.
3. Ruta registrada.
4. Servicio getRideById actualizado o confirmado.
5. Confirmar que Dashboard navega a /rides/:rideId/detail.
6. Confirmar que ManageRideView no fue eliminado.
7. Confirmar que Gestionar viaje solo aparece para el conductor.
8. Confirmar que JoinRideView fue revisado.
9. Confirmar que no quedó código muerto de toast/overlay.
10. Confirmar que no se inventó driverName.
11. Confirmar que npm run build pasa sin errores.
