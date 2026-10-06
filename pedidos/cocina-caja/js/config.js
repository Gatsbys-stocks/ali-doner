/* =====================================================================
   CONFIGURACIÓN DE COCINA Y CAJA · Ali Doner Kebab
   Firebase tiene que ser EL MISMO que en la tablet de mesa (pedidos/mesa/js/config.js).
   ===================================================================== */
/* =====================================================================
   CONFIGURACIÓN DE SINCRONIZACIÓN (Firebase Realtime Database)
   ---------------------------------------------------------------------
   Para que TODOS los móviles vean las mismas mesas en tiempo real:

   1. Ve a https://console.firebase.google.com → "Crear proyecto"
      (es gratis, no hace falta tarjeta).
   2. Dentro del proyecto: icono "</>" → "Añadir app web" → dale un
      nombre → copia el objeto "firebaseConfig" que te muestra y
      pégalo abajo, sustituyendo el que hay ahora.
   3. Menú lateral → "Realtime Database" → "Crear base de datos"
      → elige la región más cercana → modo "prueba" (o bloqueado, ya
      pondremos reglas).
   4. Menú lateral → "Authentication" → pestaña "Sign-in method" →
      activa "Anónimo".
   5. Vuelve a "Realtime Database" → pestaña "Reglas" y pega esto:
        {
          "rules": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      → "Publicar".

   Mientras dejes el apiKey de abajo tal cual ("TU_API_KEY"), la app
   funciona en modo local: cada móvil ve solo sus propios cambios,
   sin compartir nada (útil para probar antes de configurar Firebase).
   ===================================================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOeKqKPDWA_Ha9jzZnveQaHcFtx4wWZGE",
  authDomain: "kobo-2aea4.firebaseapp.com",
  databaseURL: "https://kobo-2aea4-default-rtdb.firebaseio.com",
  projectId: "kobo-2aea4",
  storageBucket: "kobo-2aea4.firebasestorage.app",
  messagingSenderId: "490070778149",
  appId: "1:490070778149:web:6fc91223d6fe9f04697acc"
};
// Todo lo de Ali Doner Kebab se guarda bajo esta carpeta de la base de datos,
// separado de cualquier otro local que use el mismo proyecto de Firebase.
const DB_ROOT = "alidoner/";
