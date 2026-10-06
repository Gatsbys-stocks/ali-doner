# Ali Doner Kebab · Web y apps

Dos partes: la web y el sistema de pedidos (tablet en cada mesa + cocina y caja).
Cada carpeta final se sube tal cual a un hosting estático (GitHub Pages, Netlify…) y funciona sola.

```
web/                     Página web del local (clientes en internet)
pedidos/
  ├── mesa/              Tablet en cada mesa (los clientes piden desde la mesa)
  └── cocina-caja/       Cocina y caja: comandas, cocina, cobro y avisos de las mesas
```

## Estructura de cada carpeta

| Carpeta | HTML | Estilos | Lógica | Datos y ajustes |
|---|---|---|---|---|
| `web/` | `index.html` | `css/styles.css` | `js/main.js` | `js/config.js` (horario, mapa, reseñas) · `js/carta.js` (platos y precios) |
| `pedidos/mesa/` | `index.html` | `css/mesa.css` | `js/mesa.js` | `js/config.js` (Firebase, PIN, mesas) · `js/menu-data.js` (platos, precios y 8 idiomas) |
| `pedidos/cocina-caja/` | `index.html` | `css/app.css` | `js/app.js`, `js/avisos.js`, `js/teclado.js`, `js/cajon.js` | `js/config.js` (Firebase) · `js/carta.js` (platos y precios) |

Las imágenes están en `img/` y los iconos de la app (`icon-*.png`, `manifest.json`) en la raíz de cada carpeta.

## Cómo se conectan

1. El cliente pide en la **tablet de mesa** (`pedidos/mesa/`).
2. Los platos se añaden a la comanda de esa mesa en Firebase (`alidoner/sessions/sala/orders/<mesa>`).
3. **Cocina y Caja** (`pedidos/cocina-caja/`) los ve al momento y muestra un aviso con sonido (`alidoner/sessions/sala/inbox`).
4. Los botones "Llamar al camarero" y "Pedir la cuenta" también llegan como aviso.

Las dos apps tienen que usar **el mismo Firebase**: `pedidos/mesa/js/config.js` y `pedidos/cocina-caja/js/config.js`.

## Cambiar un precio o un plato

El número de cada plato (por ejemplo `"0-3"`) tiene que ser el mismo en las dos apps, porque es lo que se guarda en la comanda.

- **Cocina y Caja:** `pedidos/cocina-caja/js/carta.js`
- **Tablet de mesa:** `pedidos/mesa/js/menu-data.js`
- **Web:** `web/js/carta.js`

## Ajustes útiles

- **Horario de la web:** `web/js/config.js` → `OPEN_MIN` y `CLOSE_MIN`.
- **Mapa:** `web/js/config.js` → `USE_GOOGLE_MAP_EMBED`. Con `true` sale el mapa real de Google; con `false`, el mapa ilustrado.
- **Reseñas de Google en tarjetas:** pega una clave de Google Maps en `web/js/config.js` → `GOOGLE_API_KEY`. Los pasos están explicados en el mismo archivo. Sin clave salen la nota y los botones de reseña.
- **Número de mesa de cada tablet:** toca 5 veces el número de mesa arriba a la derecha y pon el PIN (`1234` por defecto, se cambia en `pedidos/mesa/js/config.js` → `ADMIN_PIN`). Desde ahí también se pone en pantalla completa.
- **Instalar en tablets y móviles:** abre la página en el navegador y usa "Añadir a pantalla de inicio".

## Antes de abrir al público

- Crear un proyecto de Firebase propio para el local y poner sus datos en los dos `config.js`.
- Probar un pedido real con dos dispositivos: uno con `pedidos/mesa/` y otro con `pedidos/cocina-caja/`.
- Confirmar los precios dudosos (Döner clásico, Menú dürüm, Menú döner), la hora de cierre y si el móvil tiene WhatsApp.
