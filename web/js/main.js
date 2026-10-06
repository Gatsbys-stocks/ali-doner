/* Lógica de la web · Ali Doner Kebab (no hace falta tocar nada aquí) */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const eur = n => n.toFixed(2).replace(".", ",") + " €";

/* ===== Horario (se configura en js/config.js) ===== */
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2,"0") + ":" + String(m % 60).padStart(2,"0");
function madridNow(){
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value;
  const wd = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(get("weekday"));
  return { day: wd < 0 ? 0 : wd, min: (parseInt(get("hour"),10) % 24) * 60 + parseInt(get("minute"),10) };
}
(function(){
  const now = madridNow();
  document.getElementById("hours").innerHTML = DAYS.map((d,i) =>
    `<tr class="${i === now.day ? "today" : ""}"><td>${d}${i === now.day ? " · hoy" : ""}</td><td>${hhmm(OPEN_MIN)} – ${hhmm(CLOSE_MIN)}</td></tr>`).join("");
  const open = now.min >= OPEN_MIN && now.min < CLOSE_MIN;
  document.getElementById("status").classList.toggle("closed", !open);
  document.getElementById("status-txt").textContent = open
    ? "Abierto ahora · hasta las " + hhmm(CLOSE_MIN)
    : "Cerrado ahora · abrimos a las " + hhmm(OPEN_MIN);
})();

/* ===== Cinta de ofertas ===== */
(function(){
  const t = ["Dürüm clásico <em>5,50€</em>","Döner box <em>4,99€</em>","Taco francés <em>7,50€</em>","100% halal","Menú dürüm <em>10,50€</em>","3 dürüm + cola 2 L <em>22,90€</em>","Abierto cada día"];
  const html = t.map(x => `<span>${x} ★</span>`).join("");
  document.getElementById("ticker").innerHTML = html + html;
})();

const ICON = { "Dürüm kebab":"durum","Döner kebab":"box","Platos combinados":"tomato","Taco francés":"durum","Ofertas para compartir":"cup",
  "Hamburguesas y menús":"box","Vegetal":"leaf","Raciones":"chili","Ensaladas":"leaf","Bebidas y postre":"cup" };
const VB = { durum:"0 0 220 460", box:"0 0 200 230" };
const chips = document.getElementById("chips"), cats = document.getElementById("cats");
let active = "Todo";
function renderCarta(){
  chips.innerHTML = ["Todo", ...CARTA.map(c => c[0])].map(n =>
    `<button class="chip" type="button" aria-pressed="${n === active}" data-c="${esc(n)}">${esc(n)}</button>`).join("");
  cats.innerHTML = CARTA.filter(c => active === "Todo" || c[0] === active).map(([name, note, items]) => {
    const ic = ICON[name] || "tomato";
    return `<article class="cat rise"><h3><svg class="ico" viewBox="${VB[ic] || "0 0 100 100"}" aria-hidden="true"><use href="#${ic}"/></svg>${esc(name)}</h3>${note ? `<p class="note">Elige: ${note}</p>` : ""}
      ${items.map(([n,p,d,t]) => `<div class="item"><span class="n">${esc(n)}${t ? `<span class="tag${/veg/i.test(t) ? " v" : ""}">${t}</span>` : ""}</span><span class="pr">${eur(p)}</span>${d ? `<span class="d">${esc(d)}</span>` : ""}</div>`).join("")}
    </article>`;
  }).join("");
  watchRise();
}
chips.addEventListener("click", e => { const b = e.target.closest(".chip"); if(!b) return; active = b.dataset.c; renderCarta(); });

/* ===== Entrada al hacer scroll: solo movimiento, el contenido siempre se ve ===== */
let io = null;
function watchRise(){
  if(reduceMotion || !("IntersectionObserver" in window)) return;
  if(!io) io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting){ e.target.classList.remove("off"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  const vh = window.innerHeight;
  document.querySelectorAll(".rise:not([data-w])").forEach((el, i) => {
    el.dataset.w = "1";
    if(el.getBoundingClientRect().top > vh){ el.classList.add("off"); el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); }
  });
}
renderCarta();

/* ===== Animaciones ligadas al scroll ===== */
(function(){
  if(reduceMotion) return;
  const photo = document.getElementById("photo"), stage = document.getElementById("stage");
  const pcs = [...document.querySelectorAll(".pc")].map(el => {
    const cx = parseFloat(el.style.left) + parseFloat(el.style.width) / 2 - 50;
    const cy = parseFloat(el.style.top) + 6 - 55;
    const len = Math.hypot(cx, cy) || 1;
    return { el, dx: cx / len, dy: cy / len, spin: (cx > 0 ? 1 : -1) * (0.04 + Math.random() * 0.05) };
  });
  const flies = [...document.querySelectorAll("[data-fly]")];
  let ticking = false;
  function frame(){
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    if(y < vh * 1.6){
      photo.style.transform = `translateY(${y * 0.12}px) rotate(${y * 0.012}deg)`;
      const f = Math.min(1, stage.clientWidth / 470), up = window.innerWidth > 900 ? 0.2 : 0;
      pcs.forEach(p => { const k = y * 0.55 * f; p.el.style.transform = `translate(${p.dx * k}px, ${p.dy * k - y * up}px) rotate(${y * p.spin * 4}deg)`; });
    }
    flies.forEach(band => {
      const r = band.getBoundingClientRect();
      if(r.bottom < -60 || r.top > vh + 60) return;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const w = band.clientWidth, flyer = band.querySelector(".flyer");
      const fw = flyer.getBoundingClientRect().width || 150;
      const rtl = band.dataset.dir === "rtl";
      const x = rtl ? w - p * (w + fw) : -fw + p * (w + fw);
      const rot = (rtl ? -65 : 65) + Math.sin(p * Math.PI * 4) * 8;
      const bob = Math.sin(p * Math.PI * 3) * 22;
      flyer.style.transform = `translate(${x}px, ${bob}px) rotate(${rot}deg)` + (rtl ? " scaleX(-1)" : "");
      const trail = band.querySelector(".trail");
      trail.style.transformOrigin = rtl ? "right" : "left";
      trail.style.transform = `scaleX(${p})`;
    });
  }
  window.addEventListener("scroll", () => { if(!ticking){ ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener("resize", frame);
  frame();
})();

/* ===== Mapa: ilustrado (Eixample con chaflanes) o Google Maps (ver js/config.js) ===== */
(function(){
  const card = document.getElementById("mapcard");
  if(USE_GOOGLE_MAP_EMBED){
    const f = document.createElement("iframe");
    f.src = "https://maps.google.com/maps?q=Ali+Doner+Kebab,+Carrer+de+C%C3%B2rsega+629,+08025+Barcelona&z=16&output=embed";
    f.title = "Mapa de Ali Doner Kebab"; f.loading = "lazy";
    card.appendChild(f);
    document.getElementById("tagmap").hidden = true;
    return;
  }
  const svg = document.getElementById("eixample");
  const P = 86, B = 68, C = 15, cx = 320, cy = 220;
  let blocks = "";
  for(let i = -6; i <= 5; i++) for(let j = -5; j <= 4; j++){
    const x = cx + i * P + (P - B) / 2, y = cy + j * P + (P - B) / 2;
    const pts = [[x+C,y],[x+B-C,y],[x+B,y+C],[x+B,y+B-C],[x+B-C,y+B],[x+C,y+B],[x,y+B-C],[x,y+C]].map(p => p.join(",")).join(" ");
    blocks += `<polygon points="${pts}" fill="#2a201b" stroke="#3a2c25" stroke-width="1.5"/>`;
  }
  svg.innerHTML = `
    <rect width="640" height="440" fill="#18120f"/>
    <g transform="rotate(-42 ${cx} ${cy})">
      ${blocks}
      <line x1="-260" y1="${cy}" x2="900" y2="${cy}" stroke="#ffb627" stroke-width="10" stroke-linecap="round" opacity=".9"/>
      <text x="${cx - 150}" y="${cy - 12}" font-family="Figtree, sans-serif" font-weight="800" font-size="15" letter-spacing="3" fill="#ffb627">C/ DE CÒRSEGA</text>
    </g>
    <g transform="translate(372 100)">
      <rect x="-15" y="-15" width="30" height="30" rx="7" fill="#d22b20"/>
      <text y="6" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="900" font-size="18" fill="#ffffff">M</text>
      <rect x="20" y="-12" width="168" height="24" rx="12" fill="#18120f" opacity=".85"/>
      <text x="30" y="5" font-family="Figtree, sans-serif" font-weight="700" font-size="13" fill="#fff3e2">Sant Pau | Dos de Maig</text>
    </g>
    <g transform="translate(150 405)">
      <path d="M-18 14 L-14 -18 L-10 14 Z M-6 14 L-1 -30 L4 14 Z M8 14 L13 -24 L18 14 Z" fill="#c4b3a1"/>
      <rect x="24" y="-6" width="124" height="24" rx="12" fill="#18120f" opacity=".85"/>
      <text x="32" y="10" font-family="Figtree, sans-serif" font-weight="700" font-size="13" fill="#c4b3a1">Sagrada Família</text>
    </g>
    <g transform="translate(330 214)">
      <circle class="pin-pulse" r="22" fill="#ff4a3d"/>
      <path d="M0 6 C-16 -12 -20 -22 -20 -32 a20 20 0 0 1 40 0 c0 10 -4 20 -20 38z" fill="#ff4a3d" stroke="#fff3e2" stroke-width="3"/>
      <circle cy="-32" r="8" fill="#fff3e2"/>
      <rect x="-66" y="16" width="132" height="30" rx="15" fill="#fff3e2"/>
      <text y="36" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="14" fill="#1a120e">Ali Doner Kebab</text>
    </g>`;
})();

/* ===== Reseñas de Google (clave y opciones en js/config.js) ===== */
document.getElementById("rv-write").href = "https://search.google.com/local/writereview?placeid=" + PLACE_ID;
document.getElementById("rv-all").href = "https://search.google.com/local/reviews?placeid=" + PLACE_ID;

function paintReviews(rating, count, reviews){
  if(rating){
    document.getElementById("rv-rating").textContent = rating.toFixed(1).replace(".", ",");
    document.getElementById("rv-stars").style.width = (rating / 5 * 100) + "%";
  }
  if(count) document.getElementById("rv-count").textContent = count.toLocaleString("es-ES");
  const list = (reviews || []).filter(r => (r.rating || 0) >= MIN_STARS && r.text);
  if(!list.length) return;
  const grid = document.getElementById("rv-grid");
  grid.innerHTML = list.map(r => {
    const a = r.author || {};
    const pic = a.photo ? `<img src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="ph">${esc((a.name || "?").charAt(0))}</span>`;
    const name = a.uri ? `<a href="${esc(a.uri)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name || "");
    return `<article class="rv"><div class="rv-head">${pic}<div>${name}<small>${esc(r.when || "")}</small></div></div>
      <span class="stars" aria-label="${r.rating} de 5 estrellas"><i style="width:${r.rating / 5 * 100}%"></i></span>
      <p>${esc(r.text)}</p></article>`;
  }).join("");
  grid.hidden = false;
  document.getElementById("rv-src").hidden = false;
}
async function loadReviews(){
  try{
    const cached = JSON.parse(localStorage.getItem("ali_reviews") || "null");
    if(cached && Date.now() - cached.t < 12 * 3600 * 1000){ paintReviews(cached.rating, cached.count, cached.reviews); return; }
  }catch(e){}
  try{
    const { Place } = await google.maps.importLibrary("places");
    const place = new Place({ id: PLACE_ID, requestedLanguage: "es" });
    await place.fetchFields({ fields: ["rating", "userRatingCount", "reviews"] });
    const reviews = (place.reviews || []).map(r => ({
      rating: r.rating, text: r.text || r.originalText || "", when: r.relativePublishTimeDescription,
      author: { name: r.authorAttribution && r.authorAttribution.displayName,
                photo: r.authorAttribution && r.authorAttribution.photoURI,
                uri: r.authorAttribution && r.authorAttribution.uri }
    }));
    paintReviews(place.rating, place.userRatingCount, reviews);
    try{ localStorage.setItem("ali_reviews", JSON.stringify({ t: Date.now(), rating: place.rating, count: place.userRatingCount, reviews })); }catch(e){}
  }catch(e){ /* sin clave o sin cuota: se queda la nota fija y los botones */ }
}
if(GOOGLE_API_KEY){
  window.initReviews = loadReviews;
  const sc = document.createElement("script");
  sc.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GOOGLE_API_KEY) + "&loading=async&v=weekly&callback=initReviews";
  sc.async = true;
  document.head.appendChild(sc);
}
watchRise();
