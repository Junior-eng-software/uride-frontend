# Subir solo cambios del frontend a GitHub

## Objetivo

Subir únicamente las actualizaciones del frontend de U-Ride a GitHub.

No incluir cambios del backend.

## Paso 1 — Verificar ubicación del repositorio

Asegúrate de estar en la carpeta del frontend, por ejemplo:

```bash
pwd
```

Debe estar en algo similar a:

```text
uride-frontend
```

Luego verifica la rama actual:

```bash
git status
git branch --show-current
```

Reporta la rama actual antes de continuar.

## Paso 2 — Revisar cambios del frontend

Ejecuta:

```bash
git status
git diff --stat
```

Confirma que los cambios correspondan solo al frontend, por ejemplo:

```text
src/
package.json
package-lock.json
vite.config.ts
tsconfig.json
index.html
```

No incluir carpetas del backend como:

```text
URide.API/
URide.Application/
URide.Domain/
URide.Infrastructure/
```

## Paso 3 — Agregar solo frontend al staging

Si estás dentro del repositorio del frontend, ejecutar:

```bash
git add src package.json package-lock.json vite.config.ts tsconfig.json index.html
```

Si algunos archivos no existen, ignorar esos archivos y agregar solo los existentes.

Si todo el repositorio es exclusivamente frontend, también se puede usar:

```bash
git add .
```

Pero antes confirmar que no hay carpetas backend dentro de este repositorio.

## Paso 4 — Revisar staged changes

Ejecutar:

```bash
git diff --cached --stat
git status
```

Verificar que no haya archivos backend en staging.

Si aparece backend por error, quitarlo del staging:

```bash
git restore --staged ruta/del/archivo
```

## Paso 5 — Crear commit

Ejecutar:

```bash
git commit -m "feat: add notifications and improve ride dashboard UI"
```

Si el commit incluye también mejoras del panel admin, usar:

```bash
git commit -m "feat: improve frontend notifications and dashboard UI"
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

- No subir backend.
- No usar `git push --force`.
- No usar `git reset --hard`.
- No borrar archivos.
- No cambiar de rama sin avisar.
- No subir `.env`, tokens, claves, credenciales ni archivos sensibles.
- Si hay conflictos, detenerse y reportar.
- Si `git commit` dice que no hay cambios, no crear commit vacío.

## Entrega esperada

Al finalizar, reportar:

1. Rama usada.
2. Archivos frontend incluidos.
3. Hash del commit.
4. Resultado del push.
5. Confirmar que no se subieron archivos backend.

````

Comando recomendado si tu repo es **solo frontend**:

```bash
git status
git add .
git commit -m "feat: improve frontend notifications and dashboard UI"
git pull --rebase origin $(git branch --show-current)
git push origin $(git branch --show-current)
````

Si frontend y backend están en el mismo repositorio, evita `git add .` y usa mejor:

```bash
git add src package.json package-lock.json vite.config.ts tsconfig.json index.html
```
