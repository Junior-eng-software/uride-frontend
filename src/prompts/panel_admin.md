# Mejora UX AdminDashboard — Armonizar estilos con el resto del sistema

## Contexto

El sistema U-Ride ya tiene mejoras visuales aplicadas en:

- Dashboard de usuario
- Viajes recientes
- RideDetailView
- AdminReportDetailView
- NotificationBell

Ahora el Panel Admin funciona correctamente, pero visualmente no está en total armonía con las demás pantallas.

El objetivo es mejorar únicamente la presentación visual del panel admin, sin cambiar lógica de negocio, rutas, servicios ni endpoints.

## Objetivo

Armonizar el diseño del Panel de Control Admin para que mantenga el mismo lenguaje visual del resto del sistema:

- tarjetas modernas
- bordes redondeados
- mejor jerarquía visual
- espaciado consistente
- estado vacío profesional
- botones consistentes
- tabs más pulidos
- tabla más limpia
- buscador superior coherente con el diseño

---

# Archivos a revisar

Modificar principalmente:

```text
src/pages/adminDashboardView.tsx
```

y su CSS asociado real, por ejemplo:

```text
src/pages/adminDashboardView.css
src/pages/AdminDashboardView.css
src/styles/*
```

Antes de crear clases nuevas, revisar el CSS existente.

No modificar backend.
No modificar servicios.
No modificar rutas.
No modificar `AdminReportDetailView`.
No modificar lógica de reportes.
No modificar lógica de suspensión, advertencia o desestimación.
No modificar lógica de notificaciones.

---

# Restricción crítica — conservar NotificationBell

El header del AdminDashboard ya tiene integrada la campana de notificaciones desde Sprint 11.

Al reestructurar o estilizar el header:

- No eliminar `<NotificationBell />`.
- No eliminar su import.
- No moverlo a una posición que rompa la alineación visual.
- No duplicarlo.
- Mantenerlo funcional.

Si el header ya contiene iconos o componentes de usuario, conservarlos.

---

# Cambios requeridos

## 1. Armonizar contenedor principal

El panel admin debe usar un estilo similar al Dashboard y RideDetailView:

```css
.admin-dashboard-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}
```

Si ya existe una clase equivalente, actualizarla en lugar de duplicar.

El contenido debe mantener un ancho cómodo y espaciado consistente:

```css
.admin-content {
  padding: 2rem clamp(1rem, 4vw, 4rem);
}
```

Adaptar a las clases reales del proyecto.

---

## 2. Mejorar header de página

El header debe verse más profesional:

```tsx
<header className="admin-page-header">
  <span className="admin-section-eyebrow">Administración</span>
  <h1>Panel de Control</h1>
  <p>Resumen general de la plataforma U-Ride.</p>
</header>
```

## Importante sobre section-eyebrow

La clase `.section-eyebrow` puede existir ya en otros CSS del proyecto, por ejemplo en RideDetailView o Dashboard.

No redeclarar `.section-eyebrow` si ya existe globalmente o en archivos compartidos.

Para evitar colisiones, en AdminDashboard usar una clase específica:

```css
.admin-section-eyebrow {
  color: #16a34a;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

No duplicar `.section-eyebrow` innecesariamente.

CSS sugerido:

```css
.admin-page-header {
  margin-bottom: 1.5rem;
}

.admin-page-header h1 {
  margin: 0.25rem 0;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: #0f172a;
}

.admin-page-header p {
  margin: 0;
  color: #64748b;
}

.admin-section-eyebrow {
  color: #16a34a;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## 3. Mejorar tarjeta principal de reportes

La sección Gestión de Reportes debe sentirse como una tarjeta consistente con el resto del sistema.

Usar o adaptar:

```css
.reports-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}
```

Evitar bordes duros o estilos nativos.

---

## 4. Header interno de Gestión de Reportes

La tarjeta debe tener una cabecera ordenada:

```tsx
<div className="reports-card-header">
  <div>
    <span className="admin-section-eyebrow">Reportes</span>
    <h2>Gestión de reportes</h2>
  </div>

  <div className="report-tabs">...</div>
</div>
```

CSS:

```css
.reports-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.reports-card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

@media (max-width: 900px) {
  .reports-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

---

## 5. Mejorar tabs Todos / Pendientes / Resueltos

Los tabs deben verse como controles modernos y consistentes.

No hardcodear el contador. Mantener la lógica dinámica existente.

CSS sugerido:

```css
.report-tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem;
  border-radius: 16px;
  background: #f8fafc;
}

.report-tab {
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  padding: 0.7rem 1rem;
  font-weight: 800;
  cursor: pointer;
}

.report-tab.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: 0.4rem;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
}
```

---

## 6. Mejorar tabla

La tabla debe verse más limpia, con mejor espaciado y estados.

CSS sugerido:

```css
.reports-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th {
  padding: 1rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #e2e8f0;
}

.reports-table td {
  padding: 1rem;
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.reports-table tbody tr:hover {
  background: #f8fafc;
}
```

Si la tabla ya tiene clases, adaptar sin duplicar.

---

## 7. Mejorar estado vacío

Actualmente el mensaje vacío se ve como texto simple dentro de la tabla.

Debe verse como estado profesional.

Ejemplo:

```tsx
<tr>
  <td colSpan={COLUMN_COUNT}>
    <div className="empty-reports-state">
      <h3>No hay reportes para mostrar</h3>
      <p>No existen reportes que coincidan con los filtros seleccionados.</p>
    </div>
  </td>
</tr>
```

## Importante sobre colSpan

No hardcodear `colSpan={6}` sin verificar.

El `colSpan` debe coincidir con el número real de columnas de la tabla.

Antes de escribir el valor:

1. Contar las columnas reales en el `thead`.
2. Usar ese número en el `colSpan`.
3. Si la tabla tiene 6 columnas, usar `colSpan={6}`.
4. Si tiene 5 o 7, ajustar correctamente.

CSS:

```css
.empty-reports-state {
  margin: 1rem 0;
  padding: 2rem;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: #f8fafc;
  text-align: center;
  color: #64748b;
}

.empty-reports-state h3 {
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1rem;
}

.empty-reports-state p {
  margin: 0;
}
```

---

## 8. Mejorar botón Ver detalle

Si el botón existe en la tabla, debe verse consistente con los botones modernos.

```css
.btn-view-detail {
  border: none;
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  padding: 0.65rem 0.95rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.btn-view-detail:hover {
  background: #1e293b;
}
```

No usar botones HTML nativos.

---

## 9. Mejorar badges de estado sin colisión con otras vistas

No usar `.status-badge` en AdminDashboard si esa clase ya existe en RideDetailView u otro CSS.

Usar clase específica para reportes:

```tsx
<span className={`report-status-badge ${report.status.toLowerCase()}`}>
  {getReportStatusLabel(report.status)}
</span>
```

CSS:

```css
.report-status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 800;
}

.report-status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.report-status-badge.resolved {
  background: #dcfce7;
  color: #166534;
}

.report-status-badge.dismissed {
  background: #f1f5f9;
  color: #475569;
}
```

Si ya existe una clase equivalente para estados de reporte, actualizarla en lugar de crear duplicados.

---

## 10. Revisar buscador superior

El buscador superior ya existe. No cambiar su lógica.

Antes de añadir estilos:

1. Identificar la clase o elemento real del buscador.
2. No asumir que se llama `.admin-search-input`.
3. Aplicar la clase correcta al input real si todavía no tiene una clase clara.
4. No crear CSS que no se aplique a ningún elemento.

Ejemplo de estilo:

```css
.admin-search-input {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.75rem 1rem;
  color: #0f172a;
}
```

Si el input ya tiene otra clase, actualizar esa clase.

---

# Restricciones

- No tocar backend.
- No modificar servicios.
- No modificar rutas.
- No cambiar lógica de reportes.
- No cambiar lógica de filtros.
- No cambiar lógica de búsqueda.
- No cambiar lógica de advertir/suspender/desestimar.
- No cambiar lógica de notificaciones.
- No eliminar ni duplicar NotificationBell.
- No modificar AdminReportDetailView.
- No usar datos hardcodeados.
- No duplicar `.section-eyebrow` si ya existe en CSS compartido.
- No usar `.status-badge` para reportes si puede colisionar con otras vistas.
- No hardcodear `colSpan` sin contar columnas reales.
- No crear estilos para clases que no están aplicadas en JSX.
- No duplicar clases CSS si ya existen.
- No dejar botones nativos sin estilo.
- No usar `any`.
- TypeScript debe compilar sin errores.

---

# Validaciones visuales

Después del cambio, verificar:

1. El panel admin mantiene la misma paleta visual del Dashboard.
2. La tarjeta de reportes se ve moderna y consistente.
3. Los tabs se ven como controles profesionales.
4. El estado vacío ya no parece texto plano.
5. El `colSpan` del estado vacío ocupa correctamente toda la tabla.
6. La tabla mantiene buena legibilidad.
7. El botón Ver detalle se ve moderno.
8. Los badges de estado usan `report-status-badge`.
9. El buscador superior conserva su lógica y ahora tiene estilo coherente.
10. No se perdió ni se duplicó NotificationBell.
11. No se rompió la navegación hacia el detalle del reporte.
12. No se rompió la campana de notificaciones.

---

# Validación técnica

Ejecutar:

```bash
npm run build
```

Debe compilar sin errores.

---

# Entrega esperada

Reportar:

1. Archivos modificados.
2. Clases CSS actualizadas.
3. Confirmar que no se tocó backend.
4. Confirmar que no se cambió la lógica de reportes.
5. Confirmar que no se modificó AdminReportDetailView.
6. Confirmar que NotificationBell se conservó.
7. Confirmar que el estado vacío usa el colSpan correcto.
8. Confirmar que se usó `report-status-badge` para evitar colisiones.
9. Confirmar que no se duplicó `.section-eyebrow`.
10. Confirmar que el buscador superior usa una clase real aplicada al input.
11. Confirmar que npm run build pasa sin errores.
