# Fix visual — Viajes Recientes no aplica diseño profesional

## Problema actual

Después del rediseño de `Viajes Recientes`, la sección sigue viéndose como texto plano:

- Los viajes aparecen como líneas sueltas.
- El botón `Ver viaje` aparece con estilo nativo del navegador.
- No se ven tarjetas.
- No se aplica el diseño profesional esperado.
- El texto `CompletadoCalificación enviada` aparece pegado.
- La sección no parece un componente moderno de dashboard.

Esto indica que el JSX y/o el CSS no están correctamente conectados.

## Objetivo

Corregir únicamente la visualización de `Viajes Recientes` para que cada viaje se muestre como una tarjeta profesional.

No cambiar lógica de negocio.
No cambiar servicios.
No cambiar backend.
No cambiar rutas.
No romper `RideDetailView`.

---

# Archivos a revisar

Revisar y corregir:

```text
src/pages/dashBoardView.tsx
```

Y el CSS real asociado al Dashboard, por ejemplo:

```text
src/pages/dashBoardView.css
src/pages/DashboardView.css
src/styles/*
```

## Importante

Verificar que el archivo CSS donde se agregan las clases esté importado realmente en `dashBoardView.tsx`.

Si el CSS no está importado, agregar:

```tsx
import "./dashBoardView.css";
```

o el nombre real del archivo CSS existente.

No crear CSS en un archivo que nunca se importa.

---

# Corrección requerida en JSX

La sección debe tener esta estructura real, no texto suelto:

```tsx
<section className="recent-rides-section">
  <div className="recent-rides-header">
    <div>
      <span className="section-eyebrow">Historial reciente</span>
      <h2>Viajes recientes</h2>
    </div>
  </div>

  {recentRides.length === 0 ? (
    <div className="empty-recent-rides">
      <h3>No tienes viajes recientes</h3>
      <p>Cuando completes o participes en un viaje, aparecerá aquí.</p>
    </div>
  ) : (
    <div className="recent-rides-grid">
      {recentRides.map((ride) => {
        const isRatingSent = ratedRideIds.has(ride.id);

        return (
          <article key={ride.id} className="recent-ride-card">
            <div className="ride-card-main">
              <div className="ride-route">
                <span>{ride.originZone}</span>
                <span className="route-arrow">→</span>
                <span>{ride.destinationZone}</span>
              </div>

              <p className="ride-date">{formatDateTime(ride.departureTime)}</p>
            </div>

            <div className="ride-card-footer">
              <div className="ride-badges">
                <span className={`status-pill ${ride.status.toLowerCase()}`}>
                  {getStatusLabel(ride.status)}
                </span>

                {isRatingSent && (
                  <span className="rating-pill">Calificación enviada</span>
                )}
              </div>

              <button
                type="button"
                className="btn-view-ride"
                onClick={() =>
                  navigate(`/rides/${ride.id}/detail`, {
                    state: { ride },
                  })
                }
              >
                Ver viaje
              </button>
            </div>
          </article>
        );
      })}
    </div>
  )}
</section>
```

## Importante sobre `ratedRideIds`

Adaptar esta línea al código real:

```tsx
const isRatingSent = ratedRideIds.has(ride.id);
```

Si `ratedRideIds` no es un `Set`, usar la lógica existente actual.

No crear nueva consulta al backend.
No romper la lógica actual de `Calificación enviada`.

---

# Definir getStatusLabel si no existe

Si no existe, agregar en `dashBoardView.tsx`:

```tsx
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    Pending: "Pendiente",
    Active: "Activo",
    Completed: "Completado",
    Cancelled: "Cancelado",
  };

  return labels[status] ?? status;
};
```

---

# CSS obligatorio

Asegurar que estas clases existan en el CSS importado por el Dashboard:

```css
.recent-rides-section {
  margin-top: 2rem;
}

.recent-rides-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-eyebrow {
  display: block;
  color: #16a34a;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}

.recent-rides-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.recent-rides-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 1rem;
}

.recent-ride-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 1.1rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-ride-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.ride-card-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ride-route {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}

.route-arrow {
  color: #64748b;
}

.ride-date {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
}

.ride-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ride-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-pill,
.rating-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
}

.status-pill.completed {
  background: #dcfce7;
  color: #166534;
}

.status-pill.pending,
.status-pill.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-pill.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.rating-pill {
  background: #ecfdf5;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.btn-view-ride {
  border: none;
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  padding: 0.65rem 0.95rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.btn-view-ride:hover {
  background: #1e293b;
}

.empty-recent-rides {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 22px;
  padding: 1.5rem;
  color: #64748b;
}

.empty-recent-rides h3 {
  margin: 0 0 0.35rem;
  color: #0f172a;
}

.empty-recent-rides p {
  margin: 0;
}

@media (max-width: 900px) {
  .recent-rides-grid {
    grid-template-columns: 1fr;
  }

  .ride-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .btn-view-ride {
    width: 100%;
  }
}
```

---

# Validaciones visuales obligatorias

Después del cambio, verificar:

1. Cada viaje aparece dentro de una tarjeta blanca.
2. El botón `Ver viaje` ya no aparece como botón HTML nativo.
3. `Completado` y `Calificación enviada` aparecen separados como badges.
4. No aparece texto pegado como `CompletadoCalificación enviada`.
5. Hay separación visual entre tarjetas.
6. En desktop se ven 2 columnas si hay espacio.
7. En pantallas pequeñas se ve 1 columna.
8. `Ver viaje` sigue navegando a `/rides/:rideId/detail`.

---

# Restricciones

- No tocar backend.
- No tocar servicios.
- No tocar rutas.
- No cambiar la lógica de carga de viajes.
- No cambiar la lógica de calificación.
- No crear nuevas consultas.
- No usar `any`.
- No dejar CSS en un archivo no importado.
- No dejar botones nativos sin clase.
- No dejar `getStatusLabel` sin definir.
- TypeScript debe compilar sin errores.

---

# Entrega esperada

Reportar:

1. Archivo JSX modificado.
2. Archivo CSS modificado.
3. Confirmar que el CSS está importado.
4. Confirmar que cada viaje se renderiza como `article.recent-ride-card`.
5. Confirmar que `Completado` y `Calificación enviada` están en contenedores separados.
6. Confirmar que `Ver viaje` usa clase `btn-view-ride`.
7. Confirmar que `npm run build` pasa sin errores.

```

```
