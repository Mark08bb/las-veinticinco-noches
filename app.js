import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = "https://dbmgznabzkrefmkruglr.supabase.co";
const PUBLIC_KEY = "sb_publishable_-G67yTfIxDqLaLJS5XFgTA_e8ADvn3h";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/editor-desk`;
const supabase = createClient(SUPABASE_URL, PUBLIC_KEY);
const $ = id => document.getElementById(id);
let availableStories = [], editorStories = [], selectedDay = 1;
let editorToken = sessionStorage.getItem("editor-session") || "";
const pad = n => String(n).padStart(2, "0");
const dateLabel = v => new Intl.DateTimeFormat("es-ES", {dateStyle:"long",timeStyle:"short"}).format(new Date(v));
const toLocalInput = v => { if(!v)return ""; const d=new Date(v); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function showModal(id){$(id).classList.remove("hidden");document.body.style.overflow="hidden";}
function hideModal(id){$(id).classList.add("hidden");if($("story-modal").classList.contains("hidden")&&$("editor-modal").classList.contains("hidden"))document.body.style.overflow="";}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>hideModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)hideModal(m.id);}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){hideModal("story-modal");hideModal("editor-modal");}});

async function loadCalendar(){
  try{
    const {data,error}=await supabase.from("stories").select("day_number,title,act,body,image_url,opens_at").order("day_number");
    if(error)throw error; availableStories=data||[]; renderCalendar();
  }catch(err){$("calendar").innerHTML='<p class="loading-note">El manuscrito no ha podido abrirse. Inténtalo de nuevo dentro de un momento.</p>';console.error(err);}
}
const ACTS = [
 {roman:"I",name:"Curiosidad",first:1,last:5,line:"Toda historia empieza por una pregunta mal hecha. Aquí empiezan las nuestras."},
 {roman:"II",name:"Conocimiento",first:6,last:10,line:"Lo que se aprende de noche se copia dos veces: una en el papel y otra en la memoria."},
 {roman:"III",name:"Verano",first:11,last:15,line:"Ni en Constantinopla dura siempre el invierno. En estas páginas entra el calor."},
 {roman:"IV",name:"Fantasía y realidad",first:16,last:20,line:"El Genio jura que todo esto es verdad. Yo, que soy copista, sólo juro que está escrito."},
 {roman:"V",name:"Revelación",first:21,last:25,line:"Lo que admiré en cada personaje no era suyo: lo tomé prestado de alguien. En estas noches lo devuelvo."}
];
const ARCH_PATH="M6 150 V64 C6 40 28 24 50 4 C72 24 94 40 94 64 V150 Z";
const ARCH_INNER_PATH="M14 150 V66 C14 46 32 32 50 15 C68 32 86 46 86 66 V150";
const arabicDigits=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[Number(d)]);
function makeDoor(day,story){
 const b=document.createElement("button");b.type="button";b.className=`door ${story?"available":"sealed"}`;b.disabled=!story;
 b.setAttribute("aria-label",`Puerta ${day}${story?": abrir relato":": todavía sellada"}`);
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 100 150");svg.setAttribute("class","door-frame");svg.setAttribute("aria-hidden","true");
 svg.innerHTML=`<defs><linearGradient id="door-g-${day}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${story?"#1d3974":"#10234d"}"/><stop offset="100%" stop-color="#050d20"/></linearGradient></defs><path d="${ARCH_PATH}" fill="url(#door-g-${day})"/><path d="${ARCH_PATH}" fill="none" stroke="${story?"#e7d39c":"#806c49"}" stroke-width="${story?"3":"2"}"/><path d="${ARCH_INNER_PATH}" fill="none" stroke="#bfa36a" stroke-opacity=".72" stroke-width="1"/><circle cx="50" cy="30" r="4" fill="${story?"#e7d39c":"#806c49"}"/><circle cx="50" cy="30" r="1.6" fill="#76aaa8"/>`;
 const n=document.createElement("span");n.className="door-number";n.textContent=String(day);
 const ar=document.createElement("span");ar.className="door-script";ar.lang="ar";ar.dir="rtl";ar.textContent=arabicDigits(day);
 const mark=document.createElement("span");mark.className="door-symbol";mark.setAttribute("aria-hidden","true");mark.textContent=story?"✧":"♙";
 const caption=document.createElement("span");caption.className="door-caption";caption.textContent=story?(story.title||"Abrir historia"):"Sellada";
 b.append(svg,n,ar,mark,caption);if(story)b.addEventListener("click",()=>openStory(story));return b;
}
function renderCalendar(){
 const host=$("calendar");host.replaceChildren();const map=new Map(availableStories.map(s=>[s.day_number,s]));
 ACTS.forEach(act=>{const section=document.createElement("section");section.className="act-section";
 const heading=document.createElement("div");heading.className="act-heading";
 const kicker=document.createElement("div");kicker.className="act-kicker";const left=document.createElement("span"),right=document.createElement("span"),label=document.createElement("b");label.textContent=`Acto ${act.roman}`;kicker.append(left,label,right);
 const title=document.createElement("h3");title.textContent=act.name;const line=document.createElement("p");line.textContent=`«${act.line}»`;heading.append(kicker,title,line);
 const grid=document.createElement("div");grid.className="calendar-grid";for(let day=act.first;day<=act.last;day++)grid.append(makeDoor(day,map.get(day)));
 section.append(heading,grid);host.append(section);});
}
async function openStory(story){
  const {error}=await supabase.from("story_openings").insert({day_number:story.day_number});
  if(error)console.warn("No se pudo registrar la apertura:",error.message);
  $("story-day").textContent=`Puerta ${pad(story.day_number)} · ${story.act||"Un relato"}`;
  $("story-title").textContent=story.title;$("story-act").textContent=story.image_url?"Una historia del manuscrito":"";
  const copy=$("story-copy");copy.replaceChildren();
  if(story.image_url){const img=document.createElement("img");img.src=story.image_url;img.alt="";img.loading="lazy";img.referrerPolicy="no-referrer";copy.append(img);}
  for(const part of String(story.body||"Esta puerta ya está abierta, pero Mehmed todavía no ha terminado de copiar su historia.").split(/\n{2,}/)){
    const p=document.createElement("p");p.textContent=part;copy.append(p);
  }
  showModal("story-modal");
}
$("editor-key").addEventListener("click",()=>{showModal("editor-modal");if(editorToken)loadEditor();});
async function editorRequest(action,extra={}){
  const res=await fetch(FUNCTION_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":PUBLIC_KEY,...(editorToken?{"Authorization":`Bearer ${editorToken}`}:{})},body:JSON.stringify({action,...extra})});
  const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"No se pudo completar la operación.");return data;
}
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("login-error").textContent="";
  try{const r=await editorRequest("login",{key:$("editor-password").value});editorToken=r.token;sessionStorage.setItem("editor-session",editorToken);$("editor-password").value="";await loadEditor();}
  catch(err){$("login-error").textContent=err.message;}
});
async function loadEditor(){
  try{
    const r=await editorRequest("list");
    editorStories=(r.stories||[]).sort((a,b)=>a.day_number-b.day_number);
    $("editor-login").classList.add("hidden");
    $("editor-workspace").classList.remove("hidden");
    if(!editorStories.some(s=>s.day_number===selectedDay))selectedDay=1;
    renderEditorDoorList();fillEditor();
  }catch(err){
    if(/sesión|caducada/i.test(err.message))logoutEditor();
    else $("login-error").textContent=err.message;
  }
}
function renderEditorDoorList(){
  const host=$("editor-door-list");host.replaceChildren();
  for(let day=1;day<=25;day++){
    const s=editorStories.find(x=>x.day_number===day);
    const button=document.createElement("button");button.type="button";button.className="editor-door"+(day===selectedDay?" active":"");
    const num=document.createElement("span");num.className="door-num";num.textContent=pad(day);
    const title=document.createElement("span");title.className="editor-door-title";title.textContent=s?.title||"Sin título";
    const state=document.createElement("span");state.className="door-state";
    state.textContent=!s?"—":(s.is_published?(s.opens_at&&new Date(s.opens_at)>new Date()?"◷":"✧"):"✎");
    button.append(num,title,state);
    button.addEventListener("click",()=>{selectedDay=day;renderEditorDoorList();fillEditor();});
    host.append(button);
  }
}
function fillEditor(){
  const s=editorStories.find(x=>x.day_number===selectedDay);if(!s)return;
  $("edit-title").value=s.title||"";$("edit-act").value=s.act||"";$("edit-synopsis").value=s.synopsis||"";$("edit-body").value=s.body||"";
  $("edit-image").value=s.image_url||"";$("edit-opens").value=toLocalInput(s.opens_at);$("edit-published").checked=!!s.is_published;$("save-status").textContent="";
}
$("story-form").addEventListener("submit",async e=>{
  e.preventDefault();$("save-status").textContent="Guardando…";
  try{
    const dt=$("edit-opens").value;
    const r=await editorRequest("save",{day_number:selectedDay,title:$("edit-title").value,act:$("edit-act").value,synopsis:$("edit-synopsis").value,body:$("edit-body").value,image_url:$("edit-image").value||null,opens_at:dt?new Date(dt).toISOString():null,is_published:$("edit-published").checked});
    editorStories=editorStories.map(s=>s.day_number===selectedDay?r.story:s);renderEditorDoorList();
    $("save-status").textContent="La puerta se ha guardado correctamente.";await loadCalendar();
  }catch(err){$("save-status").textContent=err.message;}
});
$("show-openings").addEventListener("click",async()=>{
  const panel=$("openings-panel");panel.classList.toggle("hidden");if(panel.classList.contains("hidden"))return;
  const list=$("openings-list");list.textContent="Consultando…";
  try{
    const r=await editorRequest("openings");list.replaceChildren();
    if(!r.openings.length){list.textContent="Todavía no se ha abierto ninguna puerta.";return;}
    for(const o of r.openings){const row=document.createElement("div");row.className="opening-row";const day=document.createElement("strong");day.textContent=`Puerta ${pad(o.day_number)}`;const date=document.createElement("span");date.textContent=dateLabel(o.opened_at);row.append(day,date);list.append(row);}
  }catch(err){list.textContent=err.message;}
});
function logoutEditor(){editorToken="";sessionStorage.removeItem("editor-session");$("editor-workspace").classList.add("hidden");$("editor-login").classList.remove("hidden");$("login-error").textContent="La sesión se ha cerrado.";}
$("editor-logout").addEventListener("click",logoutEditor);
loadCalendar();