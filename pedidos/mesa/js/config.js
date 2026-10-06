/* =====================================================================
   CONFIGURACIÓN DE LA TABLET DE MESA · Ali Doner Kebab
   Firebase tiene que ser EL MISMO que en la app de Cocina y Caja (pedidos/cocina-caja/js/config.js).
   Los platos, precios e idiomas están en js/menu-data.js
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
const DB_ROOT = "alidoner/";          // igual que la app de Cocina y Caja
const SESSION = "sala";               // igual que la app de Cocina y Caja
const ADMIN_PIN = "1234";             // para cambiar el número de mesa (toca 5 veces el número de mesa)
const NUM_TABLES = 10;
const IDLE_MS = 90 * 1000;            // vuelve a la bienvenida si nadie toca y no hay pedido a medias
