# Backend — Agregar endpoint GET /api/Rides/{rideId}

## Contexto

En el frontend se necesita crear una página dedicada para visualizar el detalle completo de un viaje al hacer clic en `Ver viaje`.

Actualmente Swagger confirma que no existe:

```text
GET /api/Rides/{rideId}
```

````

Sin este endpoint, una vista como `RideDetailView` no puede cargar el viaje si el usuario entra directamente por URL o recarga la página.

El proyecto ya tiene:

- `RidesController`
- `IRideService`
- `RideService`
- `AppDbContext`
- Entidad `Ride`
- DTO/schema `RideResponse`
- Endpoints relacionados con rides
- Parámetro `rideId` usado en otras rutas del mismo controlador

## Objetivo

Agregar un endpoint backend para obtener el detalle de un viaje por ID.

Ruta requerida:

```text
GET /api/Rides/{rideId}
```

## Alcance

Modificar únicamente backend.

Revisar y modificar solo si corresponde:

```text
URide.API/Controllers/RidesController.cs
URide.Application/Interfaces/IRideService.cs
URide.Infrastructure/Services/RideService.cs
```

No tocar frontend.
No crear migraciones.
No modificar base de datos.
No modificar entidades si no es necesario.
No cambiar contratos existentes.
No romper endpoints actuales.

---

# Requisito crítico de ruta

El endpoint debe declararse obligatoriamente con constraint `:guid`:

```csharp
[HttpGet("{rideId:guid}")]
```

No usar:

```csharp
[HttpGet("{rideId}")]
```

Motivo:

Ya existen rutas como:

```text
GET /api/Rides/search
GET /api/Rides/me
```

El constraint `:guid` evita colisiones con `search` y `me`.

---

# Requisitos funcionales

## 1. Endpoint en RidesController

Agregar:

```text
GET /api/Rides/{rideId}
```

Debe:

- Requerir autenticación si el controlador ya usa `[Authorize]`.
- Recibir `rideId` como `Guid`.
- Retornar `RideResponse`.
- Retornar `404 NotFound` si el viaje no existe.
- Usar el servicio existente si el proyecto sigue patrón service/controller.
- No consultar directamente `AppDbContext` desde el controlador si el patrón actual usa `RideService`.

Ejemplo orientativo:

```csharp
[HttpGet("{rideId:guid}")]
public async Task<ActionResult<RideResponse>> GetRideById(
    Guid rideId,
    CancellationToken cancellationToken)
{
    var ride = await _rideService.GetRideByIdAsync(rideId, cancellationToken);

    if (ride is null)
    {
        return NotFound();
    }

    return Ok(ride);
}
```

Ajustar nombres según el patrón real del proyecto.

---

## 2. Método en IRideService

Si existe `IRideService`, agregar:

```csharp
Task<RideResponse?> GetRideByIdAsync(
    Guid rideId,
    CancellationToken cancellationToken = default);
```

No crear una interfaz nueva si ya existe una interfaz de rides.

---

## 3. Implementación en RideService

Antes de implementar `GetRideByIdAsync`, buscar cómo se mapea `Ride` a `RideResponse` en los métodos existentes de `RideService`, por ejemplo:

- método de búsqueda de viajes
- método de mis viajes
- método de viajes confirmados
- cualquier método que ya retorne `RideResponse`

Usar exactamente el mismo patrón de mapeo.

No crear un método nuevo de mapeo si ya existe uno.
No duplicar lógica de mapeo si ya existe.
No inventar propiedades nuevas.
No devolver entidad `Ride` directamente.

Debe consultar el viaje por ID y mapearlo a `RideResponse`.

Reglas:

- Usar `AsNoTracking()` si es solo lectura.
- Incluir relaciones necesarias si `RideResponse` las requiere.
- Reutilizar el mapper existente si ya hay método para mapear `Ride` a `RideResponse`.
- Si el proyecto usa proyección `.Select(...)` para construir `RideResponse`, usar ese mismo patrón.
- Si el proyecto usa AutoMapper, usar AutoMapper.
- Si el proyecto usa método privado tipo `MapToRideResponse`, reutilizarlo.

Ejemplo orientativo:

```csharp
public async Task<RideResponse?> GetRideByIdAsync(
    Guid rideId,
    CancellationToken cancellationToken = default)
{
    var ride = await _dbContext.Rides
        .AsNoTracking()
        .Include(r => r.Driver)
        .FirstOrDefaultAsync(r => r.Id == rideId, cancellationToken);

    if (ride is null)
    {
        return null;
    }

    return MapRideResponse(ride);
}
```

Ajustar:

- nombre real de `_dbContext`
- relación real del conductor
- mapper real
- propiedades reales de `RideResponse`

---

# 4. Seguridad y alcance

No agregar validación restrictiva de propietario si los endpoints actuales de rides permiten consultar viajes publicados o relacionados.

Mantener `[Authorize]` si el controlador ya está protegido.

No permitir acceso anónimo si el resto de rutas de rides requieren autenticación.

---

# 5. NotFound

Si no existe el viaje:

```text
HTTP 404
```

No retornar objeto vacío.
No retornar `200` con `null`.

---

# Restricciones

- No tocar frontend.
- No modificar migraciones.
- No modificar base de datos.
- No crear endpoints adicionales.
- No cambiar nombres de endpoints existentes.
- No romper `GET /api/Rides/search`.
- No romper `GET /api/Rides/me`.
- No romper solicitudes.
- No romper calificaciones.
- No romper completar viaje.
- No consultar `AppDbContext` directamente desde el controlador si el patrón actual usa servicio.
- No duplicar lógica de mapeo si ya existe.
- No crear DTO nuevo si `RideResponse` ya existe.
- El endpoint debe usar `[HttpGet("{rideId:guid}")]`.
- Backend debe compilar sin errores.

---

# Validaciones esperadas

Ejecutar:

```bash
dotnet build
```

Debe compilar con 0 errores.

Validar en Swagger que aparezca:

```text
GET /api/Rides/{rideId}
```

Probar con un ID existente:

```text
GET /api/Rides/{rideId}
→ 200 OK
→ RideResponse
```

Probar con un ID inexistente:

```text
GET /api/Rides/{rideId}
→ 404 NotFound
```

Probar que no se rompieron:

```text
GET /api/Rides/search
GET /api/Rides/me
```

---

# Entrega esperada

Al finalizar, reportar:

1. Archivos modificados.
2. Método agregado al controlador.
3. Método agregado al servicio/interfaz.
4. Confirmar que se usó `[HttpGet("{rideId:guid}")]`.
5. Confirmar que se reutilizó `RideResponse`.
6. Confirmar que se reutilizó el patrón de mapeo existente.
7. Confirmar que no se tocaron migraciones.
8. Resultado de `dotnet build`.
9. Confirmar que Swagger muestra `GET /api/Rides/{rideId}`.

````
