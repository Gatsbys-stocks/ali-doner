/* Cajón portamonedas (USB, vía impresora de tickets) */
(function(){
  "use strict";
  // La caja está conectada por cable RJ11/RJ12 a la impresora de tickets.
  // La impresora recibe el comando ESC/POS estándar de "abrir cajón" y
  // manda el pulso eléctrico que dispara el cajón. Por eso hablamos con la
  // impresora por USB (WebUSB), no con la caja directamente.
  const KICK_DRAWER_CMD = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]); // ESC p 0 25 250

  let drawerDevice = null;
  let drawerEndpoint = null;
  let drawerInterfaceNumber = null;

  // Refleja en el botón "Conectar caja" si la impresora/cajón está realmente
  // enlazada ahora mismo (verde), vinculada pero sin confirmar aún (ámbar),
  // o falló la última conexión (rojo) — así se ve de un vistazo sin tener que probar a cobrar.
  function updateDrawerButtonStatus(state){
    const btn = document.getElementById("connect-drawer-btn");
    if(!btn) return;
    btn.classList.remove("drawer-on", "drawer-off", "drawer-error");
    if(state === "on"){
      btn.classList.add("drawer-on");
      btn.innerHTML = '🗄️ Caja conectada ✓';
    } else if(state === "error"){
      btn.classList.add("drawer-error");
      btn.innerHTML = '🗄️ Caja sin conectar';
    } else {
      btn.classList.add("drawer-off");
      btn.innerHTML = '🗄️ Conectar caja';
    }
  }

  function findOutEndpoint(device){
    for(const conf of device.configurations){
      for(const iface of conf.interfaces){
        for(const alt of iface.alternates){
          const ep = alt.endpoints.find(e=>e.direction === "out");
          if(ep) return { configurationValue: conf.configurationValue, interfaceNumber: iface.interfaceNumber, endpointNumber: ep.endpointNumber };
        }
      }
    }
    return null;
  }

  async function openDeviceForUse(device){
    const found = findOutEndpoint(device);
    if(!found) throw new Error("La impresora no tiene un endpoint USB de salida reconocible");
    await device.open();
    if(device.configuration === null || device.configuration.configurationValue !== found.configurationValue){
      await device.selectConfiguration(found.configurationValue);
    }
    await device.claimInterface(found.interfaceNumber);
    drawerDevice = device;
    drawerEndpoint = found.endpointNumber;
    drawerInterfaceNumber = found.interfaceNumber;
    try{ localStorage.setItem("ali_drawer_paired", "1"); }catch(e){}
    updateDrawerButtonStatus("on");
  }

  async function connectDrawerPrinter(showMessages){
    if(!("usb" in navigator)){
      if(showMessages) showToast("Este navegador no soporta USB. Usa Chrome o Edge en el ordenador.");
      return false;
    }
    try{
      const device = await navigator.usb.requestDevice({ filters: [] });
      await openDeviceForUse(device);
      if(showMessages) showToast("Impresora / cajón conectados ✓");
      return true;
    }catch(err){
      console.warn("Conexión USB cancelada o fallida:", err);
      if(showMessages) showToast("No se pudo conectar la impresora");
      updateDrawerButtonStatus("error");
      return false;
    }
  }

  async function tryAutoReconnectDrawer(){
    if(!("usb" in navigator)) return;
    try{
      const devices = await navigator.usb.getDevices();
      if(devices.length > 0){
        await openDeviceForUse(devices[0]);
      } else {
        let paired = false;
        try{ paired = localStorage.getItem("ali_drawer_paired") === "1"; }catch(e){}
        updateDrawerButtonStatus(paired ? "error" : "off");
      }
    }catch(err){
      console.warn("No se pudo reconectar la impresora automáticamente:", err);
      updateDrawerButtonStatus("error");
    }
  }

  async function openCashDrawer(){
    if(!drawerDevice){
      let paired = false;
      try{ paired = localStorage.getItem("ali_drawer_paired") === "1"; }catch(e){}
      if(!paired){
        // Nunca se ha vinculado la impresora: no interrumpimos el cobro con
        // un diálogo de USB; solo avisamos para que se vincule desde "Conectar caja".
        showToast("Cajón no vinculado — pulsa 🗄️ Conectar caja");
        return;
      }
      const ok = await connectDrawerPrinter(false);
      if(!ok){ showToast("No se pudo abrir el cajón (reconecta desde 🗄️ Conectar caja)"); return; }
    }
    try{
      await drawerDevice.transferOut(drawerEndpoint, KICK_DRAWER_CMD);
    }catch(err){
      console.warn("No se pudo abrir el cajón:", err);
      showToast("No se pudo abrir el cajón (revisa el cable USB)");
      updateDrawerButtonStatus("error");
    }
  }

  const connectBtn = document.getElementById("connect-drawer-btn");
  if(connectBtn){
    connectBtn.addEventListener("click", ()=> connectDrawerPrinter(true));
  }

  if("usb" in navigator){
    navigator.usb.addEventListener("disconnect", (e)=>{
      if(drawerDevice && e.device === drawerDevice){
        drawerDevice = null;
        drawerEndpoint = null;
        showToast("Impresora/cajón desconectados");
        updateDrawerButtonStatus("error");
      }
    });
  }

  window.openCashDrawer = openCashDrawer;
  let paired0 = false;
  try{ paired0 = localStorage.getItem("ali_drawer_paired") === "1"; }catch(e){}
  updateDrawerButtonStatus(paired0 ? "error" : "off");
  tryAutoReconnectDrawer();
})();
