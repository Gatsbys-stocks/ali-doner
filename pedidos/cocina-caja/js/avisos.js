/* ===================== AVISOS DE LAS TABLETS DE MESA =====================
   La app de mesa (clientes) escribe en  alidoner/sessions/sala/inbox :
   pedidos nuevos, "llamar al camarero" y "pedir la cuenta".
   Aquí salen como tarjetas abajo a la izquierda, con sonido, hasta que alguien pulsa "Visto".
   Los platos del pedido ya están metidos en la comanda de la mesa, así que Cocina los ve directamente. */
let inboxRef = null, inboxStart = 0, audioCtx = null;
// En Cocina, "Visto" solo lo quita de esta pantalla; en Comanda/Caja lo quita para todos.
const localSeen = new Set();
const inboxItems = {};
document.addEventListener("pointerdown", ()=>{
  try{ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === "suspended") audioCtx.resume(); }catch(e){}
}, { capture:true });
function inboxBeep(type){
  if(!audioCtx) return;
  const notes = type === "order" ? [880, 1175, 1568] : (type === "bill" ? [660, 523] : [988, 988]);
  notes.forEach((f, i)=>{
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + i * 0.18;
    o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    o.start(t0); o.stop(t0 + 0.18);
  });
}
function inboxAgo(ts){
  if(!ts) return "";
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? "ahora" : "hace " + m + " min";
}
function renderInbox(){
  const box = document.getElementById("inbox"); if(!box) return;
  const keys = Object.keys(inboxItems).sort((a, b)=> (inboxItems[a].ts || 0) - (inboxItems[b].ts || 0));
  const canOpen = appRole === "comanda" || appRole === "caja";
  const kitchen = !canOpen;
  box.innerHTML = keys.filter(k=> !localSeen.has(k) && (!kitchen || inboxItems[k].type === "order")).map(k=>{
    const it = inboxItems[k];
    const head = it.type === "order" ? "Nuevo pedido" : (it.type === "bill" ? "Pide la cuenta" : "Llama al camarero");
    const icon = it.type === "order" ? "🧾" : (it.type === "bill" ? "💶" : "🙋");
    const lines = it.type === "order" && Array.isArray(it.lines)
      ? `<ul>${it.lines.map(l=>`<li><b>${l.qty}×</b> ${escapeHtml(l.name || "")}${l.note ? `<em>📝 ${escapeHtml(l.note)}</em>` : ""}</li>`).join("")}</ul><div class="tot"><span>Total</span><span>${eur(it.total || 0)}</span></div>`
      : "";
    return `<div class="ib ${it.type}" data-k="${k}">
      <div class="ib-h">${icon} <span class="mesa">MESA ${escapeHtml(String(it.table))}</span> ${head}<small>${inboxAgo(it.ts)}</small></div>
      ${lines}
      <div class="ib-a">${canOpen ? `<button type="button" data-open="${escapeHtml(String(it.table))}">Abrir mesa</button>` : ""}<button type="button" class="ok" data-seen="${k}">✓ Visto</button></div>
    </div>`;
  }).join("");
}
document.addEventListener("click", e=>{
  const seen = e.target.closest("[data-seen]");
  if(seen){
    const k = seen.dataset.seen;
    if(appRole !== "comanda" && appRole !== "caja"){ localSeen.add(k); renderInbox(); return; }
    delete inboxItems[k]; renderInbox();
    if(firebaseReady && currentSession && db) db.ref(DB_ROOT + "sessions/" + currentSession + "/inbox/" + k).remove();
    return;
  }
  const op = e.target.closest("[data-open]");
  if(op && op.closest("#inbox")){ const n = parseInt(op.dataset.open, 10); if(n) openTable(n); }
});
function attachInbox(code){
  detachInbox();
  if(!db) return;
  inboxStart = Date.now();
  inboxRef = db.ref(DB_ROOT + "sessions/" + code + "/inbox");
  inboxRef.on("child_added", snap=>{
    const v = snap.val() || {};
    inboxItems[snap.key] = v;
    renderInbox();
    const forMe = appRole === "comanda" || appRole === "caja" || v.type === "order";
    if(forMe && (!v.ts || v.ts > inboxStart - 5000)){
      inboxBeep(v.type);
      try{ if(navigator.vibrate) navigator.vibrate(200); }catch(e){}
    }
  });
  inboxRef.on("child_removed", snap=>{ delete inboxItems[snap.key]; renderInbox(); });
}
function detachInbox(){
  if(inboxRef) inboxRef.off();
  inboxRef = null;
  Object.keys(inboxItems).forEach(k=> delete inboxItems[k]);
  renderInbox();
}
setInterval(renderInbox, 60000);
