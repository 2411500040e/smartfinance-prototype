async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Gagal load ${path}`);
  return await res.json();
}

const state = { screens: [], byKey: new Map(), history: [], future: [], currentKey: null, flow: {}, homeKey: null };

function prettyName(key){ return key.replaceAll("_", " "); }

function setDevice(isMobile){
  const frame = document.getElementById("deviceFrame");
  frame.classList.toggle("mobile", isMobile);
  frame.classList.toggle("desktop", !isMobile);
}

function renderList(filter=""){
  const list = document.getElementById("screenList");
  list.innerHTML = "";
  const f = filter.trim().toLowerCase();
  const items = state.screens
    .filter(s => !f || s.key.toLowerCase().includes(f) || s.file.toLowerCase().includes(f))
    .sort((a,b)=>a.key.localeCompare(b.key));

  for(const s of items){
    const div = document.createElement("div");
    div.className = "screen-item" + (s.key===state.currentKey ? " active" : "");
    div.onclick = ()=>goTo(s.key, true);
    div.innerHTML = `<div class="screen-name">${prettyName(s.key)}</div><div class="screen-file">${s.file}</div>`;
    list.appendChild(div);
  }
}

function renderFlowButtons(){
  const wrap = document.getElementById("flowButtons");
  wrap.innerHTML = "";
  const next = state.flow[state.currentKey] || [];
  if(next.length === 0){
    wrap.innerHTML = `<div class="small">Tidak ada flow yang didefinisikan untuk screen ini. Edit <code>flow.json</code>.</div>`;
    return;
  }
  for(const k of next){
    const btn = document.createElement("button");
    btn.className = "flow-btn";
    btn.textContent = prettyName(k);
    btn.onclick = ()=>goTo(k, true);
    wrap.appendChild(btn);
  }
}

function setScreen(key, pushHistory=false){
  const s = state.byKey.get(key);
  if(!s) return alert(`Screen tidak ditemukan: ${key}`);

  if(pushHistory && state.currentKey){
    state.history.push(state.currentKey);
    state.future = [];
  }
  state.currentKey = key;

  document.getElementById("screenTitle").textContent = prettyName(key);
  document.getElementById("screenImg").src = `screens/${s.file}`;

  renderList(document.getElementById("search").value || "");
  renderFlowButtons();
}

function goTo(key, pushHistory){ setScreen(key, pushHistory); }
function back(){
  if(state.history.length === 0) return;
  const prev = state.history.pop();
  if(state.currentKey) state.future.push(state.currentKey);
  setScreen(prev, false);
}
function forward(){
  if(state.future.length === 0) return;
  const next = state.future.pop();
  if(state.currentKey) state.history.push(state.currentKey);
  setScreen(next, false);
}
function home(){ if(state.homeKey) goTo(state.homeKey, true); }

async function main(){
  const screens = await loadJSON("screens.json");
  state.screens = screens;
  for(const s of screens) state.byKey.set(s.key, s);

  const flow = await loadJSON("flow.json");
  state.flow = flow;
  state.homeKey = flow._home || (screens[0]?.key ?? null);

  document.getElementById("btnBack").onclick = back;
  document.getElementById("btnForward").onclick = forward;
  document.getElementById("btnHome").onclick = home;

  document.getElementById("search").addEventListener("input", (e)=>renderList(e.target.value));
  document.getElementById("deviceToggle").addEventListener("change", (e)=>setDevice(e.target.checked));

  document.addEventListener("keydown", (e)=>{
    if(e.key === "ArrowLeft") back();
    if(e.key === "ArrowRight") forward();
  });

  setDevice(false);
  setScreen(state.homeKey, false);
}

main().catch(err=>{
  console.error(err);
  alert("Gagal load file. Pastikan: screens.json & flow.json ada, dan buka via server lokal (lihat README).");
});
