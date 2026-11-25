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
function renderCalendar(){
  const host=$("calendar");host.replaceChildren();const map=new Map(availableStories.map(s=>[s.day_number,s]));
  for(let day=1;day<=25;day++){
    const story=map.get(day),b=document.createElement("button");b.type="button";b.className=`door ${story?"available":""}`;b.disabled=!story;
    const n=document.createElement("span");n.className="door-number";n.textContent=pad(day);
    const arabic=document.createElement("span");arabic.className="door-script";arabic.lang="ar";arabic.dir="rtl";arabic.textContent=String(day).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[Number(d)]);
    const mark=document.createElement("span");mark.className="door-symbol";mark.setAttribute("aria-hidden","true");mark.textContent=story?"✧":"✦";
    b.setAttribute("aria-label",`Puerta ${day}${story?": abrir relato":" : todavía sellada"}`);
    b.append(n,arabic,mark);if(story)b.addEventListener("click",()=>openStory(story));host.append(b);
  }
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