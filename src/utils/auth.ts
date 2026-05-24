/**
 * Extrae y decodifica el ID del usuario directamente del JWT almacenado en el navegador.
 * Maneja internamente los claims de .NET 8 con fallback estándar.
 * @returns {string | null} El ID del usuario o null si no hay sesión/token válido.
 */
export function getCurrentUserId(): string | null {
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

        const payload = JSON.parse(jsonPayload);
        
        // Retornamos el claim específico de .NET o el 'sub' (subject) estándar
        return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
               || payload.sub 
               || null;
    } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
        return null;
    }
}