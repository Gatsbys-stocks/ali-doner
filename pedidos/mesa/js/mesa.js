/* Lógica de la tablet de mesa · Ali Doner Kebab (no hace falta tocar nada aquí) */
/* ===================== ESTADO ===================== */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : v; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
};
let lang = 0;                                   // índice en LANGS
let table = parseInt(store.get("ali_mesa_table", "1"), 10) || 1;
let cart = [];                                  // { key, id, opt, qty, note }
let ordered = {};                               // lo que ya hay en la comanda de esta mesa
let db = null, online = false, demo = false;
const L = () => LANGS[lang].code;
const tr = arr => (arr && (arr[lang] || arr[0])) || "";
const t = k => tr(UI[k]);
const eur = n => n.toFixed(2).replace(".", ",") + " €";
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const ITEMS = {}; MENU.forEach(s => s.items.forEach(it => { ITEMS[it.id] = it; }));
const VB = { durum:"0 0 220 460", box:"0 0 200 230" };
const icon = (k, cls) => `<svg ${cls ? `class="${cls}"` : ""} viewBox="${VB[k] || "0 0 100 100"}" aria-hidden="true"><use href="#${k}"/></svg>`;
const desc = it => (it.d || []).map(k => tr(ING[k])).join(" · ");
const optName = (it, i) => (it.o && i != null) ? tr(OPT[it.o][i]) : "";
const lineId = (id, i) => i == null ? id : id + "-ex" + i;   // mismo formato que Cocina y Caja

/* ===================== FIREBASE ===================== */
function connect(){
  if(typeof firebase === "undefined"){ demo = true; document.getElementById("demo-chip").hidden = false; return; }
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    firebase.auth().signInAnonymously().then(() => {
      db = firebase.database(); online = true; listenTable();
    }).catch(() => { online = false; });
  }catch(e){ online = false; }
}
let tableRef = null;
function listenTable(){
  if(!db) return;
  if(tableRef) tableRef.off();
  tableRef = db.ref(DB_ROOT + "sessions/" + SESSION + "/orders/" + table);
  tableRef.on("value", snap => { ordered = snap.val() || {}; renderTicket(); });
}
const ref = p => db.ref(DB_ROOT + "sessions/" + SESSION + "/" + p);

async function sendOrder(){
  const lines = cart.map(c => {
    const it = ITEMS[c.id];
    return { id: lineId(c.id, c.opt), qty: c.qty, note: c.note || "",
      name: it.n[0] + (c.opt != null ? " · " + OPT[it.o][c.opt][0] : ""), price: it.p };
  });
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  if(demo || !online){
    if(!demo) throw new Error("offline");
    lines.forEach(l => { ordered[l.id] = (ordered[l.id] || 0) + l.qty; });
    return;
  }
  const base = "orders/" + table + "/";
  await Promise.all(lines.map(l => ref(base + l.id).transaction(q => (q || 0) + l.qty)));
  await Promise.all(lines.map(l => ref(base + "_done/" + l.id).remove()));
  await Promise.all(lines.filter(l => l.note).map(l =>
    ref(base + "_notes/" + l.id).transaction(old => old ? old + " · " + l.note : l.note)));
  await ref("inbox").push({ type:"order", table, ts: firebase.database.ServerValue.TIMESTAMP, total,
    lang: L(), lines: lines.map(l => ({ name:l.name, qty:l.qty, note:l.note })) });
}
async function sendCall(type){
  if(demo) return;
  if(!online) throw new Error("offline");
  await ref("inbox").push({ type, table, ts: firebase.database.ServerValue.TIMESTAMP, lang: L() });
}

/* ===================== IDIOMA ===================== */
function setLang(i){
  lang = i;
  const l = LANGS[i];
  document.documentElement.lang = l.code;
  document.documentElement.dir = l.rtl ? "rtl" : "ltr";
  document.getElementById("lang-label").textContent = l.code.toUpperCase();
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  renderRail(); renderList(); renderTicket();
}

/* ===================== CARTA ===================== */
function renderRail(){
  document.getElementById("rail").innerHTML = MENU.map((s, i) =>
    `<button class="cat-btn" type="button" data-cat="${i}" aria-current="${i === 0}">${icon(s.icon)}<span>${esc(tr(CATS[s.cat]))}</span></button>`).join("");
}
function countIn(id){ return cart.filter(c => c.id === id).reduce((s, c) => s + c.qty, 0); }
function renderList(){
  const list = document.getElementById("list");
  list.innerHTML = MENU.map((s, si) => `
    <section class="sec" id="sec-${si}" data-sec="${si}">
      <div class="sec-h">${icon(s.icon)}<h2>${esc(tr(CATS[s.cat]))}</h2></div>
      <div class="grid">${s.items.map(it => {
        const n = countIn(it.id);
        return `<button class="card${it.t ? " has-tag" : ""}" type="button" data-id="${it.id}">
          ${it.t ? `<span class="tag ${it.t}">${esc(tr(TAGS[it.t]))}</span>` : ""}
          ${n ? `<span class="cnt">${n}</span>` : ""}
          <span class="nm">${esc(tr(it.n))}</span>
          <span class="ds">${esc(desc(it))}</span>
          <span class="ft"><span class="pr">${eur(it.p)}</span><span class="plus" aria-hidden="true">+</span></span>
        </button>`; }).join("")}</div>
    </section>`).join("") + `<p class="foot-note">${esc(t("prices"))}</p>`;
}
document.getElementById("rail").addEventListener("click", e => {
  const b = e.target.closest(".cat-btn"); if(!b) return;
  const sec = document.getElementById("sec-" + b.dataset.cat);
  document.getElementById("list").scrollTo({ top: sec.offsetTop - 10, behavior: "smooth" });
  markCat(b.dataset.cat);
});
function markCat(i){
  document.querySelectorAll(".cat-btn").forEach(b => {
    const on = b.dataset.cat === String(i);
    b.setAttribute("aria-current", on);
    if(on) b.scrollIntoView({ block:"nearest", inline:"nearest" });
  });
}
document.getElementById("list").addEventListener("scroll", () => {
  const list = document.getElementById("list"); let cur = 0;
  document.querySelectorAll(".sec").forEach(s => { if(s.offsetTop - list.scrollTop < 80) cur = s.dataset.sec; });
  markCat(cur);
}, { passive:true });
document.getElementById("list").addEventListener("click", e => {
  const c = e.target.closest(".card"); if(c) openItem(c.dataset.id);
});

/* ===================== FICHA DEL PLATO ===================== */
function openItem(id){
  const it = ITEMS[id];
  let opt = it.o ? 0 : null, qty = 1, notes = new Set(), free = "";
  const modal = document.getElementById("modal");
  function draw(){
    modal.innerHTML = `
      <h2>${esc(tr(it.n))}</h2>
      <div class="md">${esc(desc(it))}</div>
      <span class="mp">${eur(it.p)}</span>
      ${it.o ? `<div class="lbl">${esc(tr(OPT_TITLE[it.o]))}</div>
        <div class="opts">${OPT[it.o].map((o, i) => `<button class="opt" type="button" data-opt="${i}" aria-pressed="${i === opt}">${esc(tr(o))}</button>`).join("")}</div>` : ""}
      <div class="lbl">${esc(t("qty"))}</div>
      <div class="qrow"><div class="step"><button type="button" data-q="-1">−</button><span>${qty}</span><button type="button" data-q="1">+</button></div></div>
      <div class="lbl">${esc(t("note"))}</div>
      ${it.noteHint ? `<p class="md" style="margin:0 0 8px">${esc(t("offerHint"))}</p>` : ""}
      <div class="opts">${QUICK_NOTES.map((q, i) => `<button class="opt sm" type="button" data-n="${i}" aria-pressed="${notes.has(i)}">${esc(tr(q))}</button>`).join("")}</div>
      <textarea id="free" placeholder="${esc(t("notePh"))}" style="margin-top:10px">${esc(free)}</textarea>
      <div class="m-actions">
        <button class="ghost" type="button" data-close>✕</button>
        <button class="big red" type="button" data-addit>${esc(t("add"))} · ${eur(it.p * qty)}</button>
      </div>`;
  }
  draw();
  modal.onclick = e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.dataset.opt != null){ opt = +b.dataset.opt; draw(); }
    else if(b.dataset.q){ free = modal.querySelector("#free").value; qty = Math.max(1, Math.min(20, qty + +b.dataset.q)); draw(); }
    else if(b.dataset.n != null){ free = modal.querySelector("#free").value; const n = +b.dataset.n; notes.has(n) ? notes.delete(n) : notes.add(n); draw(); }
    else if(b.hasAttribute("data-close")) closeLayer();
    else if(b.hasAttribute("data-addit")){
      free = modal.querySelector("#free").value.trim();
      const note = [...[...notes].sort().map(i => QUICK_NOTES[i][0]), free].filter(Boolean).join(", ");
      addToCart(id, opt, qty, note);
      closeLayer();
    }
  };
  openLayer();
}
function addToCart(id, opt, qty, note){
  const key = id + "|" + opt + "|" + note;
  const ex = cart.find(c => c.key === key);
  if(ex) ex.qty += qty; else cart.push({ key, id, opt, qty, note });
  renderList(); renderTicket();
  toast("✓ " + tr(ITEMS[id].n) + (opt != null ? " · " + optName(ITEMS[id], opt) : ""));
}

/* ===================== TICKET ===================== */
function orderedLines(){
  const out = [];
  Object.keys(ordered || {}).forEach(k => {
    if(k.charAt(0) === "_") return;
    const m = k.match(/^(.*?)(?:-ex(\d+))?$/); const it = ITEMS[m[1]]; if(!it) return;
    const qty = ordered[k]; if(!qty) return;
    out.push({ name: tr(it.n) + (m[2] != null ? " · " + optName(it, +m[2]) : ""), qty, total: qty * it.p });
  });
  return out;
}
function renderTicket(){
  const body = document.getElementById("t-body");
  const total = cart.reduce((s, c) => s + c.qty * ITEMS[c.id].p, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const prev = orderedLines();
  body.innerHTML = (cart.length ? cart.map((c, i) => {
    const it = ITEMS[c.id];
    return `<div class="line">
      <div><div class="ln">${esc(tr(it.n))}</div>${c.opt != null ? `<div class="lo">${esc(optName(it, c.opt))}</div>` : ""}${c.note ? `<div class="lo">“${esc(c.note)}”</div>` : ""}</div>
      <div class="lp">${eur(c.qty * it.p)}</div>
      <div class="ctl"><div class="step"><button type="button" data-cq="${i}" data-d="-1">−</button><span>${c.qty}</span><button type="button" data-cq="${i}" data-d="1">+</button></div>
      <button class="rm" type="button" data-rm="${i}">${esc(t("remove"))}</button></div>
    </div>`; }).join("")
    : `<div class="t-empty"><img src="img/hands.webp" alt="">${esc(t("empty"))}</div>`)
    + (prev.length ? `<div class="ordered"><h3>${esc(t("ordered"))}</h3>${prev.map(o => `<div class="o"><span><b>${o.qty}×</b> ${esc(o.name)}</span><span>${eur(o.total)}</span></div>`).join("")}</div>` : "");
  document.getElementById("t-total").textContent = eur(total);
  document.getElementById("btn-send").disabled = !cart.length;
  const sb = document.getElementById("sheet-btn");
  sb.hidden = !cart.length;
  document.getElementById("sheet-count").textContent = count;
  document.getElementById("sheet-total").textContent = eur(total);
}
document.getElementById("t-body").addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  if(b.dataset.cq != null){ const c = cart[+b.dataset.cq]; c.qty += +b.dataset.d; if(c.qty <= 0) cart.splice(+b.dataset.cq, 1); }
  else if(b.dataset.rm != null) cart.splice(+b.dataset.rm, 1);
  else return;
  renderList(); renderTicket();
  if(!cart.length) closeSheet();
});
document.getElementById("btn-send").addEventListener("click", () => {
  const modal = document.getElementById("modal");
  const total = cart.reduce((s, c) => s + c.qty * ITEMS[c.id].p, 0);
  modal.innerHTML = `<h2>${esc(t("confirmTitle"))}</h2>
    <div class="conf-list">${cart.map(c => { const it = ITEMS[c.id]; return `<div><span><b>${c.qty}×</b> ${esc(tr(it.n))}${c.opt != null ? ` <small>${esc(optName(it, c.opt))}</small>` : ""}${c.note ? `<small>“${esc(c.note)}”</small>` : ""}</span><span>${eur(c.qty * it.p)}</span></div>`; }).join("")}</div>
    <div class="t-tot"><span>${esc(t("total"))}</span><b>${eur(total)}</b></div>
    <div class="m-actions"><button class="ghost" type="button" data-close>${esc(t("keepOrdering"))}</button><button class="big" type="button" data-go>${esc(t("confirmYes"))}</button></div>`;
  modal.onclick = async e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.hasAttribute("data-close")) return closeLayer();
    if(b.hasAttribute("data-go")){
      b.disabled = true; b.textContent = "…";
      try{ await sendOrder(); cart = []; renderList(); renderTicket(); closeSheet(); showSent(); }
      catch(err){ closeLayer(); toast(t("error")); }
    }
  };
  openLayer();
});
function showSent(){
  const modal = document.getElementById("modal");
  modal.innerHTML = `<div class="done"><div class="ck"><svg viewBox="0 0 64 64" fill="none" stroke="#06210f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 33l11 11 22-24"/></svg></div>
    <h2>${esc(t("sentTitle"))}</h2><p>${esc(t("sentSub"))}</p>${demo ? `<p style="font-size:14px;color:var(--saffron)">${esc(t("demo"))}</p>` : ""}
    <button class="big" type="button" data-close style="margin-top:12px">${esc(t("ok"))}</button></div>`;
  modal.onclick = e => { if(e.target.closest("[data-close]")) closeLayer(); };
  openLayer();
  clearTimeout(showSent.tm); showSent.tm = setTimeout(closeLayer, 9000);
}

/* ===================== CAMARERO / CUENTA ===================== */
const lastCall = {};
async function call(type){
  const now = Date.now();
  if(lastCall[type] && now - lastCall[type] < 60000){ toast(t("wait")); return; }
  try{ await sendCall(type); lastCall[type] = now; toast(type === "waiter" ? t("waiterSent") : t("billSent")); }
  catch(e){ toast(t("error")); }
}
document.getElementById("btn-waiter").addEventListener("click", () => call("waiter"));
document.getElementById("btn-bill").addEventListener("click", () => call("bill"));

/* ===================== CAPAS / HOJA ===================== */
function openLayer(){ document.getElementById("layer").hidden = false; }
function closeLayer(){ document.getElementById("layer").hidden = true; document.getElementById("modal").onclick = null; }
document.getElementById("layer").addEventListener("click", e => { if(e.target.id === "layer") closeLayer(); });
const ticketEl = document.getElementById("ticket");
function openSheet(){ ticketEl.classList.add("open"); document.getElementById("close-sheet").hidden = false; }
function closeSheet(){ ticketEl.classList.remove("open"); document.getElementById("close-sheet").hidden = true; }
document.getElementById("sheet-btn").addEventListener("click", openSheet);
document.getElementById("close-sheet").addEventListener("click", closeSheet);
let toastTm;
function toast(msg){ const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTm); toastTm = setTimeout(() => el.classList.remove("show"), 2600); }

/* ===================== BIENVENIDA ===================== */
let helloTm, helloI = 0;
function showWelcome(){
  document.getElementById("w-table").textContent = tr(UI.table) + " " + table;
  document.getElementById("w-langs").innerHTML = LANGS.map((l, i) => `<button type="button" data-l="${i}" lang="${l.code}">${esc(l.label)}</button>`).join("");
  document.getElementById("welcome").hidden = false;
  clearInterval(helloTm);
  const cycle = () => {
    const i = helloI++ % LANGS.length;
    document.getElementById("hello").innerHTML = `<span dir="${LANGS[i].rtl ? "rtl" : "ltr"}">${esc(UI.welcome[i])}</span>`;
    document.getElementById("w-sub").textContent = UI.welcomeSub[i];
    document.getElementById("w-choose").textContent = UI.chooseLang[i];
  };
  cycle(); helloTm = setInterval(cycle, 2600);
}
document.getElementById("w-langs").addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  clearInterval(helloTm); setLang(+b.dataset.l);
  document.getElementById("welcome").hidden = true;
  document.getElementById("list").scrollTop = 0;
});
document.getElementById("btn-lang").addEventListener("click", showWelcome);

let idleTm;
function bump(){
  clearTimeout(idleTm);
  idleTm = setTimeout(() => {
    if(!cart.length && document.getElementById("layer").hidden){ closeSheet(); showWelcome(); }
    else bump();
  }, IDLE_MS);
}
["pointerdown","keydown","scroll"].forEach(ev => document.addEventListener(ev, bump, { passive:true, capture:true }));

/* ===================== AJUSTES (número de mesa) ===================== */
let taps = 0, tapTm;
document.getElementById("btn-table").addEventListener("click", () => {
  taps++; clearTimeout(tapTm); tapTm = setTimeout(() => { taps = 0; }, 2500);
  if(taps >= 5){ taps = 0; openAdmin(); }
});
function openAdmin(){
  let pin = "";
  const modal = document.getElementById("modal");
  const drawPin = () => {
    modal.innerHTML = `<h2>PIN</h2><div class="pin-dots">${[0,1,2,3].map(i => `<i class="${i < pin.length ? "on" : ""}"></i>`).join("")}</div>
      <div class="pin">${[1,2,3,4,5,6,7,8,9,"✕",0,"⌫"].map(k => `<button type="button" data-k="${k}">${k}</button>`).join("")}</div>`;
  };
  const drawTables = () => {
    modal.innerHTML = `<h2>${esc(t("table"))}</h2><div class="tables">${Array.from({ length: NUM_TABLES }, (_, i) => i + 1).map(n => `<button type="button" data-tb="${n}" aria-pressed="${n === table}">${n}</button>`).join("")}</div>
      <div class="m-actions"><button class="ghost" type="button" data-fs>⛶</button><button class="big" type="button" data-close>${esc(t("ok"))}</button></div>`;
  };
  drawPin();
  modal.onclick = e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.dataset.k != null){
      const k = b.dataset.k;
      if(k === "✕") return closeLayer();
      pin = k === "⌫" ? pin.slice(0, -1) : (pin + k).slice(0, 4);
      if(pin.length === 4){ if(pin === ADMIN_PIN) return drawTables(); pin = ""; toast("PIN ✕"); }
      drawPin();
    } else if(b.dataset.tb){
      table = +b.dataset.tb; store.set("ali_mesa_table", String(table));
      document.getElementById("table-num").textContent = table; ordered = {}; listenTable(); renderTicket(); drawTables();
    } else if(b.hasAttribute("data-fs")){
      const d = document.documentElement; (d.requestFullscreen ? d.requestFullscreen() : Promise.reject()).catch(() => {});
    } else if(b.hasAttribute("data-close")) closeLayer();
  };
  openLayer();
}

/* ===================== ARRANQUE ===================== */
document.getElementById("table-num").textContent = table;
setLang(0);
connect();
showWelcome();
bump();
