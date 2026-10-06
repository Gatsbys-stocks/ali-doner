/* Teclado virtual en pantalla */
(function(){
  "use strict";
  const KB_ID = "vkb-overlay";
  let activeInput = null;
  let shiftOn = false;

  function buildOverlay(){
    let el = document.getElementById(KB_ID);
    if(el) return el;
    el = document.createElement("div");
    el.id = KB_ID;
    document.body.appendChild(el);
    // Evita que al tocar una tecla el input pierda el foco antes de tiempo.
    el.addEventListener("mousedown", e=>e.preventDefault());
    el.addEventListener("touchstart", e=>e.preventDefault(), {passive:false});
    return el;
  }

  function setNativeValue(input, value){
    const proto = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(input, value);
  }

  function fireInput(input){
    input.dispatchEvent(new Event("input", {bubbles:true}));
  }

  function insertAtCursor(input, text){
    const start = input.selectionStart != null ? input.selectionStart : input.value.length;
    const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
    const val = input.value;
    const newVal = val.slice(0, start) + text + val.slice(end);
    setNativeValue(input, newVal);
    const pos = start + text.length;
    try{ input.setSelectionRange(pos, pos); }catch(e){}
    fireInput(input);
  }

  function backspace(input){
    const start = input.selectionStart != null ? input.selectionStart : input.value.length;
    const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
    const val = input.value;
    let newVal, pos;
    if(start !== end){
      newVal = val.slice(0, start) + val.slice(end);
      pos = start;
    } else if(start > 0){
      newVal = val.slice(0, start - 1) + val.slice(start);
      pos = start - 1;
    } else { return; }
    setNativeValue(input, newVal);
    try{ input.setSelectionRange(pos, pos); }catch(e){}
    fireInput(input);
  }

  function isNumericField(input){
    const mode = (input.getAttribute("inputmode") || "").toLowerCase();
    return input.type === "number" || mode === "numeric" || mode === "decimal";
  }
  function allowsDecimal(input){
    const mode = (input.getAttribute("inputmode") || "").toLowerCase();
    return input.type === "number" || mode === "decimal";
  }

  function renderNumeric(el, input){
    el.innerHTML = "";
    el.className = "vkb-numeric";
    const keys = ["7","8","9","4","5","6","1","2","3", allowsDecimal(input) ? "." : "", "0", "⌫"];
    keys.forEach(k=>{
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vkb-key vkb-num-key";
      if(k === "") { b.style.visibility = "hidden"; }
      if(k === "⌫") b.classList.add("vkb-del");
      b.textContent = k;
      b.addEventListener("click", ()=>{
        if(k === "") return;
        if(k === "⌫") backspace(input);
        else insertAtCursor(input, k);
      });
      el.appendChild(b);
    });
    const okRow = document.createElement("div");
    okRow.className = "vkb-row vkb-ok-row";
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "vkb-key vkb-ok";
    ok.textContent = "Hecho";
    ok.addEventListener("click", ()=> hideKeyboard());
    okRow.appendChild(ok);
    el.appendChild(okRow);
  }

  function renderText(el, input){
    el.innerHTML = "";
    el.className = "";
    const layoutLower = [
      ["1","2","3","4","5","6","7","8","9","0"],
      ["q","w","e","r","t","y","u","i","o","p"],
      ["a","s","d","f","g","h","j","k","l","ñ"],
      ["⇧","z","x","c","v","b","n","m","⌫"]
    ];
    const layoutUpper = [
      ["1","2","3","4","5","6","7","8","9","0"],
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L","Ñ"],
      ["⇧","Z","X","C","V","B","N","M","⌫"]
    ];
    const layout = shiftOn ? layoutUpper : layoutLower;
    layout.forEach(rowKeys=>{
      const row = document.createElement("div");
      row.className = "vkb-row";
      rowKeys.forEach(k=>{
        const b = document.createElement("button");
        b.type = "button";
        b.className = "vkb-key";
        if(k === "⇧") b.classList.add("vkb-shift", shiftOn ? "active" : "");
        if(k === "⌫") b.classList.add("vkb-del");
        b.textContent = k;
        b.addEventListener("click", ()=>{
          if(k === "⇧"){ shiftOn = !shiftOn; renderText(el, input); return; }
          if(k === "⌫"){ backspace(input); return; }
          insertAtCursor(input, k);
          if(shiftOn){ shiftOn = false; renderText(el, input); }
        });
        row.appendChild(b);
      });
      el.appendChild(row);
    });
    const bottomRow = document.createElement("div");
    bottomRow.className = "vkb-row vkb-bottom-row";
    const dotBtn = document.createElement("button");
    dotBtn.type = "button"; dotBtn.className = "vkb-key"; dotBtn.textContent = ".";
    dotBtn.addEventListener("click", ()=> insertAtCursor(input, "."));
    const spaceBtn = document.createElement("button");
    spaceBtn.type = "button"; spaceBtn.className = "vkb-key vkb-space"; spaceBtn.textContent = "espacio";
    spaceBtn.addEventListener("click", ()=> insertAtCursor(input, " "));
    const okBtn = document.createElement("button");
    okBtn.type = "button"; okBtn.className = "vkb-key vkb-ok"; okBtn.textContent = "Hecho";
    okBtn.addEventListener("click", ()=> hideKeyboard());
    bottomRow.appendChild(dotBtn);
    bottomRow.appendChild(spaceBtn);
    bottomRow.appendChild(okBtn);
    el.appendChild(bottomRow);
  }

  function showKeyboard(input){
    activeInput = input;
    const el = buildOverlay();
    if(isNumericField(input)) renderNumeric(el, input);
    else renderText(el, input);
    el.classList.add("open");
    document.body.classList.add("vkb-open");
  }

  function hideKeyboard(){
    const el = document.getElementById(KB_ID);
    if(el) el.classList.remove("open");
    document.body.classList.remove("vkb-open");
    activeInput = null;
  }

  function isEligible(el){
    if(!el) return false;
    const tag = el.tagName;
    if(tag === "TEXTAREA") return true;
    if(tag !== "INPUT") return false;
    const type = (el.type || "text").toLowerCase();
    return ["text","search","number","tel","email","password"].indexOf(type) !== -1;
  }

  document.addEventListener("focusin", (e)=>{
    if(isEligible(e.target)) showKeyboard(e.target);
  });

  document.addEventListener("focusout", ()=>{
    // Pequeño retraso: si el usuario tocó una tecla del teclado virtual,
    // el foco vuelve enseguida al mismo input y no debe cerrarse.
    setTimeout(()=>{
      const active = document.activeElement;
      if(isEligible(active)){
        if(active !== activeInput) showKeyboard(active);
        return;
      }
      hideKeyboard();
    }, 50);
  });
})();
