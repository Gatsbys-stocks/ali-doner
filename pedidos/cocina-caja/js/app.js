/* Lógica principal de Cocina y Caja · Ali Doner Kebab */
let firebaseReady = false;
let db = null;

// Sin contraseñas: todos los dispositivos entran directamente en la misma sala.
const DEFAULT_SESSION = "sala";
let currentSession = null;
let ordersRef = null;
let historyRef = null;
let parkedRef = null;

function buildMenu(lang){
  return MENU_SRC.map(function(sec, si){
    return {
      cat: sec.cat[lang], group: sec.group[lang], groupKey: sec.group.es,
      items: sec.items.map(function(it, ii){
        return { id: si+'-'+ii, name: it[lang][0], desc: it[lang][1], price: it.price,
          mixers: it.mixers ? it.mixers[lang] : null,
          extras: it.extras ? it.extras[lang] : null };
      })
    };
  });
}
function buildFlat(menu){
  const flat = [];
  menu.forEach(function(section){
    section.items.forEach(function(it){
      flat.push({ id: it.id, cat: section.cat, group: section.group, groupKey: section.groupKey, name: it.name, desc: it.desc, price: it.price, mixers: it.mixers || null, extras: it.extras || null });
    });
  });
  return flat;
}
// Identifica a qué puesto (Cocina / Pizza / Postres) pertenece un artículo, para la vista de cocina.
function kitchenGroupOf(item){
  // Un solo puesto: Cocina prepara todo (comida y bebidas).
  return item ? "Cocina" : null;
}
/* Devuelve (o crea) la línea de carta correspondiente a un artículo con una opción elegida
   (refresco de un combinado, o "con hielo / con limón / sin nada" de un refresco).
   Se guarda en FLAT con un id derivado, para que quede registrada igual que cualquier otro plato.
   suffix distingue el tipo de opción: 'mx' = mixer (refresco de combinado), 'ex' = extra (hielo/limón/nada). */
function getOptionVariant(baseItem, optionList, optionIndex, suffix){
  const idx = optionIndex || 0;
  const variantId = baseItem.id + '-' + suffix + idx;
  let existing = FLAT.find(f => f.id === variantId);
  if(existing) return existing;
  const optionName = optionList ? optionList[idx] : null;
  const variant = {
    id: variantId,
    cat: baseItem.cat,
    group: baseItem.group,
    groupKey: baseItem.groupKey,
    name: optionName ? baseItem.name + ' · ' + optionName : baseItem.name,
    desc: baseItem.desc,
    price: baseItem.price,
    mixers: null,
    extras: null
  };
  FLAT.push(variant);
  return variant;
}
function getMixerVariant(baseItem, mixerIndex){
  return getOptionVariant(baseItem, baseItem.mixers, mixerIndex, 'mx');
}

function getOrderNote(tableId, itemId){
  const order = orders[tableId] || {};
  const notes = order._notes || {};
  return notes[itemId] || "";
}

function writeOrderNote(tableId, itemId, note){
  const clean = String(note || "").trim();
  if(firebaseReady && currentSession){
    const path = DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId + "/_notes/" + itemId;
    if(clean) db.ref(path).set(clean);
    else db.ref(path).remove();
  } else {
    orders[tableId] = orders[tableId] || {};
    orders[tableId]._notes = orders[tableId]._notes || {};
    if(clean) orders[tableId]._notes[itemId] = clean;
    else delete orders[tableId]._notes[itemId];
    refreshAfterOrdersChange();
  }
}

// Estado de preparación de un artículo (tick de Cocina / Pizza).
function getItemDone(tableId, itemId){
  const order = orders[tableId] || {};
  const done = order._done || {};
  return !!done[itemId];
}
function writeItemDone(tableId, itemId, done){
  if(firebaseReady && currentSession){
    const path = DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId + "/_done/" + itemId;
    if(done) db.ref(path).set(true);
    else db.ref(path).remove();
  } else {
    orders[tableId] = orders[tableId] || {};
    orders[tableId]._done = orders[tableId]._done || {};
    if(done) orders[tableId]._done[itemId] = true;
    else delete orders[tableId]._done[itemId];
    refreshAfterOrdersChange();
  }
}

// Personas asignadas a una mesa (se pide al abrir una mesa vacía desde Comanda).
function getTablePeople(tableId){
  const o = orders[tableId] || {};
  return o._people || null;
}
function writeTablePeople(tableId, n){
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId + "/_people").set(n);
  } else {
    orders[tableId] = orders[tableId] || {};
    orders[tableId]._people = n;
    refreshAfterOrdersChange();
  }
}

function openNoteEditor(itemId, itemName, onDone){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  const current = getOrderNote(currentTable, itemId);
  overlay.innerHTML = `
    <div class="note-box">
      <h3>${I18N[currentLang].note}: ${itemName}</h3>
      <p>${I18N[currentLang].noNote}</p>
      <textarea class="note-input" maxlength="180" placeholder="${I18N[currentLang].notePlaceholder}">${current.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</textarea>
      <div class="note-actions">
        <button class="note-cancel">${I18N[currentLang].cancel}</button>
        <button class="note-save">${I18N[currentLang].noteSave}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const input = overlay.querySelector(".note-input");
  setTimeout(()=>{ input.focus(); input.setSelectionRange(input.value.length,input.value.length); },50);

  const close = ()=>overlay.remove();
  const save = ()=>{
    writeOrderNote(currentTable, itemId, input.value);
    close();
    if(onDone) onDone();
  };
  overlay.addEventListener("click", e=>{ if(e.target===overlay) close(); });
  overlay.querySelector(".note-cancel").addEventListener("click", close);
  overlay.querySelector(".note-save").addEventListener("click", save);
  input.addEventListener("keydown", e=>{
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){ e.preventDefault(); save(); }
  });
}
function getExtraVariant(baseItem, extraIndex){
  return getOptionVariant(baseItem, baseItem.extras, extraIndex, 'ex');
}
/* Tras reconstruir FLAT (cambio de idioma, sincronización...) hay que volver a crear
   en FLAT las líneas de combinados+refresco / refrescos+hielo-limón que ya estén en
   alguna comanda, si no, el ticket no encontraría el artículo. */
function regenerateMixerVariants(){
  const seen = new Set();
  Object.keys(orders).forEach(function(tableId){
    Object.keys(orders[tableId] || {}).forEach(function(id){
      if(seen.has(id)) return;
      let m = id.match(/^(.*)-mx(\d+)$/);
      if(m){
        seen.add(id);
        const baseItem = FLAT.find(f => f.id === m[1]);
        if(baseItem && baseItem.mixers) getMixerVariant(baseItem, parseInt(m[2], 10));
        return;
      }
      m = id.match(/^(.*)-ex(\d+)$/);
      if(m){
        seen.add(id);
        const baseItem = FLAT.find(f => f.id === m[1]);
        if(baseItem && baseItem.extras) getExtraVariant(baseItem, parseInt(m[2], 10));
      }
    });
  });
}

/* ===================== TEXTOS DE INTERFAZ (ES / CA / EN) ===================== */
const I18N = {
  es: {
    tagline: "Comanda de sala",
    eyebrow: "Plano de sala",
    heading: "Toca una mesa para abrir la comanda",
    legendFree: "Libre", legendBusy: "Con pedido", legendBarra: "Barra",
    keyFree: "Libre", keyBusy: "Ocupada",
    btnSaldo: "Saldo sala", btnHistorial: "📖 Historial", btnSalon: "🎨 Diseño",
    themeNames: ["🎨 Diseño: Ali Doner", "🎨 Diseño: Noche", "🎨 Diseño: Verde Pakistán", "🎨 Diseño: Azafrán"],
    btnTickets: "Tickets aparcados", btnJuntar: "Juntar mesas",
    back: "← Mesas",
    comanda: "Comanda", comandaBarra: "Pedido para llevar",
    searchPh: "Buscar plato, ingrediente…",
    pay: "✓ Pagado", clear: "Vaciar mesa",
    resultsHeading: "Resultados",
    resultsSub: (n,q)=> n + " plato(s) encontrados para “" + q + "”",
    catSub: (n)=> n + " elementos",
    noResults: "Sin resultados. Prueba con otro término.",
    add: "Añadir",
    mixerWith: "Con ",
     note: "Nota", notePlaceholder: "Escribe una nota…", noteSave: "Guardar nota", noNote: "Sin nota",
    ticketMark: "ALI DONER · COMANDA",
    ticketEmpty: "Aún no hay artículos<br>en esta mesa",
    total: "Total",
    itemsCount: (n)=> n + (n===1 ? " artículo" : " artículos"),
    confirmClear: (label)=> "¿Vaciar todo el pedido de " + label.toLowerCase() + "?",
    clearOk: "Vaciar todo",
    cancel: "Cancelar",
    confirmPay: (label,total)=> "¿Marcar " + label.toLowerCase() + " como pagada por " + total + "? La mesa quedará libre.",
    payOk: "Confirmar pago",
    toastTableEmptyAlready: "Esta mesa ya está vacía.",
    toastCleared: "Pedido vaciado.",
    toastNoOrderToPay: "Esta mesa no tiene pedido para cobrar.",
    toastPaid: (label,total)=> label + " pagada · " + total,
    toastSaldo: (n,total)=> "Saldo de sala: " + total + " en " + n + " mesa(s)/barra(s) con pedido.",
    toastNoSaldo: "No hay pedidos abiertos en sala.",
    toastTickets: "Tickets aparcados: función no incluida en esta demo.",
    toastJuntar: "Juntar mesas: función no incluida en esta demo.",
    pedidosTitle: "🛵 Pedidos", pedidosSub: "Para llevar / domicilio", fsEnter: "Pantalla completa", fsExit: "Salir de pantalla completa", roleCaja: "Caja", roleCocina: "Cocina", rolePizza: "Pizza", rolePostre: "Postre", roleComanda: "Comanda",
    kitchenTagline: "Pedidos pendientes",
    kitchenEmpty: "No hay platos pendientes.",
    kitchenTick: "Marcar como hecho",
    kitchenPending: (n)=> n + (n===1 ? " pendiente" : " pendientes"),
    kitchenAllDone: "Todo hecho ✓",
    variableBtn: "Variable",
    variableNamePrompt: "Escribe el nombre del artículo.",
    variableNamePlaceholder: "Ej. Ración especial, Menú del día…",
    next: "Siguiente",
    parkBtn: "📦 Aparcar",
    toastNoOrderToPark: "Esta mesa no tiene pedido para aparcar.",
    parkPrompt: "Ponle un nombre a este tiquet (ej. Terraza, Para llevar…).",
    parkPlaceholder: "Nombre del tiquet",
    parkOk: "Aparcar",
    toastParked: "Tiquet aparcado.",
    parkedTitle: "Tickets aparcados",
    parkedEmpty: "No hay tickets aparcados.",
    parkedResume: "Recuperar",
    parkedDelete: "Eliminar",
    confirmDeleteParked: "¿Eliminar este tiquet aparcado? No se puede deshacer.",
    deleteOk: "Eliminar",
    toastParkedDeleted: "Tiquet eliminado.",
    pickResumeTarget: "Elige la mesa donde quieres recuperar este tiquet.",
    toastResumed: (label)=> "Tiquet recuperado en " + label + ".",
    pickSourceMerge: "Elige la mesa de ORIGEN (se vaciará).",
    pickDestMerge: "Elige la mesa de DESTINO (se juntará aquí).",
    confirmMerge: (a,b)=> "¿Juntar todo el pedido de " + a.toLowerCase() + " con " + b.toLowerCase() + "? " + a + " quedará libre.",
    mergeOk: "Juntar",
    toastMerged: (a,b)=> a + " juntada con " + b + ".",
    toastMergeEmptySource: "Esa mesa está vacía, no hay nada que juntar.",
    toastMergeSame: "Elige dos mesas distintas.",
    historyTitle: "Historial de pagos",
    historyCount: (n)=> n + " pago(s) registrados",
    historyEmpty: "Todavía no hay pagos registrados.<br>Cuando marques una mesa como pagada, aparecerá aquí.",
    mesaLabel: "Mesa", barraLabel: "Pedido",
    viewOrder: "Ver comanda",
    btnCerrarDia: "🔒 Cerrar día",
    confirmCloseDay: "¿Cerrar el día? Se vaciarán todas las mesas y la barra, y se borrará todo el historial de pagos de hoy. Esta acción no se puede deshacer.",
    closeDayOk: "Cerrar día",
    toastDayClosed: "Día cerrado. Todo reseteado.",
    syncOn: "Sincronizado", syncOff: "Modo local (sin sincronizar)",
    loginSub: "Introduce el código de tu sesión.",
    sessionSubmit: "Entrar",
    loginError: "Código incorrecto.",
    sessionChipLabel: "Sesión", changeLabel: "Cambiar",
  },
  ur: {
    tagline: "ہال آرڈر",
    eyebrow: "ہال کا نقشہ",
    heading: "آرڈر کھولنے کے لیے میز پر ٹیپ کریں",
    legendFree: "خالی", legendBusy: "آرڈر والی", legendBarra: "بار",
    keyFree: "خالی", keyBusy: "مصروف",
    btnSaldo: "ہال کا حساب", btnHistorial: "📖 ہسٹری", btnSalon: "🎨 ڈیزائن",
    themeNames: ["🎨 ڈیزائن: من و سلویٰ", "🎨 ڈیزائن: رات", "🎨 ڈیزائن: سبز پاکستان", "🎨 ڈیزائن: زعفران"],
    btnTickets: "رکھے ہوئے ٹکٹ", btnJuntar: "میزیں ملائیں",
    back: "→ میزیں",
    comanda: "آرڈر", comandaBarra: "ٹیک اوے آرڈر",
    searchPh: "کھانا تلاش کریں…",
    pay: "✓ ادا ہو گیا", clear: "میز خالی کریں",
    resultsHeading: "نتائج",
    resultsSub: (n,q)=> "“" + q + "” کے لیے " + n + " کھانے ملے",
    catSub: (n)=> n + " آئٹم",
    noResults: "کچھ نہیں ملا۔ کوئی اور لفظ آزمائیں۔",
    add: "شامل کریں",
    mixerWith: "کے ساتھ ",
    note: "نوٹ", notePlaceholder: "نوٹ لکھیں…", noteSave: "نوٹ محفوظ کریں", noNote: "کوئی نوٹ نہیں",
    ticketMark: "من و سلویٰ · آرڈر",
    ticketEmpty: "اس میز پر ابھی<br>کوئی آئٹم نہیں",
    total: "کل",
    itemsCount: (n)=> n + " آئٹم",
    confirmClear: (label)=> label + " کا پورا آرڈر خالی کریں؟",
    clearOk: "سب خالی کریں",
    cancel: "منسوخ",
    confirmPay: (label,total)=> label + " کو " + total + " میں ادا شدہ کریں؟ میز خالی ہو جائے گی۔",
    payOk: "ادائیگی کی تصدیق",
    toastTableEmptyAlready: "یہ میز پہلے سے خالی ہے۔",
    toastCleared: "آرڈر خالی کر دیا گیا۔",
    toastNoOrderToPay: "اس میز پر ادائیگی کے لیے کوئی آرڈر نہیں۔",
    toastPaid: (label,total)=> label + " ادا ہو گئی · " + total,
    toastSaldo: (n,total)=> "ہال کا حساب: " + n + " میزوں پر " + total,
    toastNoSaldo: "ہال میں کوئی کھلا آرڈر نہیں۔",
    toastTickets: "یہ فیچر شامل نہیں۔",
    toastJuntar: "یہ فیچر شامل نہیں۔",
    pedidosTitle: "🛵 آرڈرز", pedidosSub: "ٹیک اوے / ڈیلیوری", fsEnter: "فل اسکرین", fsExit: "فل اسکرین بند کریں", roleCaja: "کیش", roleCocina: "کچن", rolePizza: "کچن", rolePostre: "کچن", roleComanda: "آرڈر",
    kitchenTagline: "باقی آرڈر",
    kitchenEmpty: "کوئی کھانا باقی نہیں۔",
    kitchenTick: "تیار ہو گیا",
    kitchenPending: (n)=> n + " باقی",
    kitchenAllDone: "سب تیار ✓",
    variableBtn: "دیگر",
    variableNamePrompt: "آئٹم کا نام لکھیں۔",
    variableNamePlaceholder: "مثلاً اسپیشل پلیٹ…",
    next: "آگے",
    parkBtn: "📦 رکھیں",
    toastNoOrderToPark: "اس میز پر رکھنے کے لیے کوئی آرڈر نہیں۔",
    parkPrompt: "اس ٹکٹ کا نام رکھیں (مثلاً ٹیک اوے…)۔",
    parkPlaceholder: "ٹکٹ کا نام",
    parkOk: "رکھیں",
    toastParked: "ٹکٹ رکھ دیا گیا۔",
    parkedTitle: "رکھے ہوئے ٹکٹ",
    parkedEmpty: "کوئی رکھا ہوا ٹکٹ نہیں۔",
    parkedResume: "واپس لائیں",
    parkedDelete: "حذف کریں",
    confirmDeleteParked: "یہ ٹکٹ حذف کریں؟ یہ واپس نہیں ہو گا۔",
    deleteOk: "حذف کریں",
    toastParkedDeleted: "ٹکٹ حذف ہو گیا۔",
    pickResumeTarget: "وہ میز چنیں جہاں یہ ٹکٹ واپس لانا ہے۔",
    toastResumed: (label)=> "ٹکٹ " + label + " پر واپس آ گیا۔",
    pickSourceMerge: "پہلی میز چنیں (یہ خالی ہو جائے گی)۔",
    pickDestMerge: "دوسری میز چنیں (آرڈر یہاں ملے گا)۔",
    confirmMerge: (a,b)=> a + " کا آرڈر " + b + " کے ساتھ ملائیں؟ " + a + " خالی ہو جائے گی۔",
    mergeOk: "ملائیں",
    toastMerged: (a,b)=> a + " کو " + b + " سے ملا دیا گیا۔",
    toastMergeEmptySource: "یہ میز خالی ہے، ملانے کو کچھ نہیں۔",
    toastMergeSame: "دو الگ میزیں چنیں۔",
    historyTitle: "ادائیگیوں کی ہسٹری",
    historyCount: (n)=> n + " ادائیگیاں",
    historyEmpty: "ابھی کوئی ادائیگی نہیں۔<br>میز ادا ہونے پر یہاں نظر آئے گی۔",
    mesaLabel: "میز", barraLabel: "آرڈر",
    viewOrder: "آرڈر دیکھیں",
    btnCerrarDia: "🔒 دن بند کریں",
    confirmCloseDay: "دن بند کریں؟ سب میزیں خالی ہو جائیں گی اور آج کی ادائیگیوں کی ہسٹری مٹ جائے گی۔ یہ واپس نہیں ہو گا۔",
    closeDayOk: "دن بند کریں",
    toastDayClosed: "دن بند ہو گیا۔",
    syncOn: "سنک ہو رہا ہے", syncOff: "لوکل موڈ (سنک نہیں)",
    loginSub: "",
    sessionSubmit: "داخل ہوں",
    loginError: "",
    sessionChipLabel: "سیشن", changeLabel: "تبدیل",
  },
  en: {
    tagline: "Floor order pad",
    eyebrow: "Floor plan",
    heading: "Tap a table to open the order",
    legendFree: "Free", legendBusy: "Order open", legendBarra: "Bar",
    keyFree: "Free", keyBusy: "Occupied",
    btnSaldo: "Floor balance", btnHistorial: "📖 History", btnSalon: "🎨 Design",
    themeNames: ["🎨 Theme: Ali Doner", "🎨 Theme: Night", "🎨 Theme: Pakistan green", "🎨 Theme: Saffron"],
    btnTickets: "Parked tickets", btnJuntar: "Merge tables",
    back: "← Tables",
    comanda: "Order", comandaBarra: "Takeaway order",
    searchPh: "Search dish, ingredient…",
    pay: "✓ Paid", clear: "Clear table",
    resultsHeading: "Results",
    resultsSub: (n,q)=> n + " dish(es) found for “" + q + "”",
    catSub: (n)=> n + " items",
    noResults: "No results. Try another term.",
    add: "Add",
    mixerWith: "With ",
     note: "Note", notePlaceholder: "Write a note…", noteSave: "Save note", noNote: "No note",
    ticketMark: "ALI DONER · ORDER",
    ticketEmpty: "No items yet<br>for this table",
    total: "Total",
    itemsCount: (n)=> n + (n===1 ? " item" : " items"),
    confirmClear: (label)=> "Clear the whole order for " + label.toLowerCase() + "?",
    clearOk: "Clear all",
    cancel: "Cancel",
    confirmPay: (label,total)=> "Mark " + label.toLowerCase() + " as paid for " + total + "? The table will become free.",
    payOk: "Confirm payment",
    toastTableEmptyAlready: "This table is already empty.",
    toastCleared: "Order cleared.",
    toastNoOrderToPay: "This table has no order to charge.",
    toastPaid: (label,total)=> label + " paid · " + total,
    toastSaldo: (n,total)=> "Floor balance: " + total + " across " + n + " table(s)/bar seat(s) with an open order.",
    toastNoSaldo: "No open orders on the floor.",
    toastTickets: "Parked tickets: not included in this demo.",
    toastJuntar: "Merge tables: not included in this demo.",
    pedidosTitle: "🛵 Orders", pedidosSub: "Takeaway / delivery", fsEnter: "Full screen", fsExit: "Exit full screen", roleCaja: "Cashier", roleCocina: "Kitchen", rolePizza: "Pizza", rolePostre: "Desserts", roleComanda: "Orders",
    kitchenTagline: "Pending orders",
    kitchenEmpty: "No pending dishes.",
    kitchenTick: "Mark as done",
    kitchenPending: (n)=> n + (n===1 ? " pending" : " pending"),
    kitchenAllDone: "All done ✓",
    variableBtn: "Custom",
    variableNamePrompt: "Enter the item name.",
    variableNamePlaceholder: "E.g. Special portion, Set menu…",
    next: "Next",
    parkBtn: "📦 Park",
    toastNoOrderToPark: "This table has no order to park.",
    parkPrompt: "Give this ticket a name (e.g. Terrace, Takeaway…).",
    parkPlaceholder: "Ticket name",
    parkOk: "Park",
    toastParked: "Ticket parked.",
    parkedTitle: "Parked tickets",
    parkedEmpty: "No parked tickets.",
    parkedResume: "Resume",
    parkedDelete: "Delete",
    confirmDeleteParked: "Delete this parked ticket? This can't be undone.",
    deleteOk: "Delete",
    toastParkedDeleted: "Ticket deleted.",
    pickResumeTarget: "Pick the table to resume this ticket on.",
    toastResumed: (label)=> "Ticket resumed on " + label + ".",
    pickSourceMerge: "Pick the SOURCE table (it will be cleared).",
    pickDestMerge: "Pick the DESTINATION table (everything moves here).",
    confirmMerge: (a,b)=> "Merge the whole order from " + a.toLowerCase() + " into " + b.toLowerCase() + "? " + a + " will become free.",
    mergeOk: "Merge",
    toastMerged: (a,b)=> a + " merged into " + b + ".",
    toastMergeEmptySource: "That table is empty, nothing to merge.",
    toastMergeSame: "Pick two different tables.",
    historyTitle: "Payment history",
    historyCount: (n)=> n + " payment(s) recorded",
    historyEmpty: "No payments recorded yet.<br>Once you mark a table as paid, it will show up here.",
    mesaLabel: "Table", barraLabel: "Order",
    viewOrder: "View order",
    btnCerrarDia: "🔒 Close day",
    confirmCloseDay: "Close the day? All tables and the bar will be cleared, and today's whole payment history will be deleted. This can't be undone.",
    closeDayOk: "Close day",
    toastDayClosed: "Day closed. Everything reset.",
    syncOn: "Synced", syncOff: "Local mode (not synced)",
    loginSub: "Enter your session code.",
    sessionSubmit: "Enter",
    loginError: "Incorrect code.",
    sessionChipLabel: "Session", changeLabel: "Change",
  },
};

/* ===================== STATE ===================== */
// Plano de sala de Ali Doner Kebab (según el dibujo): 4 columnas x 3 filas.
//   fila 1:  ·  1  2  3
//   fila 2:  ·  4  5  6
//   fila 3:  7  8  9  10
const FLOOR_LAYOUT = [
  { id:1,  label:"1",  col:2, row:1 },
  { id:2,  label:"2",  col:3, row:1 },
  { id:3,  label:"3",  col:4, row:1 },
  { id:4,  label:"4",  col:2, row:2 },
  { id:5,  label:"5",  col:3, row:2 },
  { id:6,  label:"6",  col:4, row:2 },
  { id:7,  label:"7",  col:1, row:3 },
  { id:8,  label:"8",  col:2, row:3 },
  { id:9,  label:"9",  col:3, row:3 },
  { id:10, label:"10", col:4, row:3 },
];
// Pedidos para llevar / a domicilio: huecos pequeños P1-P6 (ids 501-506),
// en el espacio libre de arriba a la izquierda del plano.
const BARRA_LAYOUT = [501,502,503,504,505,506].map(id=>({ id }));
const ALL_IDS = [...FLOOR_LAYOUT.map(t=>t.id), ...BARRA_LAYOUT.map(b=>b.id)];

let orders = {};              // orders[tableId] = { itemId: qty }
ALL_IDS.forEach(id => orders[id] = {});
let currentTable = null;
let currentLang = "es";
// Rol del dispositivo: "comanda" (toma pedidos, plano de sala) o "cocina"/"pizza"/"postre"
// (cola de platos por preparar, sin poder tomar pedidos). Se guarda por dispositivo.
let appRole = "comanda";
try{
  const savedRole = localStorage.getItem("ali_role");
  if(savedRole === "cocina") appRole = savedRole;
}catch(e){}
const THEME_CLASSES = ["", "theme-noche", "theme-pakistan", "theme-azafran"];
let themeIndex = 0;
// Cada dispositivo recuerda el diseño elegido.
try{
  const savedTheme = parseInt(localStorage.getItem("ali_theme"), 10);
  if(savedTheme > 0 && savedTheme < THEME_CLASSES.length){
    themeIndex = savedTheme;
    document.documentElement.className = THEME_CLASSES[themeIndex];
  }
}catch(e){}
let MENU = buildMenu(currentLang);
let FLAT = buildFlat(MENU);
let currentCat = MENU[0].cat;
let searchTerm = "";
// Normaliza texto para la búsqueda: minúsculas y sin acentos, así "agua" encuentra "Água"/"AGUA" etc.
// sin cruzarse con otras palabras que sólo comparten alguna letra.
function normalizeText(s){
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Comprueba si "query" aparece como palabra completa (o frase completa) dentro de "text".
// Así, buscar "agua" no encuentra "aguacate" dentro de la descripción de otro plato: sólo
// cuenta si "agua" está sola, separada por espacios u otros signos, no pegada a más letras.
function wholeWordIncludes(text, query){
  if(!query) return false;
  const t = normalizeText(text);
  const q = normalizeText(query);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(^|[^a-z0-9])" + escaped + "($|[^a-z0-9])");
  return re.test(t);
}
function isBarra(id){ return id >= 500; }
function tableLabel(id){ return isBarra(id) ? I18N[currentLang].barraLabel + " " + (id - 500) : I18N[currentLang].mesaLabel + " " + id; }

let history = [];             // pagos registrados: { id, table, ts, items:[{name,qty,price}], total }
let historyCounter = 1;
let parked = [];              // tiquets aparcados: { id, label, ts, items:{itemId:qty}, total }
let parkedCounter = 1;

/* ===================== HELPERS ===================== */
const eur = n => n.toFixed(2).replace(".", ",") + " €";
// Claves internas de orders[tableId] que no son artículos (notas, tick de cocina).
const RESERVED_ORDER_KEYS = ["_notes", "_done", "_people"];
function isItemId(id){ return RESERVED_ORDER_KEYS.indexOf(id) === -1; }
function tableTotal(t){
  const o = orders[t];
  return Object.keys(o).filter(isItemId).reduce((sum,id)=>{
    const item = FLAT.find(f=>f.id===id);
    return sum + (item ? item.price*o[id] : 0);
  },0);
}
function tableCount(t){
  return Object.keys(orders[t]).filter(isItemId).reduce((a,id)=>a+orders[t][id],0);
}

/* ===================== SINCRONIZACIÓN (Firebase, por sesión) ===================== */
/* ===================== TEMA VISUAL (Salón) ===================== */
function cycleTheme(){
  themeIndex = (themeIndex + 1) % THEME_CLASSES.length;
  const cls = THEME_CLASSES[themeIndex];
  document.documentElement.className = cls;
  try{ localStorage.setItem("ali_theme", String(themeIndex)); }catch(e){}
  showToast(I18N[currentLang].themeNames[themeIndex]);
}

function updateSyncBadge(on){
  const el = document.getElementById("sync-badge");
  if(!el) return;
  el.textContent = (on ? "🟢 " : "🔶 ") + (on ? I18N[currentLang].syncOn : I18N[currentLang].syncOff);
  el.classList.toggle("on", on);
  el.classList.toggle("off", !on);
}
function historyFromSnapshot(val){
  if(!val) return [];
  return Object.keys(val).sort().map(k => ({
    id: k, table: val[k].table, ts: val[k].ts,
    items: val[k].items || [], total: val[k].total || 0,
    method: val[k].method || null,
    paidAmount: val[k].paidAmount != null ? val[k].paidAmount : null,
    change: val[k].change != null ? val[k].change : null,
    people: val[k].people || null,
    date: val[k].date || null,
    time: val[k].time || null,
    ticketNo: val[k].ticketNo || null
  }));
}
function parkedFromSnapshot(val){
  if(!val) return [];
  return Object.keys(val).sort().map(k => ({
    id: k, label: val[k].label, ts: val[k].ts,
    items: val[k].items || {}, total: val[k].total || 0
  }));
}
function refreshAfterOrdersChange(){
  regenerateMixerVariants();
  if(document.getElementById("home-view").hidden === false){
    renderHome();
  } else if(document.getElementById("table-view").hidden === false){
    renderItems();
    renderTicket();
  } else if(document.getElementById("kitchen-view").hidden === false){
    renderKitchen();
  }
}
// Conexión base a Firebase (una sola vez, independiente del código de sesión).
function connectFirebase(){
  const configured = typeof firebase !== "undefined"
    && FIREBASE_CONFIG.apiKey
    && FIREBASE_CONFIG.apiKey.indexOf("TU_API_KEY") === -1;
  if(!configured){
    firebaseReady = false;
    updateSyncBadge(false);
    return;
  }
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    firebase.auth().signInAnonymously().then(()=>{
      db = firebase.database();
      firebaseReady = true;
      updateSyncBadge(true);
      if(currentSession) attachSessionListeners(currentSession);
    }).catch(err=>{
      console.warn("Firebase auth error:", err);
      firebaseReady = false;
      updateSyncBadge(false);
    });
  } catch(err){
    console.warn("Firebase init error:", err);
    firebaseReady = false;
    updateSyncBadge(false);
  }
}
// Engancha los listeners en tiempo real a la sala del código elegido.
function attachSessionListeners(code){
  detachSessionListeners();
  ordersRef = db.ref(DB_ROOT + "sessions/" + code + "/orders");
  historyRef = db.ref(DB_ROOT + "sessions/" + code + "/history");
  parkedRef = db.ref(DB_ROOT + "sessions/" + code + "/parked");
  ordersRef.on("value", snap=>{
    const val = snap.val() || {};
    const next = {};
    ALL_IDS.forEach(id => { next[id] = val[id] || {}; });
    orders = next;
    refreshAfterOrdersChange();
  });
  historyRef.on("value", snap=>{
    history = historyFromSnapshot(snap.val());
  });
  parkedRef.on("value", snap=>{
    parked = parkedFromSnapshot(snap.val());
  });
  attachInbox(code);
}
function detachSessionListeners(){
  if(ordersRef) ordersRef.off();
  if(historyRef) historyRef.off();
  if(parkedRef) parkedRef.off();
  detachInbox();
  ordersRef = null;
  historyRef = null;
  parkedRef = null;
}
// Entrar en una sesión (código de sala compartida).
function joinSession(code){
  currentSession = code;
  orders = {};
  ALL_IDS.forEach(id => orders[id] = {});
  history = [];
  parked = [];
  document.getElementById("current-session-label").textContent = code;
  if(firebaseReady){
    attachSessionListeners(code);
  }
  try{ localStorage.setItem("ali_session_code", code); }catch(e){}
  document.getElementById("login-view").hidden = true;
  showRoleView();
}
// Salir de la sesión y volver a la pantalla de código.
function leaveSession(){
  detachSessionListeners();
  currentSession = null;
  try{ localStorage.removeItem("ali_session_code"); }catch(e){}
  orders = {};
  ALL_IDS.forEach(id => orders[id] = {});
  history = [];
  parked = [];
  currentTable = null;
  document.getElementById("home-view").hidden = true;
  document.getElementById("table-view").hidden = true;
  document.getElementById("kitchen-view").hidden = true;
  document.getElementById("mobile-ticket-toggle").hidden = true;
  document.getElementById("login-view").hidden = false;
  document.getElementById("login-error").hidden = true;
  document.getElementById("session-input").value = "";
}

/* ===================== ROL DEL DISPOSITIVO (Cocina / Pizza / Comanda) ===================== */
// Muestra la vista que corresponde al rol actual, una vez hay sesión abierta.
// "comanda" -> plano de sala (toma de pedidos). "cocina"/"pizza" -> cola de cocina, sin pedidos.
function showRoleView(){
  document.getElementById("mobile-ticket-toggle").hidden = true;
  if(appRole === "cocina" || appRole === "pizza" || appRole === "postre"){
    currentTable = null;
    document.getElementById("home-view").hidden = true;
    document.getElementById("table-view").hidden = true;
    document.getElementById("kitchen-view").hidden = false;
    renderKitchen();
  } else {
    document.getElementById("kitchen-view").hidden = true;
    document.getElementById("table-view").hidden = true;
    document.getElementById("home-view").hidden = false;
    renderHome();
    const heading = document.getElementById("home-heading");
    if(heading) heading.textContent = appRole === "caja" ? "Toca una mesa para cobrar" : I18N[currentLang].heading;
  }
  updateRoleButtons();
}
/* ===================== PANTALLA COMPLETA (Cocina y Caja) ===================== */
function fsSupported(){
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}
function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function toggleFullscreen(){
  const el = document.documentElement;
  try{
    if(isFullscreen()){
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      const r = req.call(el);
      if(r && r.catch) r.catch(()=>{});
    }
  }catch(e){}
}
function updateFullscreenButtons(){
  const t = I18N[currentLang];
  const ok = fsSupported();
  const homeBtn = document.getElementById("fs-btn-home");
  const kitBtn = document.getElementById("fs-btn-kitchen");
  if(homeBtn) homeBtn.hidden = !ok || appRole !== "caja";
  if(kitBtn) kitBtn.hidden = !ok;
  document.querySelectorAll(".fs-btn .fs-label").forEach(el=>{
    el.textContent = isFullscreen() ? t.fsExit : t.fsEnter;
  });
}
document.querySelectorAll(".fs-btn").forEach(b=>b.addEventListener("click", toggleFullscreen));
document.addEventListener("fullscreenchange", updateFullscreenButtons);
document.addEventListener("webkitfullscreenchange", updateFullscreenButtons);

function updateRoleButtons(){
  document.querySelectorAll(".role-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.role === appRole);
  });
  const drawerBtn = document.getElementById("connect-drawer-btn");
  if(drawerBtn) drawerBtn.hidden = appRole !== "caja";
  updateFullscreenButtons();
  const t = I18N[currentLang];
  if(appRole === "cocina" || appRole === "pizza" || appRole === "postre"){
    const marks = { cocina:"🍳", pizza:"🍕", postre:"🍰" };
    const labels = { cocina:t.roleCocina, pizza:t.rolePizza, postre:t.rolePostre };
    document.getElementById("kitchen-mark").textContent = marks[appRole];
    document.getElementById("kitchen-title").textContent = labels[appRole];
    document.getElementById("kitchen-tagline").textContent = t.kitchenTagline;
  }
}
function setRole(role){
  if(role === appRole) return;
  appRole = role;
  if(typeof renderInbox === "function") renderInbox();
  try{
    if(role === "cocina" || role === "pizza" || role === "postre") localStorage.setItem("ali_role", role);
    else localStorage.removeItem("ali_role"); // "comanda" y "caja" no se recuerdan
  }catch(e){}
  if(currentSession) showRoleView();
  else updateRoleButtons();
}
document.querySelectorAll(".role-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const role = btn.dataset.role;
    setRole(role);
  });
});

// Cola de platos pendientes/preparados para Cocina o Pizza, agrupada por mesa.
function renderKitchen(){
  const body = document.getElementById("kitchen-body");
  if(!body) return;
  const groupKey = appRole === "cocina" ? "Cocina" : (appRole === "pizza" ? "Pizzas" : (appRole === "postre" ? "Postres" : null));
  if(!groupKey){ body.innerHTML = ""; return; }
  const t = I18N[currentLang];
  const cards = [];
  ALL_IDS.forEach(tableId=>{
    const order = orders[tableId] || {};
    const lines = Object.keys(order).filter(isItemId).map(itemId=>{
      const item = FLAT.find(f=>f.id===itemId);
      if(!item || kitchenGroupOf(item) !== groupKey) return null;
      return {
        itemId,
        name: item.name,
        qty: order[itemId],
        note: getOrderNote(tableId, itemId),
        done: getItemDone(tableId, itemId)
      };
    }).filter(Boolean);
    if(lines.length === 0) return;
    lines.sort((a,b)=> (a.done - b.done) || a.name.localeCompare(b.name));
    const pending = lines.filter(l=>!l.done).length;
    cards.push({ tableId, label: tableLabel(tableId), lines, pending });
  });
  if(cards.length === 0){
    body.innerHTML = `<div class="kitchen-empty">${t.kitchenEmpty}</div>`;
    return;
  }
  cards.sort((a,b)=> (b.pending>0) - (a.pending>0) || a.tableId - b.tableId);
  body.innerHTML = cards.map(card=>`
    <div class="kitchen-table-card" data-table="${card.tableId}">
      <div class="kitchen-table-head">
        <span>${card.label}</span>
        <span class="kth-pending">${card.pending>0 ? t.kitchenPending(card.pending) : t.kitchenAllDone}</span>
      </div>
      ${card.lines.map(l=>`
        <div class="kitchen-line ${l.done?'done':''}" data-item="${l.itemId}">
          <div class="kl-info">
            <span class="kl-name"><span class="kl-qty">${l.qty}×</span>${l.name}</span>
            ${l.note ? `<span class="kl-note">📝 ${l.note.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>` : ""}
          </div>
          <button class="kl-tick" title="${t.kitchenTick}">✓</button>
        </div>
      `).join("")}
    </div>
  `).join("");
  body.querySelectorAll(".kitchen-line").forEach(line=>{
    line.querySelector(".kl-tick").addEventListener("click", ()=>{
      const tableId = Number(line.closest(".kitchen-table-card").dataset.table);
      const itemId = line.dataset.item;
      writeItemDone(tableId, itemId, !getItemDone(tableId, itemId));
    });
  });
}

// Escritura de pedidos: si hay Firebase, se persiste ahí (y el listener
// de arriba actualiza la vista); si no, se actualiza solo en local.
function writeQty(tableId, itemId, qty){
  if(firebaseReady && currentSession){
    const path = DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId + "/" + itemId;
    if(qty <= 0) db.ref(path).remove();
    else db.ref(path).set(qty);
  } else {
    if(qty <= 0) delete orders[tableId][itemId];
    else orders[tableId][itemId] = qty;
    refreshAfterOrdersChange();
  }
}
function writeClearTable(tableId){
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId).remove();
  } else {
    orders[tableId] = {};
    refreshAfterOrdersChange();
  }
}
function writePay(tableId, record){
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/history").push(record);
    db.ref(DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId).remove();
  } else {
    record.id = historyCounter++;
    history.push(record);
    orders[tableId] = {};
  }
}
function writeCloseDay(){
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/orders").remove();
    db.ref(DB_ROOT + "sessions/" + currentSession + "/history").remove();
    db.ref(DB_ROOT + "sessions/" + currentSession + "/parked").remove();
  } else {
    orders = {};
    ALL_IDS.forEach(id => orders[id] = {});
    history = [];
    parked = [];
  }
  resetTicketCounter();
}
function writePark(tableId, label){
  const items = Object.assign({}, orders[tableId]);
  const localeMap = { es:"es-ES", ca:"ca-ES", en:"en-GB" };
  const record = {
    label: label,
    ts: new Date().toLocaleString(localeMap[currentLang],{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
    items: items,
    total: tableTotal(tableId)
  };
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/parked").push(record);
    db.ref(DB_ROOT + "sessions/" + currentSession + "/orders/" + tableId).remove();
  } else {
    record.id = "p" + (parkedCounter++);
    parked.push(record);
    orders[tableId] = {};
  }
}
function writeRemoveParked(key){
  if(firebaseReady && currentSession){
    db.ref(DB_ROOT + "sessions/" + currentSession + "/parked/" + key).remove();
  } else {
    parked = parked.filter(p => p.id !== key);
  }
}
function resumeParked(key, targetId){
  const rec = parked.find(p => p.id === key);
  if(!rec) return;
  Object.keys(rec.items).forEach(id=>{
    const addQty = rec.items[id];
    const cur = orders[targetId][id] || 0;
    writeQty(targetId, id, cur + addQty);
  });
  writeRemoveParked(key);
}
function mergeTables(source, dest){
  const items = orders[source] || {};
  Object.keys(items).forEach(id=>{
    const addQty = items[id];
    const cur = orders[dest][id] || 0;
    writeQty(dest, id, cur + addQty);
  });
  writeClearTable(source);
}

/* ===================== RENDER: HOME (plano de sala) ===================== */
function renderHome(){
  const floor = document.getElementById("floor");
  floor.innerHTML = "";
  const tr = I18N[currentLang];
  FLOOR_LAYOUT.forEach(t=>{
    const busy = tableCount(t.id) > 0;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "mesa-tile" + (busy ? " busy" : "");
    tile.style.gridColumn = t.col;
    tile.style.gridRow = t.row;
    const people = getTablePeople(t.id);
    tile.innerHTML = `
      <span class="mesa-word">${tr.mesaLabel}</span>
      <span class="mesa-num">${t.label}</span>
      <span class="mesa-state">${busy ? eur(tableTotal(t.id)) + (people ? " · " + people + "👤" : "") : tr.keyFree}</span>
    `;
    tile.addEventListener("click", ()=>openTable(t.id));
    floor.appendChild(tile);
  });

  // Zona pequeña de pedidos (para llevar / domicilio)
  const zone = document.createElement("div");
  zone.className = "pedidos-zone";
  zone.style.gridColumn = "1";
  zone.style.gridRow = "1 / span 2";
  zone.innerHTML = `<div class="pz-head"><b>${tr.pedidosTitle}</b><small>${tr.pedidosSub}</small></div><div class="pz-grid"></div>`;
  const grid = zone.querySelector(".pz-grid");
  BARRA_LAYOUT.forEach(b=>{
    const busy = tableCount(b.id) > 0;
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "pz-slot" + (busy ? " busy" : "");
    slot.innerHTML = `<span class="pz-num">P${b.id - 500}</span><span class="pz-state">${busy ? eur(tableTotal(b.id)) : tr.keyFree}</span>`;
    slot.addEventListener("click", ()=>openTable(b.id));
    grid.appendChild(slot);
  });
  floor.appendChild(zone);
}

/* ===================== CONFIRM / TOAST (propios, sin confirm()/alert() nativos) ===================== */
function showToast(msg){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("show"));
  setTimeout(()=>{
    t.classList.remove("show");
    setTimeout(()=>t.remove(), 300);
  }, 2400);
}
function showConfirm(msg, okLabel, onYes){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <p>${msg}</p>
      <div class="confirm-actions">
        <button class="confirm-cancel">${I18N[currentLang].cancel}</button>
        <button class="confirm-ok">${okLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".confirm-cancel").addEventListener("click", ()=>overlay.remove());
  overlay.querySelector(".confirm-ok").addEventListener("click", ()=>{
    overlay.remove();
    onYes();
  });
}

function showPrompt(msg, placeholder, okLabel, onSubmit){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <p>${msg}</p>
      <input type="text" class="prompt-input" placeholder="${placeholder}" maxlength="30">
      <div class="confirm-actions">
        <button class="confirm-cancel">${I18N[currentLang].cancel}</button>
        <button class="confirm-ok">${okLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const input = overlay.querySelector(".prompt-input");
  setTimeout(()=>input.focus(), 50);
  const submit = ()=>{
    const val = input.value.trim();
    overlay.remove();
    onSubmit(val);
  };
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".confirm-cancel").addEventListener("click", ()=>overlay.remove());
  overlay.querySelector(".confirm-ok").addEventListener("click", submit);
  input.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); submit(); } });
}

// Diálogo "¿Cuántas personas son?" — se muestra al abrir desde Comanda una mesa vacía
// sin personas asignadas todavía.
function openPeopleAssignDialog(tableId, onDone){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  const chips = [1,2,3,4,5,6,7,8].map(n=>`<button class="people-chip" data-n="${n}">${n}</button>`).join("");
  overlay.innerHTML = `
    <div class="confirm-box">
      <p>¿Cuántas personas son?</p>
      <div class="people-grid">${chips}</div>
      <input type="text" inputmode="numeric" pattern="[0-9]*" class="prompt-input people-other-input" placeholder="Otro número">
      <div class="confirm-actions">
        <button class="confirm-cancel">${I18N[currentLang].cancel}</button>
        <button class="confirm-ok people-other-ok">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const finish = (n)=>{
    overlay.remove();
    writeTablePeople(tableId, n);
    onDone();
  };
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".confirm-cancel").addEventListener("click", ()=>overlay.remove());
  overlay.querySelectorAll(".people-chip").forEach(btn=>{
    btn.addEventListener("click", ()=> finish(Number(btn.dataset.n)));
  });
  const otherInput = overlay.querySelector(".people-other-input");
  const submitOther = ()=>{
    const n = parseInt(otherInput.value, 10);
    if(n && n > 0) finish(n);
  };
  overlay.querySelector(".people-other-ok").addEventListener("click", submitOther);
  otherInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); submitOther(); } });
}

/* ===================== IMPRESIÓN (tickets y cierre de día) ===================== */
// Manda a imprimir un fragmento HTML usando un iframe oculto (evita bloqueos de pop-ups
// y no depende de ninguna impresora concreta: usa el diálogo de impresión del dispositivo).
function printHTML(bodyHtml){
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ali Doner Kebab</title>
    <style>
      /* Quita el margen de página que pone el navegador por defecto al
         imprimir: en un rollo de papel continuo (impresora de tickets) eso
         se traduce en un hueco en blanco antes de que empiece el texto. */
      @page{ size:80mm auto; margin:0; }
      html,body{margin:0;padding:0;}
      /* 'Matriz_A1': fuente de matriz de puntos (tipo ticket clásico) instalada
         localmente en el TPV (no es un webfont, no depende de internet). Si
         algún dispositivo no la tiene instalada, cae en Courier New/monospace. */
      body{font-family:'Matriz_A1','Courier New',Courier,monospace;font-size:13px;font-weight:700;width:300px;margin:0 auto;padding:6px 10px 10px;color:#000;}
      h1,h2,h3{text-align:center;margin:4px 0;}
      p{margin:2px 0;}
      hr{border:none;border-top:2px dashed #000;margin:6px 0;}
      .center{text-align:center;}
      .strong{font-weight:800;font-size:15px;}
      .muted{color:#333;font-size:12px;}
      .line{display:flex;justify-content:space-between;padding:2px 0;}
      .total{font-weight:800;font-size:17px;}
      .frow2{display:flex;justify-content:space-between;font-size:13px;padding:2px 0;}
      .frow2.strong{font-weight:800;font-size:17px;}
      /* filas de artículos (UNIT/DESCRIPCIO/PREU/IMPORT) y BASE/%IVA/IMP.IVA:
         tabla HTML con anchuras de columna fijas en vez de grid/flex o texto
         con espacios, porque grid/flex de +2 columnas y el relleno con
         espacios (que depende de que el dispositivo tenga fuente
         monoespaciada) no se renderizaban bien en la impresora fiscal. Una
         tabla con <colgroup> es el método más compatible: alinea igual
         aunque la fuente no sea monoespaciada.
         Todo el texto va en negrita (peso 700-800) para que se imprima
         oscuro y legible; la jerarquía visual (nombre, ticket nº y totales
         más grandes) se consigue solo con el TAMAÑO de letra, no con pesos
         intermedios (como 500), que en la impresora fiscal salían demasiado
         finos y apenas visibles. */
      table.rtable{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;font-weight:700;}
      table.rtable th, table.rtable td{padding:2px 0;vertical-align:top;}
      table.rtable th{font-weight:800;font-size:13px;}
      .rt-unit{width:14%;text-align:left;}
      .rt-desc{width:48%;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:4px;}
      .rt-preu{width:18%;text-align:right;}
      .rt-import{width:20%;text-align:right;}
      .rb-a{width:34%;text-align:left;}
      .rb-b{width:33%;text-align:left;}
      .rb-c{width:33%;text-align:right;}
    </style>
    </head><body>${bodyHtml}</body></html>`);
  doc.close();
  setTimeout(()=>{
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(()=>{ if(iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 1000);
  }, 250);
}

// Datos fiscales del negocio, tal y como aparecen en el ticket impreso.
const BIZ_NAME = "ALI DONER KEBAB";
const BIZ_ADDRESS = ["CARRER DE CÒRSEGA 629", "08025 BARCELONA", "TEL. 657 340 510 / 930 000 783"];
const BIZ_LEGAL = ""; // ← razón social del negocio (rellenar)
const BIZ_CIF = "";   // ← CIF/NIF del negocio (rellenar)
const IVA_RATE = 10; // % IVA incluido en los precios

// Formatea un número como "1234,56" (sin símbolo de moneda), como en el ticket fiscal.
function money(n){ return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2).replace(".", ","); }

function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Numeración de tickets: cada mesa/comanda abierta en Caja obtiene un número
// correlativo (001, 002, 003…) que se mantiene mientras esa comanda siga abierta,
// tanto si se imprime el "pendiente de cobro" como el recibo final ya cobrado.
let ticketCounter = 1;
try{
  const savedTicketCounter = localStorage.getItem("ali_ticket_counter");
  if(savedTicketCounter) ticketCounter = parseInt(savedTicketCounter, 10) || 1;
}catch(e){}
function saveTicketCounter(){
  try{ localStorage.setItem("ali_ticket_counter", String(ticketCounter)); }catch(e){}
}
let tableTicketNumbers = {}; // tableId -> nº de ticket asignado a la comanda actual
function getTicketNumberForTable(tableId){
  if(!tableTicketNumbers[tableId]){
    tableTicketNumbers[tableId] = ticketCounter++;
    saveTicketCounter();
  }
  return tableTicketNumbers[tableId];
}
function clearTicketNumberForTable(tableId){
  delete tableTicketNumbers[tableId];
}
function resetTicketCounter(){
  ticketCounter = 1;
  saveTicketCounter();
  tableTicketNumbers = {};
}

// Construye el HTML del ticket con el mismo formato que la impresora fiscal del
// restaurante: cabecera con datos del negocio, nº de ticket, fecha/hora, líneas de
// artículos (UNIT./DESCRIPCIO/PREU/IMPORT), desglose de BASE/%IVA/IMP.IVA, total,
// importe por comensal y, según el caso, "pendiente de cobro" o la forma de pago.
function buildReceiptHTML(opts){
  const total = opts.total;
  const base = total / (1 + IVA_RATE/100);
  const ivaAmount = total - base;
  const perPerson = opts.people ? total / opts.people : null;
  const itemRowsHtml = opts.items.length ? opts.items.map(it=>`
    <tr>
      <td class="rt-unit">${it.qty}</td>
      <td class="rt-desc">${escapeHtml(String(it.name).toUpperCase())}</td>
      <td class="rt-preu">${money(it.price)}</td>
      <td class="rt-import">${money(it.price*it.qty)}</td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="center muted">Sin artículos</td></tr>`;

  let payBlock;
  if(opts.pending){
    payBlock = `<div class="frow2 strong"><span>PENDIENTE DE COBRO</span><span>${money(total)}</span></div>`;
  } else {
    payBlock = `
      <div class="frow2"><span>FORMA DE PAGO</span><span>${opts.method === "efectivo" ? "EFECTIVO" : "TARJETA"}</span></div>
      ${opts.method === "efectivo" ? `
        <div class="frow2"><span>ENTREGADO</span><span>${money(opts.paidAmount)}</span></div>
        <div class="frow2"><span>CAMBIO</span><span>${money(opts.change)}</span></div>
      ` : ""}
    `;
  }

  return `
    <p class="center strong">*** ${BIZ_NAME} ***</p>
    ${BIZ_ADDRESS.map(l=>`<p class="center">${l}</p>`).join("")}
    ${BIZ_LEGAL ? `<p class="center">${BIZ_LEGAL}</p>` : ""}
    ${BIZ_CIF ? `<p class="center">CIF: ${BIZ_CIF}</p>` : ""}
    <hr>
    <p class="center strong">${String(opts.ticketNo).padStart(3,"0")}</p>
    <hr>
    <div class="frow2"><span>FRA SIM:COMPROBANTE</span><span>HORA:${opts.time}</span></div>
    <div class="frow2"><span>DATA:${opts.date}</span><span></span></div>
    <hr>
    <table class="rtable">
      <thead>
        <tr>
          <th class="rt-unit">UNIT.</th>
          <th class="rt-desc">DESCRIPCIO</th>
          <th class="rt-preu">PREU</th>
          <th class="rt-import">IMPORT</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>
    <hr>
    <table class="rtable">
      <tr>
        <td class="rb-a">BASE</td>
        <td class="rb-b">%IVA</td>
        <td class="rb-c">IMP.IVA</td>
      </tr>
      <tr>
        <td class="rb-a">${money(base)}</td>
        <td class="rb-b">${IVA_RATE.toFixed(2).replace(".",",")}</td>
        <td class="rb-c">${money(ivaAmount)}</td>
      </tr>
    </table>
    <hr>
    <div class="frow2 strong"><span>TOTAL EUROS</span><span>${money(total)}</span></div>
    ${perPerson != null ? `<div class="frow2"><span>IMPORT PER COMENÇAL</span><span>${money(perPerson)}</span></div>` : ""}
    <hr>
    ${payBlock}
    <hr>
    <p class="center">GRACIES PER LA SEVA VISITA</p>
    <p class="center">${IVA_RATE}% IVA INCLOS</p>
  `;
}

// Fecha/hora en el formato del ticket fiscal: DD/MM/AAAA y HH:MM.
function ticketDateParts(d){
  const pad = n => String(n).padStart(2,"0");
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

// Imprime el "comprobante" (pendiente de cobro) de la comanda actual de una mesa.
function printTableTicket(tableId){
  const items = Object.keys(orders[tableId] || {}).filter(isItemId).map(id=>{
    const item = FLAT.find(f=>f.id===id);
    return item ? { name: item.name, qty: orders[tableId][id], price: item.price } : null;
  }).filter(Boolean);
  const { date, time } = ticketDateParts(new Date());
  printHTML(buildReceiptHTML({
    ticketNo: getTicketNumberForTable(tableId),
    date, time,
    people: getTablePeople(tableId),
    items,
    total: tableTotal(tableId),
    pending: true
  }));
}
// Reimprime el ticket final (ya cobrado) de un registro del historial.
function printHistoryRecord(record){
  let date = record.date, time = record.time;
  if(!date || !time){
    // Registros antiguos (antes de este formato) no guardan date/time por separado;
    // se usa el texto ya formateado que tuvieran como aproximación.
    date = record.ts || ""; time = "";
  }
  printHTML(buildReceiptHTML({
    ticketNo: record.ticketNo || "—",
    date, time,
    people: record.people || null,
    items: record.items,
    total: record.total,
    method: record.method || null,
    paidAmount: record.paidAmount != null ? record.paidAmount : null,
    change: record.change != null ? record.change : null,
    pending: false
  }));
}

// Diálogo de cobro desde Caja: elegir Efectivo/Tarjeta, calcular el cambio e imprimir.
function openPaymentDialog(tableId, onPaid){
  const total = tableTotal(tableId);
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <p>Cobrar ${tableLabel(tableId)} — <b>${eur(total)}</b></p>
      <div class="pay-method-grid">
        <button class="pay-method-btn" data-method="efectivo"><span class="ico">💵</span>Efectivo</button>
        <button class="pay-method-btn" data-method="tarjeta"><span class="ico">💳</span>Tarjeta</button>
      </div>
      <button class="confirm-cancel" style="width:100%;">${I18N[currentLang].cancel}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".confirm-cancel").addEventListener("click", ()=>overlay.remove());

  const finish = (method, paidAmount, change)=>{
    overlay.remove();
    onPaid({ method, paidAmount, change });
  };

  overlay.querySelector('[data-method="tarjeta"]').addEventListener("click", ()=>{
    finish("tarjeta", total, 0);
  });
  overlay.querySelector('[data-method="efectivo"]').addEventListener("click", ()=>{
    overlay.innerHTML = `
      <div class="confirm-box">
        <p>Efectivo — ${tableLabel(tableId)}</p>
        <div class="pay-summary-row"><span>Total a cobrar</span><b>${eur(total)}</b></div>
        <input type="text" inputmode="decimal" class="prompt-input cash-paid-input" placeholder="¿Cuánto ha pagado?">
        <div class="pay-change-box" hidden><span>Cambio</span><span class="cash-change-val">0,00 €</span></div>
        <div class="confirm-actions">
          <button class="confirm-cancel">${I18N[currentLang].cancel}</button>
          <button class="confirm-ok cash-confirm">Cobrar e imprimir</button>
        </div>
      </div>
    `;
    const input = overlay.querySelector(".cash-paid-input");
    const changeBox = overlay.querySelector(".pay-change-box");
    const changeVal = overlay.querySelector(".cash-change-val");
    setTimeout(()=>input.focus(), 50);
    const updateChange = ()=>{
      const paid = parseFloat((input.value||"").replace(",", "."));
      if(!isNaN(paid) && paid >= total){
        changeBox.hidden = false;
        changeVal.textContent = eur(paid - total);
      } else {
        changeBox.hidden = true;
      }
    };
    input.addEventListener("input", updateChange);
    overlay.querySelector(".confirm-cancel").addEventListener("click", ()=>overlay.remove());
    const submitCash = ()=>{
      const paid = parseFloat((input.value||"").replace(",", "."));
      if(isNaN(paid) || paid < total){
        showToast("Introduce un importe igual o mayor al total");
        return;
      }
      finish("efectivo", paid, paid - total);
    };
    overlay.querySelector(".cash-confirm").addEventListener("click", submitCash);
    input.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); submitCash(); } });
  });
}

// Selector de opción genérico (refresco de un combinado, o hielo/limón de una bebida):
// muestra una ventana con botones, uno por opción, y ejecuta onPick(index) al elegir.
function openOptionPicker(promptText, options, onPick, noteCallback){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  const chips = options.map((label, i)=>`<button class="picker-chip" data-idx="${i}">${label}</button>`).join("");
  const variableButton = noteCallback
    ? `<button class="picker-chip picker-variable-btn">Variable</button>`
    : "";
  overlay.innerHTML = `
    <div class="picker-box">
      <p>${promptText}</p>
      <div class="picker-grid">${chips}${variableButton}</div>
      <button class="picker-cancel">${I18N[currentLang].cancel}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".picker-cancel").addEventListener("click", ()=>overlay.remove());

  if(noteCallback){
    overlay.querySelector(".picker-variable-btn").addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
      noteCallback();
    });
  }

  overlay.querySelectorAll(".picker-chip[data-idx]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      overlay.remove();
      onPick(idx);
    });
  });
}

// Artículo "Variable": nombre y precio libres, para cualquier mesa, sin depender
// de un combinado con mezclador. Se abre con el botón "➕ Variable" de la comanda.
function openVariableItemFlow(){
  const t = I18N[currentLang];
  const nameOverlay = document.createElement("div");
  nameOverlay.className = "confirm-overlay";
  nameOverlay.innerHTML = `
    <div class="note-box">
      <h3>${t.variableBtn}</h3>
      <p>${t.variableNamePrompt}</p>
      <textarea class="note-input" maxlength="60" placeholder="${t.variableNamePlaceholder}"></textarea>
      <div class="note-actions">
        <button class="note-cancel">${t.cancel}</button>
        <button class="note-save">${t.next}</button>
      </div>
    </div>
  `;
  document.body.appendChild(nameOverlay);
  const nameInput = nameOverlay.querySelector(".note-input");
  setTimeout(()=>nameInput.focus(), 50);
  const closeName = ()=>nameOverlay.remove();
  nameOverlay.addEventListener("click", e=>{ if(e.target===nameOverlay) closeName(); });
  nameOverlay.querySelector(".note-cancel").addEventListener("click", closeName);

  const goToPrice = ()=>{
    const name = nameInput.value.trim();
    if(!name) return;
    nameOverlay.remove();

    const priceOverlay = document.createElement("div");
    priceOverlay.className = "confirm-overlay";
    priceOverlay.innerHTML = `
      <div class="note-box">
        <h3>${t.total}</h3>
        <p>${name}</p>
        <input type="number" class="note-input price-input" step="0.01" min="0" inputmode="decimal" placeholder="0.00">
        <div class="note-actions">
          <button class="note-cancel">${t.cancel}</button>
          <button class="note-save">${t.add}</button>
        </div>
      </div>
    `;
    document.body.appendChild(priceOverlay);
    const priceInput = priceOverlay.querySelector(".price-input");
    setTimeout(()=>{ priceInput.focus(); }, 50);
    const closePrice = ()=>priceOverlay.remove();
    priceOverlay.addEventListener("click", e=>{ if(e.target===priceOverlay) closePrice(); });
    priceOverlay.querySelector(".note-cancel").addEventListener("click", closePrice);

    const save = ()=>{
      const raw = priceInput.value.replace(",", ".").trim();
      const parsed = parseFloat(raw);
      const finalPrice = (!isNaN(parsed) && parsed >= 0) ? parsed : 0;
      const variantId = "var-" + Date.now();
      const variant = {
        id: variantId,
        cat: t.variableBtn,
        group: t.variableBtn,
        groupKey: null,
        name: name,
        desc: "",
        price: finalPrice,
        mixers: null,
        extras: null
      };
      FLAT.push(variant);
      writeQty(currentTable, variant.id, 1);
      priceOverlay.remove();
    };
    priceOverlay.querySelector(".note-save").addEventListener("click", save);
    priceInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); save(); } });
  };
  nameOverlay.querySelector(".note-save").addEventListener("click", goToPrice);
  nameInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); goToPrice(); } });
}

// Selector de mesa/barra genérico (para juntar mesas y recuperar tiquets aparcados).
function openTablePicker(promptText, onPick, excludeId){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  const chips = ALL_IDS.filter(id => id !== excludeId).map(id=>{
    const busy = tableCount(id) > 0;
    return `<button class="picker-chip${busy ? " busy" : ""}" data-id="${id}">${tableLabel(id)}</button>`;
  }).join("");
  overlay.innerHTML = `
    <div class="picker-box">
      <p>${promptText}</p>
      <div class="picker-grid">${chips}</div>
      <button class="picker-cancel">${I18N[currentLang].cancel}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector(".picker-cancel").addEventListener("click", ()=>overlay.remove());
  overlay.querySelectorAll(".picker-chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = Number(btn.dataset.id);
      overlay.remove();
      onPick(id);
    });
  });
}

document.getElementById("btn-saldo").addEventListener("click", ()=>{
  const activeIds = ALL_IDS.filter(id=>tableCount(id)>0);
  const total = activeIds.reduce((s,id)=>s+tableTotal(id),0);
  showToast(activeIds.length
    ? I18N[currentLang].toastSaldo(activeIds.length, eur(total))
    : I18N[currentLang].toastNoSaldo);
});
document.getElementById("btn-salon").addEventListener("click", cycleTheme);
document.getElementById("btn-tickets").addEventListener("click", openParkedList);
document.getElementById("btn-juntar").addEventListener("click", ()=>{
  openTablePicker(I18N[currentLang].pickSourceMerge, (source)=>{
    if(tableCount(source) === 0){
      showToast(I18N[currentLang].toastMergeEmptySource);
      return;
    }
    openTablePicker(I18N[currentLang].pickDestMerge, (dest)=>{
      if(dest === source){
        showToast(I18N[currentLang].toastMergeSame);
        return;
      }
      showConfirm(
        I18N[currentLang].confirmMerge(tableLabel(source), tableLabel(dest)),
        I18N[currentLang].mergeOk,
        ()=>{
          mergeTables(source, dest);
          showToast(I18N[currentLang].toastMerged(tableLabel(source), tableLabel(dest)));
        }
      );
    }, source);
  });
});
document.getElementById("btn-historial").addEventListener("click", openHistory);

/* ===================== IDIOMA ===================== */
function applyStaticText(){
  const t = I18N[currentLang];
  document.getElementById("tagline").textContent = t.tagline;
  document.getElementById("home-eyebrow").textContent = t.eyebrow;
  document.getElementById("home-heading").textContent = t.heading;
  document.getElementById("legend-free").textContent = t.legendFree;
  document.getElementById("legend-busy").textContent = t.legendBusy;
  // (sin barra en este local)
  document.getElementById("key-free").textContent = t.keyFree;
  document.getElementById("key-busy").textContent = t.keyBusy;
  document.getElementById("btn-saldo").textContent = t.btnSaldo;
  document.getElementById("btn-historial").textContent = t.btnHistorial;
  document.getElementById("btn-salon").textContent = t.btnSalon;
  document.getElementById("btn-tickets").textContent = t.btnTickets;
  document.getElementById("btn-juntar").textContent = t.btnJuntar;
  document.getElementById("back-btn").textContent = t.back;
  document.getElementById("search-input").placeholder = t.searchPh;
  document.getElementById("variable-btn-label").textContent = t.variableBtn;
  document.getElementById("pay-btn").textContent = t.pay;
  document.getElementById("park-btn").textContent = t.parkBtn;
  document.getElementById("clear-mesa-btn").textContent = t.clear;
  document.getElementById("ticket-brand-mark").textContent = t.ticketMark;
  document.getElementById("ticket-total-label").textContent = t.total;
  document.getElementById("mobile-ticket-label").textContent = t.viewOrder;
  document.getElementById("btn-cerrar-dia").textContent = t.btnCerrarDia;
  document.getElementById("login-sub").textContent = t.loginSub;
  document.getElementById("session-submit").textContent = t.sessionSubmit;
  document.getElementById("login-error").textContent = t.loginError;
  document.getElementById("session-chip-label").textContent = t.sessionChipLabel;
  document.getElementById("change-session-label").textContent = t.changeLabel;
  updateSyncBadge(firebaseReady);
  document.querySelectorAll(".lang-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
  document.querySelectorAll('.role-btn[data-role="cocina"] span').forEach(el=>el.textContent = t.roleCocina);
  document.querySelectorAll('.role-btn[data-role="pizza"] span').forEach(el=>el.textContent = t.rolePizza);
  document.querySelectorAll('.role-btn[data-role="postre"] span').forEach(el=>el.textContent = t.rolePostre);
  document.querySelectorAll('.role-btn[data-role="comanda"] span').forEach(el=>el.textContent = t.roleComanda);
  document.querySelectorAll('.role-btn[data-role="caja"] span').forEach(el=>el.textContent = t.roleCaja);
  updateRoleButtons();
}

function setLang(lang){
  if(lang === currentLang) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  MENU = buildMenu(currentLang);
  FLAT = buildFlat(MENU);
  regenerateMixerVariants();
  currentCat = MENU[0].cat;
  searchTerm = "";
  applyStaticText();
  if(appRole === "cocina" || appRole === "pizza" || appRole === "postre"){
    renderKitchen();
  } else if(document.getElementById("table-view").hidden){
    renderHome();
  } else {
    document.getElementById("search-input").value = "";
    document.getElementById("tv-label").textContent = isBarra(currentTable) ? I18N[currentLang].comandaBarra : I18N[currentLang].comanda;
    document.getElementById("ticket-mesa-num").textContent = tableLabel(currentTable);
    renderCatRail();
    renderItems();
    renderTicket();
  }
}
document.querySelectorAll(".lang-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>setLang(btn.dataset.lang));
});

/* ===================== HISTORIAL DE PAGOS ===================== */
function openHistory(){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";

  const totalHoy = history.reduce((s,h)=>s+h.total,0);

  const listHtml = history.length === 0
    ? `<div class="history-empty">${I18N[currentLang].historyEmpty}</div>`
    : [...history].reverse().map(h => `
        <div class="history-entry" data-hid="${h.id}">
          <div class="history-entry-head">
            <div>
              <div class="htitle">${h.table}</div>
              <div class="hmeta">${h.ts}</div>
            </div>
            <div class="htotal">${eur(h.total)}</div>
            <div class="chev">▾</div>
          </div>
          <div class="history-entry-detail">
            ${h.items.map(it => `
              <div class="hdet-line">
                <span><span class="q">${it.qty}×</span>${it.name}</span>
                <span>${eur(it.price * it.qty)}</span>
              </div>
            `).join("")}
            <button class="history-reprint" data-hid="${h.id}">🖨️ Reimprimir ticket</button>
          </div>
        </div>
      `).join("");

  overlay.innerHTML = `
    <div class="history-box">
      <div class="history-head">
        <h3>${I18N[currentLang].historyTitle}</h3>
        <button id="history-close">✕</button>
      </div>
      <div class="history-summary">
        <span>${I18N[currentLang].historyCount(history.length)}</span>
        <b>${eur(totalHoy)}</b>
      </div>
      <div class="history-list">${listHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector("#history-close").addEventListener("click", ()=>overlay.remove());
  overlay.querySelectorAll(".history-entry-head").forEach(head=>{
    head.addEventListener("click", ()=>{
      head.parentElement.classList.toggle("open");
    });
  });
  overlay.querySelectorAll(".history-reprint").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const hid = Number(btn.dataset.hid);
      const record = history.find(h => h.id === hid);
      if(record) printHistoryRecord(record);
    });
  });
}

function openParkedList(){
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";

  const listHtml = parked.length === 0
    ? `<div class="history-empty">${I18N[currentLang].parkedEmpty}</div>`
    : [...parked].reverse().map(p => {
        const itemsHtml = Object.keys(p.items).map(id=>{
          const item = FLAT.find(f=>f.id===id);
          if(!item) return "";
          const qty = p.items[id];
          return `
            <div class="hdet-line">
              <span><span class="q">${qty}×</span>${item.name}</span>
              <span>${eur(item.price * qty)}</span>
            </div>
          `;
        }).join("");
        return `
          <div class="history-entry" data-pid="${p.id}">
            <div class="history-entry-head">
              <div>
                <div class="htitle">${p.label}</div>
                <div class="hmeta">${p.ts}</div>
              </div>
              <div class="htotal">${eur(p.total)}</div>
              <div class="chev">▾</div>
            </div>
            <div class="history-entry-detail">
              ${itemsHtml}
              <div class="parked-actions">
                <button class="parked-resume" data-pid="${p.id}">${I18N[currentLang].parkedResume}</button>
                <button class="parked-delete" data-pid="${p.id}">${I18N[currentLang].parkedDelete}</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

  overlay.innerHTML = `
    <div class="history-box">
      <div class="history-head">
        <h3>${I18N[currentLang].parkedTitle}</h3>
        <button id="parked-close">✕</button>
      </div>
      <div class="history-summary">
        <span>${I18N[currentLang].historyCount(parked.length)}</span>
      </div>
      <div class="history-list">${listHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e)=>{ if(e.target===overlay) overlay.remove(); });
  overlay.querySelector("#parked-close").addEventListener("click", ()=>overlay.remove());
  overlay.querySelectorAll(".history-entry-head").forEach(head=>{
    head.addEventListener("click", ()=>{
      head.parentElement.classList.toggle("open");
    });
  });
  overlay.querySelectorAll(".parked-resume").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const pid = btn.dataset.pid;
      overlay.remove();
      openTablePicker(I18N[currentLang].pickResumeTarget, (targetId)=>{
        resumeParked(pid, targetId);
        showToast(I18N[currentLang].toastResumed(tableLabel(targetId)));
        openTable(targetId);
      });
    });
  });
  overlay.querySelectorAll(".parked-delete").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const pid = btn.dataset.pid;
      showConfirm(I18N[currentLang].confirmDeleteParked, I18N[currentLang].deleteOk, ()=>{
        writeRemoveParked(pid);
        overlay.remove();
        showToast(I18N[currentLang].toastParkedDeleted);
      });
    });
  });
}

/* ===================== RENDER: TABLE VIEW ===================== */
function openTable(n){
  if(appRole !== "comanda" && appRole !== "caja") return; // Cocina/Pizza no pueden tomar pedidos.
  // En Comanda, si la mesa está vacía y no tiene personas asignadas todavía,
  // primero se pregunta cuántas son antes de abrir la carta.
  if(appRole === "comanda" && !isBarra(n) && tableCount(n) === 0 && !getTablePeople(n)){
    openPeopleAssignDialog(n, ()=> openTableNow(n));
    return;
  }
  openTableNow(n);
}
function openTableNow(n){
  currentTable = n;
  searchTerm = "";
  currentCat = MENU[0].cat;
  document.getElementById("home-view").hidden = true;
  document.getElementById("table-view").hidden = false;
  document.getElementById("mobile-ticket-toggle").hidden = false;
  document.getElementById("search-input").value = "";
  document.getElementById("tv-num").textContent = isBarra(n) ? "P" + (n - 500) : n;
  document.getElementById("tv-label").textContent = isBarra(n) ? I18N[currentLang].comandaBarra : I18N[currentLang].comanda;
  document.getElementById("ticket-mesa-num").textContent = tableLabel(n);
  const localeMap = { es:"es-ES", ca:"ca-ES", en:"en-GB" };
  document.getElementById("ticket-ts").textContent = new Date().toLocaleString(localeMap[currentLang],{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  // El botón de pagar, aparcar e imprimir solo se pueden usar desde Caja.
  const isCaja = appRole === "caja";
  document.getElementById("pay-btn").hidden = !isCaja;
  document.getElementById("park-btn").hidden = !isCaja;
  document.getElementById("print-btn").hidden = !isCaja;
  renderCatRail();
  renderItems();
  renderTicket();
}

function backToHome(){
  currentTable = null;
  document.getElementById("ticket-panel").classList.remove("open");
  document.getElementById("table-view").hidden = true;
  document.getElementById("home-view").hidden = false;
  document.getElementById("mobile-ticket-toggle").hidden = true;
  renderHome();
}

function renderCatRail(){
  const rail = document.getElementById("cat-rail");
  rail.innerHTML = "";
  let lastGroup = null;
  MENU.forEach(section=>{
    if(section.group !== lastGroup){
      const lbl = document.createElement("div");
      lbl.className = "cat-group-label";
      lbl.textContent = section.group;
      rail.appendChild(lbl);
      lastGroup = section.group;
    }
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (section.cat===currentCat && !searchTerm ? " active" : "");
    btn.textContent = section.cat;
    btn.addEventListener("click", ()=>{
      currentCat = section.cat;
      searchTerm = "";
      document.getElementById("search-input").value = "";
      renderCatRail();
      renderItems();
    });
    rail.appendChild(btn);
  });
}

// Las líneas "plato · opción" (carne, variedad...) solo van en la comanda, no en la carta.
function isOptionVariantId(id){ return /-(mx|ex)\d+$/.test(id); }
function renderItems(){
  const area = document.getElementById("items-area");
  const heading = document.getElementById("items-heading");
  let list, title, sub;

  if(searchTerm.trim()){
    const rawQ = searchTerm.trim();
    const q = normalizeText(rawQ);
    // El nombre del plato admite coincidencia parcial (para poder ir escribiendo, ej. "moji" -> Mojito).
    // La descripción (ingredientes) y la categoría sólo cuentan si la palabra buscada aparece completa,
    // así "agua" no encuentra "aguacate" en la descripción de otro plato.
    list = FLAT.filter(f => !isOptionVariantId(f.id)).filter(f => normalizeText(f.name).includes(q) || wholeWordIncludes(f.desc, rawQ) || wholeWordIncludes(f.cat, rawQ));
    title = I18N[currentLang].resultsHeading;
    sub = I18N[currentLang].resultsSub(list.length, searchTerm);
  } else {
    list = FLAT.filter(f=>f.cat===currentCat && !isOptionVariantId(f.id));
    title = currentCat;
    sub = I18N[currentLang].catSub(list.length);
  }

  area.innerHTML = `<h3 class="items-heading">${title}</h3><p class="items-sub">${sub}</p>`;

  if(list.length===0){
    area.innerHTML += `<div class="empty-state">${I18N[currentLang].noResults}</div>`;
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "items-wrap";
  list.forEach(item=>{
    const optList = item.mixers || item.extras || null;
    const optSuffix = item.mixers ? 'mx' : (item.extras ? 'ex' : null);
    const hasOptions = !!optList;
    // Para artículos con opción (combinado+refresco, o refresco+hielo/limón), la cantidad
    // mostrada es la suma de todas sus variantes.
    const qty = hasOptions
      ? optList.reduce((sum,_,i)=> sum + (orders[currentTable][item.id+'-'+optSuffix+i] || 0), 0)
      : (orders[currentTable][item.id] || 0);
    const row = document.createElement("div");
    row.className = "item-row" + (qty>0 ? " in-order" : "");
    const note = (!hasOptions && qty>0) ? getOrderNote(currentTable, item.id) : "";
    row.innerHTML = `
      <div class="item-info">
        <div class="name">${item.name}${searchTerm.trim() ? `<span class="cat-pill">${item.cat}</span>` : ""}</div>
        ${item.desc ? `<div class="desc">${item.desc}</div>` : ""}
        ${note ? `<div class="ticket-note">📝 ${note.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>` : ""}
      </div>
      <div class="item-price">${eur(item.price)}</div>
      <div class="qty-ctrl" data-id="${item.id}" ${hasOptions ? `data-opt-suffix="${optSuffix}"` : ''}>
        ${qty>0 ? `
          <button class="qty-btn minus">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn plus">+</button>
          ${!hasOptions ? `<button class="qty-btn note-btn" title="${I18N[currentLang].note}">📝</button>` : ""}
        ` : `
          <button class="qty-btn add-only">${I18N[currentLang].add}</button>
        `}
      </div>
    `;
    wrap.appendChild(row);
  });
  area.appendChild(wrap);

  area.querySelectorAll(".qty-ctrl").forEach(ctrl=>{
    const baseId = ctrl.dataset.id;
    const optSuffix = ctrl.dataset.optSuffix || null;
    const plus = ctrl.querySelector(".plus, .add-only");
    const minus = ctrl.querySelector(".minus");
    const noteBtn = ctrl.querySelector(".note-btn");
    if(noteBtn) noteBtn.addEventListener("click", ()=>{
      const item = FLAT.find(f => f.id === baseId);
      if(item) openNoteEditor(baseId, item.name, ()=> renderItems());
    });
    if(plus) plus.addEventListener("click", ()=>{
      if(optSuffix){
        const baseItem = FLAT.find(f => f.id === baseId);
        const optList = optSuffix === 'mx' ? baseItem.mixers : baseItem.extras;
        const openPicker = ()=>{
          openOptionPicker(baseItem.name, optList, (optIndex)=>{
            const variant = optSuffix === 'mx' ? getMixerVariant(baseItem, optIndex) : getExtraVariant(baseItem, optIndex);
            changeQty(variant.id, 1);
          }, optSuffix === 'mx' ? ()=>{
            const variableOverlay = document.createElement("div");
            variableOverlay.className = "confirm-overlay";
            variableOverlay.innerHTML = `
              <div class="note-box">
                <h3>Variable</h3>
                <p>${baseItem.name}</p>
                <textarea class="note-input" maxlength="100" placeholder="Escribe algo..."></textarea>
                <div class="note-actions">
                  <button class="note-cancel">${I18N[currentLang].cancel}</button>
                  <button class="note-save">Añadir</button>
                </div>
              </div>
            `;
            document.body.appendChild(variableOverlay);
            const input = variableOverlay.querySelector(".note-input");
            setTimeout(()=>input.focus(),50);

            const close = ()=>variableOverlay.remove();
            variableOverlay.addEventListener("click", e=>{
              if(e.target===variableOverlay) close();
            });
            variableOverlay.querySelector(".note-cancel").addEventListener("click", close);
            variableOverlay.querySelector(".note-save").addEventListener("click", ()=>{
              const text = input.value.trim();
              if(!text) return;
              variableOverlay.remove();

              // Segundo paso: precio para esta variante "Variable".
              const priceOverlay = document.createElement("div");
              priceOverlay.className = "confirm-overlay";
              priceOverlay.innerHTML = `
                <div class="note-box">
                  <h3>Precio</h3>
                  <p>${baseItem.name} · ${text}</p>
                  <input type="number" class="note-input price-input" step="0.01" min="0" inputmode="decimal" value="${baseItem.price.toFixed(2)}" placeholder="0.00">
                  <div class="note-actions">
                    <button class="note-cancel">${I18N[currentLang].cancel}</button>
                    <button class="note-save">Añadir</button>
                  </div>
                </div>
              `;
              document.body.appendChild(priceOverlay);
              const priceInput = priceOverlay.querySelector(".price-input");
              setTimeout(()=>{ priceInput.focus(); priceInput.select(); }, 50);

              const closePrice = ()=>priceOverlay.remove();
              priceOverlay.addEventListener("click", e=>{
                if(e.target===priceOverlay) closePrice();
              });
              priceOverlay.querySelector(".note-cancel").addEventListener("click", closePrice);
              const savePrice = ()=>{
                const raw = priceInput.value.replace(",", ".").trim();
                const parsed = parseFloat(raw);
                const finalPrice = (!isNaN(parsed) && parsed >= 0) ? parsed : baseItem.price;

                // Create a custom variant with the text and price entered in Variable.
                const variantId = baseItem.id + "-var-" + Date.now();
                const variant = {
                  id: variantId,
                  cat: baseItem.cat,
                  group: baseItem.group,
                  groupKey: baseItem.groupKey,
                  name: baseItem.name + " · " + text,
                  desc: baseItem.desc,
                  price: finalPrice,
                  mixers: null,
                  extras: null
                };
                FLAT.push(variant);
                writeQty(currentTable, variant.id, 1);
                priceOverlay.remove();
              };
              priceOverlay.querySelector(".note-save").addEventListener("click", savePrice);
              priceInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); savePrice(); } });
            });
          } : null);
        };
        openPicker();
      } else {
        changeQty(baseId, 1);
      }
    });
    if(minus) minus.addEventListener("click", ()=>{
      if(optSuffix){
        // Quita primero de alguna variante que tenga stock
        const baseItem = FLAT.find(f => f.id === baseId);
        const optList = optSuffix === 'mx' ? baseItem.mixers : baseItem.extras;
        let targetId = null;
        for(let i=0;i<optList.length;i++){
          const vid = baseId+'-'+optSuffix+i;
          if((orders[currentTable][vid]||0) > 0) targetId = vid;
        }
        if(targetId) changeQty(targetId, -1);
      } else {
        changeQty(baseId, -1);
      }
    });
  });
}

function changeQty(id, delta){
  const cur = orders[currentTable][id] || 0;
  const next = cur + delta;
  writeQty(currentTable, id, next);
}

function renderTicket(){
  const itemsEl = document.getElementById("ticket-items");
  const o = orders[currentTable];
  const ids = Object.keys(o).filter(isItemId);
  if(ids.length===0){
    itemsEl.innerHTML = `<div class="ticket-empty">${I18N[currentLang].ticketEmpty}</div>`;
  } else {
    itemsEl.innerHTML = ids.map(id=>{
      const item = FLAT.find(f=>f.id===id);
      const qty = o[id];
      const note = getOrderNote(currentTable, id);
      return `
        <div class="ticket-line" data-id="${id}">
          <div class="l-name">
            <span class="q">${qty}×</span>${item.name}
            ${note ? `<span class="ticket-note">📝 ${note.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>` : ""}
          </div>
          <div class="l-price">${eur(item.price*qty)}</div>
          <button class="l-remove l-note-btn" title="${I18N[currentLang].note}">📝</button>
          <button class="l-remove" title="Quitar">✕</button>
        </div>
      `;
    }).join("");
    itemsEl.querySelectorAll(".ticket-line").forEach(line=>{
      const noteBtn = line.querySelector(".l-note-btn");
      if(noteBtn){
        noteBtn.addEventListener("click", ()=>{
          const item = FLAT.find(f => f.id === line.dataset.id);
          if(item) openNoteEditor(line.dataset.id, item.name, ()=>{});
        });
      }
      line.querySelector(".l-remove:not(.l-note-btn)").addEventListener("click", ()=>{
        writeQty(currentTable, line.dataset.id, 0);
      });
    });
  }
  document.getElementById("ticket-total").textContent = eur(tableTotal(currentTable));
  const count = tableCount(currentTable);
  document.getElementById("ticket-count").textContent = I18N[currentLang].itemsCount(count);
  const badge = document.getElementById("mobile-ticket-badge");
  badge.textContent = count>0 ? "· " + count : "";
}

/* ===================== EVENTS ===================== */
document.getElementById("back-btn").addEventListener("click", backToHome);

document.getElementById("search-input").addEventListener("input", (e)=>{
  searchTerm = e.target.value;
  renderCatRail();
  renderItems();
});

document.getElementById("variable-btn").addEventListener("click", ()=>{
  if(!currentTable) return;
  openVariableItemFlow();
});

document.getElementById("pay-btn").addEventListener("click", ()=>{
  if(appRole !== "caja"){
    showToast("Solo se puede cobrar desde Caja");
    return;
  }
  const t = currentTable;
  if(tableCount(t)===0){
    showToast(I18N[currentLang].toastNoOrderToPay);
    return;
  }
  const total = tableTotal(t);
  openPaymentDialog(t, ({method, paidAmount, change})=>{
    const items = Object.keys(orders[t]).filter(isItemId).map(id=>{
      const item = FLAT.find(f=>f.id===id);
      return { name:item.name, qty:orders[t][id], price:item.price };
    });
    const localeMap = { es:"es-ES", ca:"ca-ES", en:"en-GB" };
    const now = new Date();
    const { date, time } = ticketDateParts(now);
    const ticketNo = getTicketNumberForTable(t);
    const record = {
      table: tableLabel(t),
      ts: now.toLocaleString(localeMap[currentLang],{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),
      date, time, ticketNo,
      items,
      total,
      method,
      paidAmount,
      change,
      people: getTablePeople(t)
    };
    printHTML(buildReceiptHTML({
      ticketNo, date, time, people: record.people,
      items, total, method, paidAmount, change, pending: false
    }));
    if(method === "efectivo" && typeof window.openCashDrawer === "function"){
      window.openCashDrawer();
    }
    writePay(t, record);
    clearTicketNumberForTable(t);
    showToast(I18N[currentLang].toastPaid(tableLabel(t), eur(total)));
    backToHome();
  });
});

document.getElementById("park-btn").addEventListener("click", ()=>{
  if(appRole !== "caja"){
    showToast("Solo se puede aparcar desde Caja");
    return;
  }
  const t = currentTable;
  if(tableCount(t)===0){
    showToast(I18N[currentLang].toastNoOrderToPark);
    return;
  }
  showPrompt(I18N[currentLang].parkPrompt, I18N[currentLang].parkPlaceholder, I18N[currentLang].parkOk, (label)=>{
    const finalLabel = label || tableLabel(t);
    writePark(t, finalLabel);
    clearTicketNumberForTable(t);
    showToast(I18N[currentLang].toastParked);
    backToHome();
  });
});

document.getElementById("print-btn").addEventListener("click", ()=>{
  if(appRole !== "caja" || !currentTable) return;
  printTableTicket(currentTable);
});

document.getElementById("clear-mesa-btn").addEventListener("click", ()=>{
  if(tableCount(currentTable)===0){
    showToast(I18N[currentLang].toastTableEmptyAlready);
    return;
  }
  showConfirm(I18N[currentLang].confirmClear(tableLabel(currentTable)), I18N[currentLang].clearOk, ()=>{
    writeClearTable(currentTable);
    clearTicketNumberForTable(currentTable);
    showToast(I18N[currentLang].toastCleared);
  });
});

document.getElementById("btn-cerrar-dia").addEventListener("click", ()=>{
  showConfirm(I18N[currentLang].confirmCloseDay, I18N[currentLang].closeDayOk, ()=>{
    printCloseDaySummary();
    writeCloseDay();
    showToast(I18N[currentLang].toastDayClosed);
    backToHome();
  });
});

// Resumen impreso al cerrar el día: total facturado, nº de tickets, personas
// atendidas y el plato más pedido. Se calcula con los datos de `history` antes
// de que writeCloseDay() los borre.
function printCloseDaySummary(){
  const totalDay = history.reduce((s,h)=>s+h.total, 0);
  const numTickets = history.length;
  const totalPeople = history.reduce((s,h)=>s + (h.people || 0), 0);
  const dishCounts = {};
  history.forEach(h=>{
    (h.items||[]).forEach(it=>{
      dishCounts[it.name] = (dishCounts[it.name]||0) + it.qty;
    });
  });
  let topDish = null, topQty = 0;
  Object.keys(dishCounts).forEach(name=>{
    if(dishCounts[name] > topQty){ topQty = dishCounts[name]; topDish = name; }
  });
  const cashTotal = history.filter(h=>h.method==="efectivo").reduce((s,h)=>s+h.total,0);
  const cardTotal = history.filter(h=>h.method==="tarjeta").reduce((s,h)=>s+h.total,0);
  const localeMap = { es:"es-ES", ca:"ca-ES", en:"en-GB" };
  const now = new Date().toLocaleString(localeMap[currentLang],{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  printHTML(`
    <h2>ALI DONER KEBAB</h2>
    <p class="center muted">Cierre de día — ${now}</p>
    <hr>
    <div class="line"><span>Tickets cobrados</span><span>${numTickets}</span></div>
    <div class="line"><span>Personas atendidas</span><span>${totalPeople || "—"}</span></div>
    <div class="line"><span>Efectivo</span><span>${eur(cashTotal)}</span></div>
    <div class="line"><span>Tarjeta</span><span>${eur(cardTotal)}</span></div>
    <hr>
    <div class="line total"><span>TOTAL DEL DÍA</span><span>${eur(totalDay)}</span></div>
    <hr>
    <p class="center muted">Plato más pedido</p>
    <p class="center" style="font-weight:800;">${topDish ? topDish + " (" + topQty + "×)" : "—"}</p>
    <hr>
  `);
}

document.getElementById("mobile-ticket-toggle").addEventListener("click", ()=>{
  document.getElementById("ticket-panel").classList.toggle("open");
});

/* ===================== INIT ===================== */
applyStaticText();
connectFirebase();

// Entra directamente, sin pedir ningún código.
joinSession(DEFAULT_SESSION);
