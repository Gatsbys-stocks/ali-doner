/* ===================== CARTA PARA LA TABLET DE MESA =====================
   Idiomas (en este orden): es, ca, en, fr, it, de, ar, ur
   IMPORTANTE: el "id" de cada plato (p. ej. "0-3") tiene que ser el MISMO que en
   la app de Cocina y Caja, porque es lo que se escribe en la comanda de la mesa.
   Para cambiar un precio, cámbialo aquí y en la app de Cocina y Caja. */
const LANGS = [
  { code:"es", label:"Español" }, { code:"ca", label:"Català" }, { code:"en", label:"English" },
  { code:"fr", label:"Français" }, { code:"it", label:"Italiano" }, { code:"de", label:"Deutsch" },
  { code:"ar", label:"العربية", rtl:true }, { code:"ur", label:"اردو", rtl:true }
];

const OPT = {
  meat: [
    ["Pollo","Pollastre","Chicken","Poulet","Pollo","Hähnchen","دجاج","چکن"],
    ["Ternera","Vedella","Beef","Bœuf","Manzo","Rind","لحم بقر","بیف"],
    ["Mixto","Mixt","Mixed","Mixte","Misto","Gemischt","مشكل","مکس"]
  ],
  meat2: [
    ["Pollo","Pollastre","Chicken","Poulet","Pollo","Hähnchen","دجاج","چکن"],
    ["Ternera","Vedella","Beef","Bœuf","Manzo","Rind","لحم بقر","بیف"]
  ],
  soda: [
    Array(8).fill("Coca-Cola"), Array(8).fill("Coca-Cola Zero"), Array(8).fill("Fanta"),
    Array(8).fill("Nestea"), Array(8).fill("Sprite")
  ]
};
const OPT_TITLE = {
  meat:  ["Elige la carne","Tria la carn","Choose your meat","Choisissez la viande","Scegli la carne","Fleisch wählen","اختر اللحم","گوشت منتخب کریں"],
  meat2: ["Elige la carne","Tria la carn","Choose your meat","Choisissez la viande","Scegli la carne","Fleisch wählen","اختر اللحم","گوشت منتخب کریں"],
  soda:  ["Elige el refresco","Tria el refresc","Choose your drink","Choisissez la boisson","Scegli la bibita","Getränk wählen","اختر المشروب","مشروب منتخب کریں"]
};

const ING = {
  lettuce:["lechuga","enciam","lettuce","salade","lattuga","Salat","خس","سلاد پتّا"],
  tomato:["tomate","tomàquet","tomato","tomate","pomodoro","Tomate","طماطم","ٹماٹر"],
  onion:["cebolla","ceba","onion","oignon","cipolla","Zwiebel","بصل","پیاز"],
  corn:["maíz","blat de moro","corn","maïs","mais","Mais","ذرة","مکئی"],
  olive:["olivas","olives","olives","olives","olive","Oliven","زيتون","زیتون"],
  meat:["carne","carn","meat","viande","carne","Fleisch","لحم","گوشت"],
  sauce:["salsa","salsa","sauce","sauce","salsa","Soße","صلصة","ساس"],
  pineapple:["piña","pinya","pineapple","ananas","ananas","Ananas","أناناس","انناس"],
  falafel:["falafel","falàfel","falafel","falafel","falafel","Falafel","فلافل","فلافل"],
  fries:["patatas fritas","patates fregides","fries","frites","patatine","Pommes","بطاطس مقلية","فرائز"],
  drink:["bebida","beguda","drink","boisson","bibita","Getränk","مشروب","ڈرنک"],
  cheese:["queso","formatge","cheese","fromage","formaggio","Käse","جبن","پنیر"],
  salad:["ensalada","amanida","salad","salade","insalata","Salat","سلطة","سلاد"],
  donerMeat:["carne de döner","carn de döner","döner meat","viande döner","carne di döner","Dönerfleisch","لحم دونر","ڈونر گوشت"],
  doubleMeat:["doble de carne","doble de carn","double meat","double viande","doppia carne","doppelt Fleisch","لحم مضاعف","ڈبل گوشت"],
  mozzarella:["mozzarella","mozzarella","mozzarella","mozzarella","mozzarella","Mozzarella","موزاريلا","موزریلا"],
  tuna:["atún","tonyina","tuna","thon","tonno","Thunfisch","تونة","ٹونا"],
  hummus:["hummus","hummus","hummus","houmous","hummus","Hummus","حمص","حمص"],
  baked:["gratinado al horno","gratinat al forn","oven-baked","gratiné au four","gratinato al forno","überbacken","مخبوز في الفرن","اوون میں پکا"],
  extraCheese:["extra de queso","extra de formatge","extra cheese","supplément fromage","formaggio extra","extra Käse","جبن إضافي","اضافی پنیر"],
  pistachio:["pistacho","pistatxo","pistachio","pistache","pistacchio","Pistazie","فستق","پستہ"],
  butter:["mantequilla","mantega","butter","beurre","burro","Butter","زبدة","مکھن"],
  cola2:["Coca-Cola 2 L","Coca-Cola 2 L","2 L Coca-Cola","Coca-Cola 2 L","Coca-Cola 2 L","Coca-Cola 2 L","كوكاكولا 2 لتر","کوکا کولا 2 لیٹر"],
  each:["por unidad","per unitat","each","à l'unité","al pezzo","pro Stück","للقطعة","فی عدد"],
  can:["lata 33 cl","llauna 33 cl","33 cl can","canette 33 cl","lattina 33 cl","Dose 33 cl","علبة 33 سل","کین 33 cl"],
  box:["en caja","en capsa","in a box","en boîte","in scatola","in der Box","في علبة","باکس میں"]
};

const TAGS = {
  veg:["Vegetariano","Vegetarià","Veggie","Végétarien","Vegetariano","Vegetarisch","نباتي","سبزی خور"],
  vegan:["Vegano","Vegà","Vegan","Végan","Vegano","Vegan","نباتي صرف","ویگن"],
  menu:["Menú","Menú","Meal","Menu","Menù","Menü","وجبة","مینو"],
  offer:["Oferta","Oferta","Deal","Offre","Offerta","Angebot","عرض","آفر"],
  top:["Favorito","Preferit","Favourite","Favori","Preferito","Beliebt","الأكثر طلباً","پسندیدہ"]
};

const CATS = {
  durum:["Dürüm kebab","Dürüm kebab","Dürüm kebab","Dürüm kebab","Dürüm kebab","Dürüm Kebab","دوروم كباب","دورم کباب"],
  doner:["Döner kebab","Döner kebab","Döner kebab","Döner kebab","Döner kebab","Döner Kebab","دونر كباب","ڈونر کباب"],
  offers:["Ofertas","Ofertes","Deals","Offres","Offerte","Angebote","عروض","آفرز"],
  plates:["Platos combinados","Plats combinats","Combo plates","Assiettes","Piatti combinati","Teller","أطباق","پلیٹیں"],
  tacos:["Taco francés","Taco francès","French tacos","Tacos français","Tacos francesi","French Tacos","تاكو فرنسي","فرنچ ٹاکو"],
  burgers:["Hamburguesas y menús","Hamburgueses i menús","Burgers & meals","Burgers et menus","Hamburger e menù","Burger & Menüs","برغر ووجبات","برگر اور مینو"],
  vegan:["Vegetal","Vegetal","Vegetarian","Végétarien","Vegetariano","Vegetarisch","نباتي","سبزی"],
  sides:["Raciones","Racions","Sides","Accompagnements","Contorni","Beilagen","مقبلات","سائیڈز"],
  salads:["Ensaladas","Amanides","Salads","Salades","Insalate","Salate","سلطات","سلاد"],
  desserts:["Postres","Postres","Desserts","Desserts","Dolci","Desserts","حلويات","میٹھا"],
  drinks:["Bebidas","Begudes","Drinks","Boissons","Bevande","Getränke","مشروبات","مشروبات"]
};

/* Cada plato: id (igual que en Cocina y Caja), precio, nombres [8 idiomas], ingredientes, opción, etiqueta */
const MENU = [
  { cat:"durum", icon:"durum", items:[
    { id:"0-0", p:5.50, n:["Dürüm clásico","Dürüm clàssic","Classic dürüm","Dürüm classique","Dürüm classico","Dürüm Klassik","دوروم كلاسيك","کلاسک دورم"], d:["lettuce","tomato","onion","corn","olive","meat","sauce"], o:"meat", t:"top" },
    { id:"0-1", p:6.00, n:["Dürüm hawaiano","Dürüm hawaià","Hawaiian dürüm","Dürüm hawaïen","Dürüm hawaiano","Dürüm Hawaii","دوروم هاواي","ہوائین دورم"], d:["lettuce","tomato","onion","pineapple","meat","sauce"], o:"meat" },
    { id:"0-2", p:5.50, n:["Dürüm vegetal","Dürüm vegetal","Veggie dürüm","Dürüm végétarien","Dürüm vegetariano","Dürüm vegetarisch","دوروم نباتي","سبزی دورم"], d:["lettuce","tomato","onion","corn","olive","falafel","sauce"], t:"veg" },
    { id:"0-3", p:7.50, n:["Dürüm solo carne","Dürüm només carn","Dürüm meat only","Dürüm 100% viande","Dürüm solo carne","Dürüm nur Fleisch","دوروم لحم فقط","دورم صرف گوشت"], d:["meat","sauce"], o:"meat" },
    { id:"0-4", p:10.90, n:["Dürüm doble","Dürüm doble","Double dürüm","Double dürüm","Dürüm doppio","Doppel-Dürüm","دوروم مزدوج","ڈبل دورم"], d:["doubleMeat","lettuce","tomato","onion","sauce"], o:"meat" },
    { id:"0-5", p:10.50, n:["Menú dürüm","Menú dürüm","Dürüm meal","Menu dürüm","Menù dürüm","Dürüm-Menü","وجبة دوروم","دورم مینو"], d:["fries","drink"], o:"meat", t:"menu" },
    { id:"0-6", p:7.50, n:["Dürüm al horno","Dürüm al forn","Oven-baked dürüm","Dürüm gratiné","Dürüm al forno","Überbackener Dürüm","دوروم بالفرن","اوون دورم"], d:["baked","cheese","fries","meat"], o:"meat" }
  ]},
  { cat:"doner", icon:"box", items:[
    { id:"1-0", p:4.80, n:["Döner clásico","Döner clàssic","Classic döner","Döner classique","Döner classico","Döner Klassik","دونر كلاسيك","کلاسک ڈونر"], d:["lettuce","tomato","onion","corn","olive","meat","sauce"], o:"meat" },
    { id:"1-1", p:5.00, n:["Döner hawaiano","Döner hawaià","Hawaiian döner","Döner hawaïen","Döner hawaiano","Döner Hawaii","دونر هاواي","ہوائین ڈونر"], d:["lettuce","tomato","onion","pineapple","meat","sauce"], o:"meat" },
    { id:"1-2", p:4.50, n:["Döner vegetal","Döner vegetal","Veggie döner","Döner végétarien","Döner vegetariano","Döner vegetarisch","دونر نباتي","سبزی ڈونر"], d:["lettuce","tomato","onion","corn","olive","falafel","sauce"], t:"veg" },
    { id:"1-3", p:6.50, n:["Döner solo carne","Döner només carn","Döner meat only","Döner 100% viande","Döner solo carne","Döner nur Fleisch","دونر لحم فقط","ڈونر صرف گوشت"], d:["meat","sauce"], o:"meat" },
    { id:"1-4", p:9.00, n:["Menú döner","Menú döner","Döner meal","Menu döner","Menù döner","Döner-Menü","وجبة دونر","ڈونر مینو"], d:["fries","drink"], o:"meat", t:"menu" },
    { id:"1-5", p:5.99, n:["Döner box grande","Döner box gran","Döner box (large)","Döner box (grand)","Döner box grande","Döner Box groß","دونر بوكس كبير","ڈونر باکس بڑا"], d:["meat","fries","box"], o:"meat" },
    { id:"1-6", p:4.99, n:["Döner box pequeña","Döner box petita","Döner box (small)","Döner box (petit)","Döner box piccola","Döner Box klein","دونر بوكس صغير","ڈونر باکس چھوٹا"], d:["meat","fries","box"], o:"meat" }
  ]},
  { cat:"offers", icon:"cup", items:[
    { id:"2-0", p:22.90, n:["3 dürüm + Coca-Cola 2 L","3 dürüm + Coca-Cola 2 L","3 dürüm + 2 L Coca-Cola","3 dürüm + Coca-Cola 2 L","3 dürüm + Coca-Cola 2 L","3 Dürüm + Coca-Cola 2 L","3 دوروم + كوكاكولا 2 لتر","3 دورم + کوکا کولا 2 لیٹر"], d:["cola2"], t:"offer", noteHint:true },
    { id:"2-1", p:33.00, n:["5 dürüm + cola 2 L","5 dürüm + cola 2 L","5 dürüm + 2 L cola","5 dürüm + cola 2 L","5 dürüm + cola 2 L","5 Dürüm + Cola 2 L","5 دوروم + كولا 2 لتر","5 دورم + کولا 2 لیٹر"], d:["meat","fries","cola2"], t:"offer", noteHint:true }
  ]},
  { cat:"plates", icon:"tomato", items:[
    { id:"3-0", p:9.90, n:["Plato normal","Plat normal","Regular plate","Assiette classique","Piatto normale","Teller normal","طبق عادي","ریگولر پلیٹ"], d:["salad","fries","doubleMeat"], o:"meat", t:"top" },
    { id:"3-1", p:6.90, n:["Plato pequeño","Plat petit","Small plate","Petite assiette","Piatto piccolo","Kleiner Teller","طبق صغير","چھوٹی پلیٹ"], d:["salad","fries","donerMeat"], o:"meat" },
    { id:"3-2", p:10.00, n:["Plato solo carne","Plat només carn","Meat-only plate","Assiette 100% viande","Piatto solo carne","Teller nur Fleisch","طبق لحم فقط","صرف گوشت پلیٹ"], d:["donerMeat","sauce"], o:"meat" },
    { id:"3-3", p:7.50, n:["Plato de falafel","Plat de falàfel","Falafel plate","Assiette falafel","Piatto di falafel","Falafel-Teller","طبق فلافل","فلافل پلیٹ"], d:["salad","fries","falafel"], t:"veg" },
    { id:"3-4", p:9.90, n:["Plato döner con queso","Plat döner amb formatge","Döner & cheese plate","Assiette döner fromage","Piatto döner al formaggio","Döner-Teller mit Käse","طبق دونر بالجبن","ڈونر چیز پلیٹ"], d:["donerMeat","fries","cheese","baked"], o:"meat" },
    { id:"3-5", p:7.90, n:["Bandeja gratinada","Safata gratinada","Gratin tray","Barquette gratinée","Vaschetta gratinata","Überbackene Schale","صينية بالجبن","گریٹن ٹرے"], d:["fries","donerMeat","mozzarella"], o:"meat" },
    { id:"3-6", p:9.90, n:["Plato gratinado al horno","Plat gratinat al forn","Oven gratin plate","Assiette gratinée au four","Piatto gratinato al forno","Überbackener Teller","طبق مخبوز بالفرن","اوون گریٹن پلیٹ"], d:["cheese","fries","meat"], o:"meat" }
  ]},
  { cat:"tacos", icon:"durum", items:[
    { id:"4-0", p:7.50, n:["Taco francés","Taco francès","French tacos","Tacos","Tacos francese","French Tacos","تاكو فرنسي","فرنچ ٹاکو"], d:["cheese","fries","meat"], o:"meat" },
    { id:"4-1", p:8.90, n:["Taco francés queso","Taco francès formatge","Cheese French tacos","Tacos fromage","Tacos al formaggio","French Tacos Käse","تاكو بالجبن","چیز فرنچ ٹاکو"], d:["extraCheese","fries","meat"], o:"meat" },
    { id:"4-2", p:8.90, n:["Taco francés kebab","Taco francès kebab","Kebab French tacos","Tacos kebab","Tacos kebab","French Tacos Kebab","تاكو كباب","کباب فرنچ ٹاکو"], d:["cheese","fries","donerMeat"], o:"meat" },
    { id:"4-3", p:8.40, n:["Taco francés al horno","Taco francès al forn","Oven-baked French tacos","Tacos gratiné","Tacos al forno","Überbackene French Tacos","تاكو بالفرن","اوون فرنچ ٹاکو"], d:["baked","cheese","meat"], o:"meat" }
  ]},
  { cat:"burgers", icon:"box", items:[
    { id:"5-0", p:4.00, n:["Hamburguesa","Hamburguesa","Burger","Burger","Hamburger","Burger","برغر","برگر"], d:["lettuce","tomato","sauce"], o:"meat2" },
    { id:"5-1", p:7.50, n:["Menú hamburguesa","Menú hamburguesa","Burger meal","Menu burger","Menù hamburger","Burger-Menü","وجبة برغر","برگر مینو"], d:["fries","drink"], o:"meat2", t:"menu" },
    { id:"5-2", p:8.75, n:["Menú 4 alitas de pollo","Menú 4 aletes de pollastre","4 chicken wings meal","Menu 4 ailes de poulet","Menù 4 alette di pollo","Menü 4 Chicken Wings","وجبة 4 أجنحة دجاج","4 چکن ونگز مینو"], d:["fries","salad","drink"], t:"menu" },
    { id:"5-3", p:7.75, n:["Menú 4 nuggets de pollo","Menú 4 nuggets de pollastre","4 chicken nuggets meal","Menu 4 nuggets","Menù 4 nuggets di pollo","Menü 4 Chicken Nuggets","وجبة 4 ناجتس","4 چکن نگٹس مینو"], d:["fries","salad","drink"], t:"menu" },
    { id:"5-4", p:9.90, n:["Menú 3 seekh kebab","Menú 3 seekh kebab","3 seekh kebab meal","Menu 3 seekh kebab","Menù 3 seekh kebab","Menü 3 Seekh Kebab","وجبة 3 سيخ كباب","3 سیخ کباب مینو"], d:["fries","salad","drink"], t:"menu" }
  ]},
  { cat:"vegan", icon:"leaf", items:[
    { id:"6-0", p:6.00, n:["Plato falafel vegano","Plat falàfel vegà","Vegan falafel plate","Assiette falafel végane","Piatto falafel vegano","Veganer Falafel-Teller","طبق فلافل نباتي","ویگن فلافل پلیٹ"], d:["falafel","salad"], t:"vegan" },
    { id:"6-1", p:5.50, n:["Dürüm falafel vegano","Dürüm falàfel vegà","Vegan falafel dürüm","Dürüm falafel végan","Dürüm falafel vegano","Veganer Falafel-Dürüm","دوروم فلافل نباتي","ویگن فلافل دورم"], d:["falafel","lettuce","tomato","onion"], t:"vegan" },
    { id:"6-2", p:4.50, n:["Döner falafel","Döner falàfel","Falafel döner","Döner falafel","Döner falafel","Falafel-Döner","دونر فلافل","فلافل ڈونر"], d:["falafel","lettuce","tomato","sauce"], t:"veg" },
    { id:"6-3", p:7.50, n:["Plato falafel con hummus","Plat falàfel amb hummus","Falafel & hummus plate","Assiette falafel houmous","Piatto falafel e hummus","Falafel-Teller mit Hummus","طبق فلافل مع حمص","فلافل حمص پلیٹ"], d:["falafel","hummus","salad"], t:"vegan" }
  ]},
  { cat:"sides", icon:"chili", items:[
    { id:"7-0", p:5.50, n:["4 alitas + patatas","4 aletes + patates","4 wings + fries","4 ailes + frites","4 alette + patatine","4 Wings + Pommes","4 أجنحة + بطاطس","4 ونگز + فرائز"], d:[] },
    { id:"7-1", p:5.50, n:["4 nuggets + patatas","4 nuggets + patates","4 nuggets + fries","4 nuggets + frites","4 nuggets + patatine","4 Nuggets + Pommes","4 ناجتس + بطاطس","4 نگٹس + فرائز"], d:[] },
    { id:"7-2", p:0.90, n:["Alita de pollo","Aleta de pollastre","Chicken wing","Aile de poulet","Aletta di pollo","Chicken Wing","جناح دجاج","چکن ونگ"], d:["each"] },
    { id:"7-3", p:0.90, n:["Nugget de pollo","Nugget de pollastre","Chicken nugget","Nugget de poulet","Nugget di pollo","Chicken Nugget","ناجت دجاج","چکن نگٹ"], d:["each"] },
    { id:"7-4", p:0.90, n:["Falafel","Falàfel","Falafel","Falafel","Falafel","Falafel","فلافل","فلافل"], d:["each"], t:"vegan" },
    { id:"7-5", p:2.00, n:["Patatas fritas pequeñas","Patates fregides petites","Fries (small)","Frites (petites)","Patatine (piccole)","Pommes (klein)","بطاطس صغيرة","فرائز چھوٹی"], d:[] },
    { id:"7-6", p:3.50, n:["Patatas fritas grandes","Patates fregides grans","Fries (large)","Frites (grandes)","Patatine (grandi)","Pommes (groß)","بطاطس كبيرة","فرائز بڑی"], d:[] },
    { id:"7-7", p:4.00, n:["Patatas bravas","Patates braves","Patatas bravas","Patatas bravas","Patatas bravas","Patatas Bravas","بطاطس براباس","پاتاتاس براواس"], d:["sauce"] },
    { id:"7-8", p:4.00, n:["Patatas deluxe","Patates deluxe","Deluxe potatoes","Pommes deluxe","Patate deluxe","Deluxe-Kartoffeln","بطاطس ديلوكس","ڈیلکس آلو"], d:[] }
  ]},
  { cat:"salads", icon:"leaf", items:[
    { id:"8-0", p:5.50, n:["Ensalada de atún","Amanida de tonyina","Tuna salad","Salade au thon","Insalata di tonno","Thunfischsalat","سلطة تونة","ٹونا سلاد"], d:["lettuce","tomato","onion","tuna","olive"] },
    { id:"8-1", p:3.50, n:["Ensalada mixta","Amanida mixta","Mixed salad","Salade mixte","Insalata mista","Gemischter Salat","سلطة مشكلة","مکس سلاد"], d:["lettuce","tomato","onion","olive"], t:"vegan" },
    { id:"8-2", p:4.50, n:["Ensalada hawaiana","Amanida hawaiana","Hawaiian salad","Salade hawaïenne","Insalata hawaiana","Hawaii-Salat","سلطة هاواي","ہوائین سلاد"], d:["lettuce","tomato","onion","olive","pineapple"], t:"vegan" }
  ]},
  { cat:"desserts", icon:"onion", items:[
    { id:"9-0", p:2.50, n:["Baklava","Baklava","Baklava","Baklava","Baklava","Baklava","بقلاوة","بقلاوہ"], d:["pistachio","butter"] }
  ]},
  { cat:"drinks", icon:"cup", items:[
    { id:"10-0", p:2.70, n:["Refresco","Refresc","Soft drink","Soda","Bibita","Softdrink","مشروب غازي","سافٹ ڈرنک"], d:["can"], o:"soda" },
    { id:"10-1", p:1.00, n:["Agua 50 cl","Aigua 50 cl","Water 50 cl","Eau 50 cl","Acqua 50 cl","Wasser 50 cl","ماء 50 سل","پانی 50 cl"], d:[] },
    { id:"10-2", p:2.70, n:["Agua grande","Aigua gran","Water (large)","Eau (grande)","Acqua (grande)","Wasser (groß)","ماء كبير","پانی بڑا"], d:[] },
    { id:"10-3", p:3.00, n:["Red Bull","Red Bull","Red Bull","Red Bull","Red Bull","Red Bull","ريد بول","ریڈ بل"], d:["can"] }
  ]}
];

/* Notas rápidas: se enseñan en el idioma del cliente, pero a cocina llegan en español (la primera). */
const QUICK_NOTES = [
  ["Sin cebolla","Sense ceba","No onion","Sans oignon","Senza cipolla","Ohne Zwiebeln","بدون بصل","پیاز کے بغیر"],
  ["Sin tomate","Sense tomàquet","No tomato","Sans tomate","Senza pomodoro","Ohne Tomaten","بدون طماطم","ٹماٹر کے بغیر"],
  ["Sin lechuga","Sense enciam","No lettuce","Sans salade","Senza lattuga","Ohne Salat","بدون خس","سلاد پتّا کے بغیر"],
  ["Sin salsa","Sense salsa","No sauce","Sans sauce","Senza salsa","Ohne Soße","بدون صلصة","ساس کے بغیر"],
  ["Salsa aparte","Salsa a part","Sauce on the side","Sauce à part","Salsa a parte","Soße extra dazu","الصلصة جانباً","ساس الگ"],
  ["Picante","Picant","Spicy","Épicé","Piccante","Scharf","حار","تیکھا"],
  ["Sin picante","Sense picant","Not spicy","Pas épicé","Non piccante","Nicht scharf","بدون حار","تیکھا نہیں"]
];

const UI = {
  welcome:["Bienvenido","Benvingut","Welcome","Bienvenue","Benvenuto","Willkommen","أهلاً وسهلاً","خوش آمدید"],
  welcomeSub:["Pide desde la mesa. Te lo traemos recién hecho.","Demana des de la taula. T'ho portem acabat de fer.","Order from your table. We bring it freshly made.","Commandez depuis votre table. On vous l'apporte tout chaud.","Ordina dal tavolo. Te lo portiamo appena fatto.","Bestellen Sie am Tisch. Wir bringen es frisch zubereitet.","اطلب من طاولتك. نحضره لك طازجاً.","اپنی میز سے آرڈر کریں۔ ہم تازہ بنا کر لائیں گے۔"],
  chooseLang:["Elige tu idioma","Tria el teu idioma","Choose your language","Choisissez votre langue","Scegli la lingua","Sprache wählen","اختر لغتك","اپنی زبان منتخب کریں"],
  table:["Mesa","Taula","Table","Table","Tavolo","Tisch","طاولة","میز"],
  callWaiter:["Llamar al camarero","Cridar el cambrer","Call the waiter","Appeler le serveur","Chiama il cameriere","Kellner rufen","نداء النادل","ویٹر کو بلائیں"],
  askBill:["Pedir la cuenta","Demanar el compte","Ask for the bill","Demander l'addition","Chiedi il conto","Rechnung bitte","طلب الحساب","بل منگوائیں"],
  yourOrder:["Tu pedido","La teva comanda","Your order","Votre commande","Il tuo ordine","Ihre Bestellung","طلبك","آپ کا آرڈر"],
  empty:["Toca un plato para añadirlo","Toca un plat per afegir-lo","Tap a dish to add it","Touchez un plat pour l'ajouter","Tocca un piatto per aggiungerlo","Tippen Sie auf ein Gericht","المس طبقاً لإضافته","کسی ڈش کو چھو کر شامل کریں"],
  send:["Enviar a cocina","Enviar a cuina","Send to kitchen","Envoyer en cuisine","Invia in cucina","An die Küche senden","أرسل إلى المطبخ","کچن کو بھیجیں"],
  total:["Total","Total","Total","Total","Totale","Gesamt","المجموع","کل"],
  add:["Añadir","Afegir","Add","Ajouter","Aggiungi","Hinzufügen","أضف","شامل کریں"],
  note:["Algo para cocina","Alguna cosa per a cuina","Anything for the kitchen?","Une précision pour la cuisine ?","Qualcosa per la cucina?","Hinweis für die Küche","ملاحظة للمطبخ","کچن کے لیے کچھ؟"],
  notePh:["Escribe aquí (opcional)","Escriu aquí (opcional)","Write here (optional)","Écrivez ici (facultatif)","Scrivi qui (facoltativo)","Hier schreiben (optional)","اكتب هنا (اختياري)","یہاں لکھیں (اختیاری)"],
  offerHint:["Dinos las carnes que quieres (pollo, ternera o mixto)","Digues-nos les carns (pollastre, vedella o mixt)","Tell us which meats (chicken, beef or mixed)","Dites-nous les viandes (poulet, bœuf ou mixte)","Dicci le carni (pollo, manzo o misto)","Welches Fleisch? (Hähnchen, Rind oder gemischt)","أخبرنا باللحوم (دجاج، بقر أو مشكل)","گوشت بتائیں (چکن، بیف یا مکس)"],
  qty:["Cantidad","Quantitat","Quantity","Quantité","Quantità","Menge","الكمية","تعداد"],
  confirmTitle:["¿Enviamos el pedido a cocina?","Enviem la comanda a cuina?","Send this order to the kitchen?","On envoie la commande en cuisine ?","Inviamo l'ordine in cucina?","Bestellung an die Küche senden?","هل نرسل الطلب إلى المطبخ؟","کیا آرڈر کچن بھیج دیں؟"],
  confirmYes:["Sí, enviar","Sí, enviar","Yes, send","Oui, envoyer","Sì, invia","Ja, senden","نعم، أرسل","ہاں، بھیجیں"],
  keepOrdering:["Seguir pidiendo","Continuar demanant","Keep ordering","Continuer","Continua a ordinare","Weiter bestellen","متابعة الطلب","مزید آرڈر کریں"],
  sentTitle:["¡Pedido enviado!","Comanda enviada!","Order sent!","Commande envoyée !","Ordine inviato!","Bestellung gesendet!","تم إرسال الطلب!","آرڈر بھیج دیا گیا!"],
  sentSub:["Ya está en cocina. Te lo llevamos a la mesa.","Ja és a cuina. T'ho portem a la taula.","It's in the kitchen. We'll bring it to your table.","C'est en cuisine. On vous l'apporte à table.","È in cucina. Te lo portiamo al tavolo.","Sie ist in der Küche. Wir bringen sie an Ihren Tisch.","طلبك في المطبخ. سنحضره إلى طاولتك.","آرڈر کچن میں ہے۔ ہم آپ کی میز پر لائیں گے۔"],
  ok:["Vale","D'acord","OK","D'accord","Ok","OK","حسناً","ٹھیک ہے"],
  ordered:["Ya pedido en esta mesa","Ja demanat en aquesta taula","Already ordered at this table","Déjà commandé à cette table","Già ordinato a questo tavolo","Bereits an diesem Tisch bestellt","طُلب مسبقاً على هذه الطاولة","اس میز پر پہلے سے آرڈر"],
  waiterSent:["Un camarero viene enseguida","Un cambrer ve de seguida","A waiter is on the way","Un serveur arrive","Arriva subito un cameriere","Ein Kellner kommt gleich","النادل في الطريق","ویٹر ابھی آ رہا ہے"],
  billSent:["Te traemos la cuenta","Et portem el compte","We'll bring you the bill","On vous apporte l'addition","Ti portiamo il conto","Die Rechnung kommt gleich","سنحضر لك الحساب","بل ابھی لاتے ہیں"],
  wait:["Ya lo hemos avisado, un momento","Ja ho hem avisat, un moment","Already on its way, one moment","C'est déjà demandé, un instant","Già avvisato, un momento","Schon Bescheid gegeben, einen Moment","تم الإبلاغ، لحظة من فضلك","اطلاع دے دی گئی ہے، ایک لمحہ"],
  error:["No se ha podido enviar. Avisa a un camarero.","No s'ha pogut enviar. Avisa un cambrer.","Couldn't send. Please call a waiter.","Envoi impossible. Appelez un serveur.","Invio non riuscito. Chiama un cameriere.","Senden fehlgeschlagen. Bitte Kellner rufen.","تعذّر الإرسال. نادِ النادل.","نہیں بھیجا جا سکا۔ ویٹر کو بلائیں۔"],
  demo:["Demo: en la tablet real el pedido llega a cocina","Demo: a la tauleta real arriba a cuina","Demo: on the real tablet it reaches the kitchen","Démo : sur la vraie tablette, ça arrive en cuisine","Demo: sul tablet reale arriva in cucina","Demo: am echten Tablet geht es an die Küche","عرض تجريبي: في الجهاز الحقيقي يصل الطلب للمطبخ","ڈیمو: اصل ٹیبلٹ پر آرڈر کچن جاتا ہے"],
  prices:["Precios con IVA incluido","Preus amb IVA inclòs","Prices include VAT","Prix TTC","Prezzi IVA inclusa","Preise inkl. MwSt.","الأسعار تشمل الضريبة","قیمتوں میں ٹیکس شامل ہے"],
  viewOrder:["Ver pedido","Veure comanda","View order","Voir la commande","Vedi ordine","Bestellung ansehen","عرض الطلب","آرڈر دیکھیں"],
  changeLang:["Idioma","Idioma","Language","Langue","Lingua","Sprache","اللغة","زبان"],
  remove:["Quitar","Treure","Remove","Retirer","Rimuovi","Entfernen","إزالة","ہٹائیں"],
  start:["Empezar","Començar","Start","Commencer","Inizia","Starten","ابدأ","شروع کریں"],
  halal:["100% halal","100% halal","100% halal","100% halal","100% halal","100% halal","حلال 100%","100% حلال"]
};
