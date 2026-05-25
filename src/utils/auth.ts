function decodeJwtPayload(): Record<string, unknown> | null {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return null;
    }

    try {
        // Extraemos el payload (la segunda parte del JWT separada por puntos)
        const base64Url = token.split('.')[1];
        // Reemplazamos caracteres URL-safe por base64 estándar
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Decodificamos de forma nativa
        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );

        return JSON.parse(jsonPayload) as Record<string, unknown>;
    } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
        return null;
    }
}   

/**
 * Extrae y decodifica el ID del usuario directamente del JWT almacenado en el navegador.
 * Maneja internamente los claims de .NET 8 con fallback estándar.
 * @returns {string | null} El ID del usuario o null si no hay sesión/token válido.
 */
export function getCurrentUserId(): string | null {
    const payload = decodeJwtPayload();

    return payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string
        ?? payload?.['sub'] as string
        ?? null;
}

/**
 * Extrae el rol actual del usuario desde el JWT almacenado en el navegador.
 * @returns {string | null} El rol del usuario o null si no hay sesión/token válido.
 */
export function getCurrentUserRole(): string | null {
    const payload = decodeJwtPayload();

    return payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string
        ?? null;
}