/* ===================== CARTA ALI DONER KEBAB (ES / EN / UR) =====================
   Todo lo prepara Cocina. "group" solo sirve para agrupar la carta en pantalla
   (Comida / Bebidas). Los artículos con "extras" abren un selector al añadirlos
   (carne, refresco...). Para cambiar un precio, edita "price". */
const MEAT3 = { es:["Pollo","Ternera","Mixto"], en:["Chicken","Beef","Mixed"], ur:["چکن","بیف","مکس"] };
const MEAT2 = { es:["Pollo","Ternera"], en:["Chicken","Beef"], ur:["چکن","بیف"] };
const SODAS = {
  es:["Coca-Cola","Coca-Cola Zero","Fanta","Nestea","Sprite"],
  en:["Coca-Cola","Coca-Cola Zero","Fanta","Nestea","Sprite"],
  ur:["کوکا کولا","کوکا کولا زیرو","فانٹا","نیسٹی","سپرائٹ"]
};
const G_COMIDA  = {es:"Comida", en:"Food",   ur:"کھانا"};
const G_BEBIDAS = {es:"Bebidas",en:"Drinks", ur:"مشروبات"};
const NOTE_MEATS = { es:" · carnes en 📝 nota", en:" · meats in 📝 note", ur:" · گوشت 📝 نوٹ میں" };

const MENU_SRC = [
  { group:G_COMIDA, cat:{es:"Dürüm kebab",en:"Dürüm kebab",ur:"دورم کباب"}, items:[
    { price:5.50, es:["Dürüm clásico","Lechuga, tomate, cebolla, maíz, oliva, carne y salsa"], en:["Classic dürüm","Lettuce, tomato, onion, corn, olive, meat and sauce"], ur:["کلاسک دورم","سلاد، ٹماٹر، پیاز، مکئی، زیتون، گوشت، ساس"], extras:MEAT3 },
    { price:6.00, es:["Dürüm hawaiano","Lechuga, tomate, cebolla, piña, carne y salsa"], en:["Hawaiian dürüm","Lettuce, tomato, onion, pineapple, meat and sauce"], ur:["ہوائین دورم","سلاد، ٹماٹر، پیاز، انناس، گوشت، ساس"], extras:MEAT3 },
    { price:5.50, es:["Dürüm vegetal","Lechuga, tomate, cebolla, maíz, oliva, falafel y salsa"], en:["Veggie dürüm","Lettuce, tomato, onion, corn, olive, falafel and sauce"], ur:["سبزی دورم","سلاد، ٹماٹر، پیاز، مکئی، زیتون، فلافل، ساس"] },
    { price:7.50, es:["Dürüm solo carne",""], en:["Dürüm meat only",""], ur:["دورم صرف گوشت",""], extras:MEAT3 },
    { price:10.90, es:["Dürüm doble",""], en:["Double dürüm",""], ur:["ڈبل دورم",""], extras:MEAT3 },
    { price:10.50, es:["Menú dürüm","Dürüm + patatas + bebida"], en:["Dürüm meal","Dürüm + fries + drink"], ur:["دورم مینو","دورم + فرائز + ڈرنک"], extras:MEAT3 },
    { price:7.50, es:["Dürüm al horno","Gratinado con queso, patatas y carne"], en:["Oven-baked dürüm","Baked with cheese, fries and meat"], ur:["اوون دورم","پنیر، فرائز، گوشت"], extras:MEAT3 },
  ]},
  { group:G_COMIDA, cat:{es:"Döner kebab",en:"Döner kebab",ur:"ڈونر کباب"}, items:[
    { price:4.80, es:["Döner clásico","Lechuga, tomate, cebolla, maíz, oliva, carne y salsa"], en:["Classic döner","Lettuce, tomato, onion, corn, olive, meat and sauce"], ur:["کلاسک ڈونر","سلاد، ٹماٹر، پیاز، مکئی، زیتون، گوشت، ساس"], extras:MEAT3 },
    { price:5.00, es:["Döner hawaiano","Lechuga, tomate, cebolla, piña, carne y salsa"], en:["Hawaiian döner","Lettuce, tomato, onion, pineapple, meat and sauce"], ur:["ہوائین ڈونر","سلاد، ٹماٹر، پیاز، انناس، گوشت، ساس"], extras:MEAT3 },
    { price:4.50, es:["Döner vegetal","Lechuga, tomate, cebolla, maíz, oliva, falafel y salsa"], en:["Veggie döner","Lettuce, tomato, onion, corn, olive, falafel and sauce"], ur:["سبزی ڈونر","سلاد، ٹماٹر، پیاز، مکئی، زیتون، فلافل، ساس"] },
    { price:6.50, es:["Döner solo carne",""], en:["Döner meat only",""], ur:["ڈونر صرف گوشت",""], extras:MEAT3 },
    { price:9.00, es:["Menú döner","Döner + patatas + bebida"], en:["Döner meal","Döner + fries + drink"], ur:["ڈونر مینو","ڈونر + فرائز + ڈرنک"], extras:MEAT3 },
    { price:5.99, es:["Döner box grande","Carne y patatas"], en:["Döner box (large)","Meat and fries"], ur:["ڈونر باکس (بڑا)","گوشت اور فرائز"], extras:MEAT3 },
    { price:4.99, es:["Döner box pequeña","Carne y patatas"], en:["Döner box (small)","Meat and fries"], ur:["ڈونر باکس (چھوٹا)","گوشت اور فرائز"], extras:MEAT3 },
  ]},
  { group:G_COMIDA, cat:{es:"Ofertas",en:"Deals",ur:"آفرز"}, items:[
    { price:22.90, es:["3 dürüm + Coca-Cola 2 L","Pollo, ternera o mixto"+NOTE_MEATS.es], en:["3 dürüm + 2 L Coca-Cola","Chicken, beef or mixed"+NOTE_MEATS.en], ur:["3 دورم + 2 لیٹر کولا",NOTE_MEATS.ur] },
    { price:33.00, es:["5 dürüm + cola 2 L","Solo carne y patatas"+NOTE_MEATS.es], en:["5 dürüm + 2 L cola","Meat and fries only"+NOTE_MEATS.en], ur:["5 دورم + 2 لیٹر کولا","صرف گوشت اور فرائز"+NOTE_MEATS.ur] },
  ]},
  { group:G_COMIDA, cat:{es:"Platos combinados",en:"Combo plates",ur:"کومبو پلیٹ"}, items:[
    { price:9.90, es:["Plato normal","Ensalada, patatas fritas y carne de döner doble"], en:["Regular plate","Salad, fries and double döner meat"], ur:["ریگولر پلیٹ","سلاد، فرائز، ڈبل ڈونر گوشت"], extras:MEAT3 },
    { price:6.90, es:["Plato pequeño","Ensalada, patatas fritas y carne de döner"], en:["Small plate","Salad, fries and döner meat"], ur:["چھوٹی پلیٹ","سلاد، فرائز، ڈونر گوشت"], extras:MEAT3 },
    { price:10.00, es:["Plato solo carne",""], en:["Meat-only plate",""], ur:["صرف گوشت پلیٹ",""], extras:MEAT3 },
    { price:7.50, es:["Plato de falafel","Ensalada, patatas fritas y falafel"], en:["Falafel plate","Salad, fries and falafel"], ur:["فلافل پلیٹ","سلاد، فرائز، فلافل"] },
    { price:9.90, es:["Plato döner con queso","Carne de döner, patatas y queso al horno"], en:["Döner & cheese plate","Döner meat, fries and baked cheese"], ur:["ڈونر چیز پلیٹ","ڈونر گوشت، فرائز، پنیر"], extras:MEAT3 },
    { price:7.90, es:["Bandeja gratinada","Patatas, carne de döner y mozzarella"], en:["Gratin tray","Fries, döner meat and mozzarella"], ur:["گریٹن ٹرے","فرائز، ڈونر گوشت، موزریلا"], extras:MEAT3 },
    { price:9.90, es:["Plato gratinado al horno","Queso, patatas y carne"], en:["Oven gratin plate","Cheese, fries and meat"], ur:["اوون گریٹن پلیٹ","پنیر، فرائز، گوشت"], extras:MEAT3 },
  ]},
  { group:G_COMIDA, cat:{es:"Taco francés",en:"French tacos",ur:"فرنچ ٹاکو"}, items:[
    { price:7.50, es:["Taco francés normal","Queso, patatas y carne"], en:["French tacos","Cheese, fries and meat"], ur:["فرنچ ٹاکو","پنیر، فرائز، گوشت"], extras:MEAT3 },
    { price:8.90, es:["Taco francés queso","Extra de queso"], en:["Cheese French tacos","Extra cheese"], ur:["چیز فرنچ ٹاکو","اضافی پنیر"], extras:MEAT3 },
    { price:8.90, es:["Taco francés kebab","Queso, patatas y carne de kebab"], en:["Kebab French tacos","Cheese, fries and kebab meat"], ur:["کباب فرنچ ٹاکو","پنیر، فرائز، کباب گوشت"], extras:MEAT3 },
    { price:8.40, es:["Taco francés al horno","Gratinado con queso"], en:["Oven-baked French tacos","Baked with cheese"], ur:["اوون فرنچ ٹاکو","پنیر کے ساتھ"], extras:MEAT3 },
  ]},
  { group:G_COMIDA, cat:{es:"Hamburguesas y menús",en:"Burgers & meals",ur:"برگر اور مینو"}, items:[
    { price:4.00, es:["Hamburguesa",""], en:["Burger",""], ur:["برگر",""], extras:MEAT2 },
    { price:7.50, es:["Menú hamburguesa","Hamburguesa + patatas + bebida"], en:["Burger meal","Burger + fries + drink"], ur:["برگر مینو","برگر + فرائز + ڈرنک"], extras:MEAT2 },
    { price:8.75, es:["Menú 4 alitas de pollo","Patatas, ensalada y bebida"], en:["4 chicken wings meal","Fries, salad and drink"], ur:["4 چکن ونگز مینو","فرائز، سلاد، ڈرنک"] },
    { price:7.75, es:["Menú 4 nuggets de pollo","Patatas, ensalada y bebida"], en:["4 chicken nuggets meal","Fries, salad and drink"], ur:["4 چکن نگٹس مینو","فرائز، سلاد، ڈرنک"] },
    { price:9.90, es:["Menú 3 seekh kebab","Patatas, ensalada y bebida"], en:["3 seekh kebab meal","Fries, salad and drink"], ur:["3 سیخ کباب مینو","فرائز، سلاد، ڈرنک"] },
  ]},
  { group:G_COMIDA, cat:{es:"Vegetal",en:"Vegan",ur:"سبزی"}, items:[
    { price:6.00, es:["Plato falafel vegano",""], en:["Vegan falafel plate",""], ur:["ویگن فلافل پلیٹ",""] },
    { price:5.50, es:["Dürüm falafel vegano",""], en:["Vegan falafel dürüm",""], ur:["ویگن فلافل دورم",""] },
    { price:4.50, es:["Döner falafel",""], en:["Falafel döner",""], ur:["فلافل ڈونر",""] },
    { price:7.50, es:["Plato falafel con hummus","Falafel, puré de garbanzos y ensalada"], en:["Falafel & hummus plate","Falafel, hummus and salad"], ur:["فلافل حمص پلیٹ","فلافل، حمص، سلاد"] },
  ]},
  { group:G_COMIDA, cat:{es:"Raciones",en:"Sides",ur:"سائیڈز"}, items:[
    { price:5.50, es:["4 alitas + patatas",""], en:["4 wings + fries",""], ur:["4 ونگز + فرائز",""] },
    { price:5.50, es:["4 nuggets + patatas",""], en:["4 nuggets + fries",""], ur:["4 نگٹس + فرائز",""] },
    { price:0.90, es:["Alita de pollo","Unidad"], en:["Chicken wing","Each"], ur:["چکن ونگ","ایک"] },
    { price:0.90, es:["Nugget de pollo","Unidad"], en:["Chicken nugget","Each"], ur:["چکن نگٹ","ایک"] },
    { price:0.90, es:["Falafel","Unidad"], en:["Falafel","Each"], ur:["فلافل","ایک"] },
    { price:2.00, es:["Patatas fritas pequeñas",""], en:["Fries (small)",""], ur:["فرائز (چھوٹی)",""] },
    { price:3.50, es:["Patatas fritas grandes",""], en:["Fries (large)",""], ur:["فرائز (بڑی)",""] },
    { price:4.00, es:["Patatas bravas",""], en:["Patatas bravas",""], ur:["پاتاتاس براواس",""] },
    { price:4.00, es:["Patatas deluxe",""], en:["Deluxe potatoes",""], ur:["ڈیلکس آلو",""] },
  ]},
  { group:G_COMIDA, cat:{es:"Ensaladas",en:"Salads",ur:"سلاد"}, items:[
    { price:5.50, es:["Ensalada de atún","Lechuga, tomate, cebolla, atún, aceitunas"], en:["Tuna salad","Lettuce, tomato, onion, tuna, olives"], ur:["ٹونا سلاد",""] },
    { price:3.50, es:["Ensalada mixta","Lechuga, tomate, cebolla, aceitunas"], en:["Mixed salad","Lettuce, tomato, onion, olives"], ur:["مکس سلاد",""] },
    { price:4.50, es:["Ensalada hawaiana","Lechuga, tomate, cebolla, aceitunas, piña"], en:["Hawaiian salad","Lettuce, tomato, onion, olives, pineapple"], ur:["ہوائین سلاد",""] },
  ]},
  { group:G_COMIDA, cat:{es:"Postres",en:"Desserts",ur:"میٹھا"}, items:[
    { price:2.50, es:["Baklava","Pistacho y mantequilla"], en:["Baklava","Pistachio and butter"], ur:["بقلاوہ","پستہ، مکھن"] },
  ]},
  { group:G_BEBIDAS, cat:{es:"Bebidas",en:"Drinks",ur:"مشروبات"}, items:[
    { price:2.70, es:["Refresco","Lata"], en:["Soft drink","Can"], ur:["سافٹ ڈرنک","کین"], extras:SODAS },
    { price:1.00, es:["Agua 50 cl",""], en:["Water 50 cl",""], ur:["پانی 50 cl",""] },
    { price:2.70, es:["Agua grande",""], en:["Water (large)",""], ur:["پانی (بڑا)",""] },
    { price:3.00, es:["Red Bull",""], en:["Red Bull",""], ur:["ریڈ بل",""] },
  ]},
];
