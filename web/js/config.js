/* =====================================================================
   CONFIGURACIÓN DE LA WEB · Ali Doner Kebab
   Todo lo que se suele cambiar está aquí. Los platos y precios están en js/carta.js
   ===================================================================== */

/* Horario (minutos desde las 00:00). Sirve para el aviso "Abierto ahora / Cerrado"
   y para la tabla de horario de la sección Contacto. */
const OPEN_MIN = 11 * 60;   // abre a las 11:00
const CLOSE_MIN = 24 * 60;  // cierra a las 00:00 (para la 01:00 pon 25 * 60)

/* Mapa de "Dónde estamos": true = mapa real de Google Maps, false = mapa ilustrado */
const USE_GOOGLE_MAP_EMBED = true;

/* Reseñas de Google
   1. En Google Cloud: activa "Maps JavaScript API" y "Places API (New)".
   2. Crea una clave y restríngela al dominio de la web (Restricciones de aplicación > Sitios web).
   3. Pon un límite de unas 30 peticiones al día para no pasar de las 1.000 gratis al mes.
   4. Pega la clave aquí. Sin clave, la web enseña la nota y los botones, sin las tarjetas. */
const GOOGLE_API_KEY = "";
const PLACE_ID = "ChIJ700T7dqipBIRBsOpaom4KTE";   // ficha de Ali Doner Kebab en Google Maps
const MIN_STARS = 4;   // solo enseña reseñas de 4 y 5 estrellas (pon 1 para enseñarlas todas)
