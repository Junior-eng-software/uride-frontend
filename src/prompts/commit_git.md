# Subir solo cambios del backend a GitHub

## Objetivo

Subir únicamente las actualizaciones del backend de U-Ride a GitHub.

No incluir cambios del frontend.

## Paso 1 — Verificar rama actual

Ejecuta:

```bash
git status
git branch --show-current
```

Reporta la rama actual antes de continuar.

## Paso 2 — Revisar cambios del backend

Ejecuta:

```bash
git diff --stat
git status
```

Confirmar que los cambios correspondan solo a carpetas del backend, por ejemplo:

```text
URide.API/
URide.Application/
URide.Domain/
URide.Infrastructure/
```

No incluir archivos del frontend como:

```text
src/
package.json
vite.config.ts
index.html
```

## Paso 3 — Agregar solo backend al staging

Ejecutar:

```bash
git add URide.API URide.Application URide.Domain URide.Infrastructure
```

Si existe archivo de solución o configuración backend modificada, revisar antes de agregar:

```bash
git status
```

Si corresponde, agregar también:

```bash
git add URide.sln
```

Solo si realmente fue modificado por cambios backend.

## Paso 4 — Revisar staged changes

Ejecutar:

```bash
git diff --cached --stat
git status
```

Verificar que no haya archivos frontend en staging.

Si aparece frontend por error, quitarlo del staging:

```bash
git restore --staged ruta/del/archivo
```

## Paso 5 — Crear commit

Ejecutar:

```bash
git commit -m "feat: add backend notifications and ride detail endpoint"
```

## Paso 6 — Sincronizar con remoto

Ejecutar:

```bash
git pull --rebase origin $(git branch --show-current)
```

Si hay conflictos, detenerse y reportar los archivos en conflicto. No resolver automáticamente si no está claro.

## Paso 7 — Subir a GitHub

Ejecutar:

```bash
git push origin $(git branch --show-current)
```

## Restricciones

- No subir frontend.
- No usar `git add .`.
- No usar `git push --force`.
- No usar `git reset --hard`.
- No borrar archivos.
- No cambiar de rama sin avisar.
- No incluir `.env`, credenciales, cadenas de conexión reales ni secretos.
- Si hay conflictos, detenerse y reportar.

## Entrega esperada

Al finalizar, reportar:

1. Rama usada.
2. Archivos backend incluidos.
3. Hash del commit.
4. Resultado del push.
5. Confirmar que no se subieron archivos frontend.

````

Comando clave para evitar subir frontend:

```bash
git add URide.API URide.Application URide.Domain URide.Infrastructure
````

Evita usar:

```bash
git add .
```
