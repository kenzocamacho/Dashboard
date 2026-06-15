if (typeof RAW === "undefined") {
  console.error("data.js não foi carregado: inclua <script src=\"data.js\"></script> antes de script.js.");
}

const C = {green:"#2E8B5E", amber:"#D88A2E", red:"#D45B5B", accent:"#2E7D5B", muted:"#697A70", grid:"#E9EDE9", border:"#E0E5DF"};
function classify(atraso){
  if (atraso <= 0) return {key:"ok", label:"No prazo", color:C.green};
  if (atraso > 3)  return {key:"crit", label:"Crítica", color:C.red};
  return {key:"late", label:"Atrasada", color:C.amber};
}
function buildData(raw){
  return raw.map(d=>{
    const atraso = d.dias_reais - d.prazo_dias;
    return {...d, atraso, status:classify(atraso)};
  });
}

let savedData = localStorage.getItem("logitrack_data");
let initialRaw = savedData ? JSON.parse(savedData) : (typeof RAW !== "undefined" ? RAW : []);
let DATA = buildData(initialRaw);

const state = {
  regiao: "", 
  transp: "", 
  status: "", 
  sortKey: "atraso", 
  sortDir: "desc",
  currentPage: 1,      
  itemsPerPage: 10
};
const $ = s=>document.querySelector(s);

function uniq(arr){return [...new Set(arr)].sort()}
function fillSelect(el, vals){vals.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;el.appendChild(o)})}
function populateFilters(){
  const r=$("#f-regiao"), t=$("#f-transp");
  r.length=1; t.length=1;                       
  fillSelect(r, uniq(DATA.map(d=>d.regiao)));
  fillSelect(t, uniq(DATA.map(d=>d.transportadora)));
}
populateFilters();

function applyFilters(){
  return DATA.filter(d=>
    (!state.regiao || d.regiao===state.regiao) &&
    (!state.transp || d.transportadora===state.transp) &&
    (!state.status || d.status.key===state.status)
  );
}

let chartTransp, chartRegiao;
Chart.defaults.color = C.muted;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;

function buildCharts(rows){
  if(!rows.length) {
    if(chartTransp) chartTransp.destroy();
    if(chartRegiao) chartRegiao.destroy();
    return;
  }

  const tMap = {};
  rows.forEach(d=>{ if(d.atraso>0){ tMap[d.transportadora]=(tMap[d.transportadora]||0)+1; } });
  const allT = uniq(DATA.map(d=>d.transportadora));
  const tLabels = allT.filter(t=> tMap[t]!==undefined || !state.transp || t===state.transp);
  const tVals = tLabels.map(t=>tMap[t]||0);
  const tColors = tVals.map(v=> v>=3 ? C.red : v>=2 ? C.amber : v>0 ? C.accent : "#DCE2DC");

  const rAgg = {};
  rows.forEach(d=>{ (rAgg[d.regiao] = rAgg[d.regiao]||[]).push(d.atraso); });
  let regEntries = Object.entries(rAgg)
    .map(([r,arr])=>({r, avg: arr.reduce((a,b)=>a+b,0)/arr.length}))
    .filter(e => e.avg > 0)
    .sort((a,b)=>b.avg-a.avg);
  const rLabels = regEntries.map(e=>e.r);
  const rVals = regEntries.map(e=>+e.avg.toFixed(2));
  const rColors = rVals.map(v=> v>3 ? C.red : C.amber);

  const gridCfg = {color:C.grid, drawBorder:false};
  const baseOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false}, tooltip:{
      backgroundColor:"#16261D", borderColor:"rgba(255,255,255,.12)", borderWidth:1, padding:11,
      titleFont:{family:"'Space Grotesk'"}, cornerRadius:0, displayColors:false
    }},
    animation:{duration:700}
  };

  const pieEntries = Object.entries(tMap).sort((a,b)=>b[1]-a[1]);
  const pLabels = pieEntries.map(e=>e[0]);
  const pVals   = pieEntries.map(e=>e[1]);
  const pTotal  = pVals.reduce((a,b)=>a+b,0);
  const pColors = pVals.map(v=> v>=3 ? C.red : v>=2 ? C.amber : C.accent);

  if(chartTransp) chartTransp.destroy();
  chartTransp = new Chart($("#chartTransp"), {
    type:"pie",
    data:{labels:pLabels, datasets:[{data:pVals, backgroundColor:pColors, borderColor:"#fff", borderWidth:3, hoverOffset:8}]},
    options:{...baseOpts,
      layout:{padding:6},
      plugins:{...baseOpts.plugins,
        legend:{display:true, position:"bottom",
          labels:{boxWidth:11, boxHeight:11, padding:16, usePointStyle:true, pointStyle:"rect",
                  font:{family:"'Inter'", size:12, weight:"600"}, color:C.muted}},
        tooltip:{...baseOpts.plugins.tooltip, callbacks:{
          label:c=>{const p=pTotal?Math.round(c.parsed/pTotal*100):0; return ` ${c.label}: ${c.parsed} atraso(s) · ${p}%`;}}}
      }
    }
  });

  if(chartRegiao) chartRegiao.destroy();
  chartRegiao = new Chart($("#chartRegiao"), {
    type:"bar",
    data:{labels:rLabels, datasets:[{data:rVals, backgroundColor:rColors, borderRadius:0, maxBarThickness:54}]},
    options:{...baseOpts,
      scales:{
        x:{grid:{display:false}, ticks:{font:{weight:"600"}}},
        y:{beginAtZero:true, grid:gridCfg, ticks:{callback:v=>v+"d"}}
      },
      plugins:{...baseOpts.plugins, tooltip:{...baseOpts.plugins.tooltip,
        callbacks:{label:c=>` Atraso médio: ${c.parsed.y} dias`}}}
    }
  });
}

const icons = {
  box:'<path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pct:'<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  peak:'<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v6h-6"/>',
  alert:'<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'
};
function svg(p){return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`}

function renderKPIs(rows){
  const total = rows.length;
  const atrasadas = rows.filter(d=>d.atraso>0).length;
  const noPrazo = total - atrasadas;
  const criticas = rows.filter(d=>d.atraso>3).length;
  const pct = total ? (atrasadas/total*100) : 0;
  const maior = total ? Math.max(...rows.map(d=>d.atraso)) : 0;
  const pctClass = pct>=50?"red":pct>=25?"amber":"green";
  const maiorClass = maior>3?"red":maior>0?"amber":"green";

  const groups = [
    { hero:true, title:"Volume da operação", tag:"no recorte atual", ico:icons.box, items:[
      {val:total,     cls:"", label:"Total de entregas"},
      {val:noPrazo,   cls:"", label:"No prazo"},
      {val:atrasadas, cls:"", label:"Atrasadas"}
    ]},
    { hero:false, title:"Severidade dos atrasos", tag:"sobre as entregas filtradas", ico:icons.alert, items:[
      {val:pct.toFixed(0)+"%", cls:pctClass,                 label:"Percentual de atraso"},
      {val:fmtDelay(maior),    cls:maiorClass,               label:"Maior atraso"},
      {val:criticas,           cls:criticas?"red":"green",   label:"Entregas críticas"}
    ]}
  ];

  $("#totals").innerHTML = groups.map(g=>`
    <div class="total-card${g.hero?" hero":""}">
      <div class="tc-head">
        <span class="tc-title">${g.title}</span>
        <span class="tc-ic">${svg(g.ico)}</span>
      </div>
      <div class="tc-row">
        ${g.items.map(it=>`
          <div class="tc-item">
            <div class="tc-val num ${it.cls}">${it.val}</div>
            <div class="tc-label">${it.label}</div>
          </div>`).join("")}
      </div>
      <div class="tc-tag">${g.tag}</div>
    </div>`).join("");
}

function renderInsights(){
  if (!DATA.length) {
    $("#insights").innerHTML = `<div class="insight-row ok">
      <span class="ir-icon">${svg(icons.box).replace('class="ico"','width="18" height="18"')}</span>
      <div class="ir-body"><h4>Aguardando dados</h4><p>Importe dados para gerar insights de inteligência de negócio automaticamente.</p></div>
    </div>`;
    return;
  }

  const rAgg={}; DATA.forEach(d=>(rAgg[d.regiao]=rAgg[d.regiao]||[]).push(d.atraso));
  const reg = Object.entries(rAgg).map(([r,a])=>({r,avg:a.reduce((x,y)=>x+y,0)/a.length, n:a.length}))
                    .sort((a,b)=>b.avg-a.avg)[0];

  const tAgg={}; DATA.forEach(d=>(tAgg[d.transportadora]=tAgg[d.transportadora]||[]).push(d));
  const transp = Object.entries(tAgg).map(([t,a])=>{
    const atrasos=a.map(d=>d.atraso);
    const late=a.filter(d=>d.atraso>0).length;
    return {t, avg:atrasos.reduce((x,y)=>x+y,0)/a.length, late, n:a.length, worst:Math.max(...atrasos)};
  }).sort((a,b)=>b.avg-a.avg)[0];

  const criticas = DATA.filter(d=>d.atraso>3).length;
  const pctCrit = (criticas/DATA.length*100).toFixed(0);

  const items = [
    {cls:"warn", ico:icons.alert, h:"Transportadora com pior desempenho",
     p:`A <b>${transp.t}</b> lidera os atrasos com média de <b>${transp.avg.toFixed(1)} dias</b> por entrega (${transp.late} de ${transp.n} atrasadas) e o pior caso registrado: <b>${transp.worst} dias</b> acima do prazo. Recomenda-se revisão de SLA.`},
    {cls:"alert", ico:icons.peak, h:"Região mais problemática",
     p:`O <b>${reg.r}</b> concentra o maior atraso médio: <b>${reg.avg.toFixed(1)} dias</b> sobre ${reg.n} entrega(s). Vale priorizar realocação de malha e reforço operacional nessa praça.`},
    {cls: criticas? "warn":"ok", ico: criticas?icons.alert:icons.box, h:"Nível de criticidade da operação",
     p: criticas
        ? `Há <b>${criticas} entrega(s) crítica(s)</b> (${pctCrit}% do total) com atraso acima de 3 dias. Estas exigem ação imediata para conter impacto no nível de serviço.`
        : `Nenhuma entrega crítica no momento. A operação opera dentro de uma margem saudável de atraso.`}
  ];
  $("#insights").innerHTML = items.map(i=>`
    <div class="insight-row ${i.cls}">
      <span class="ir-icon">${svg(i.ico).replace('class="ico"','width="18" height="18"')}</span>
      <div class="ir-body"><h4>${i.h}</h4><p>${i.p}</p></div>
    </div>`).join("");
}

function fmtDelay(days){
  const neg = days < 0;
  let abs = Math.abs(days);
  let d = Math.floor(abs);
  let h = Math.round((abs - d) * 24);
  if(h === 24){ d += 1; h = 0; }
  let s = d + "d";
  if(h > 0) s += h + "h";
  if(d === 0 && h === 0) s = "0d";
  return (neg ? "−" : "") + s;
}

function renderRanking(rows){
  if(!rows.length){$("#ranking").innerHTML='<div class="empty">Nenhuma transportadora no recorte atual.</div>';return}
  const tAgg={}; rows.forEach(d=>(tAgg[d.transportadora]=tAgg[d.transportadora]||[]).push(d));
  let list = Object.entries(tAgg).map(([t,a])=>{
    const atrasos=a.map(d=>d.atraso);
    const late=a.filter(d=>d.atraso>0).length;
    return {t, avg:atrasos.reduce((x,y)=>x+y,0)/a.length, late, n:a.length, rate:late/a.length*100};
  }).sort((a,b)=>b.avg-a.avg);

  const max = Math.max(...list.map(l=>Math.abs(l.avg)), 1);
  $("#ranking").innerHTML = list.map((l,i)=>{
    const color = l.avg>3?C.red : l.avg>0?C.amber : C.green;
    const w = Math.max(Math.abs(l.avg)/max*100, 4);
    return `<div class="rank-row">
      <div class="rank-pos">${i+1}</div>
      <div class="rank-info">
        <div class="rank-name">${l.t}<small>${l.late}/${l.n} atrasadas · ${l.rate.toFixed(0)}% taxa de atraso</small></div>
        <div class="rank-bar"><i style="width:${w}%;background:${color}"></i></div>
      </div>
      <div class="rank-metric">
        <div class="big" style="color:${color}">${fmtDelay(l.avg)}</div>
        <div class="cap">atraso médio</div>
      </div>
    </div>`;
  }).join("");
}

function renderTable(rows){
  const ord = {ok:0, late:1, crit:2};
  const sorted = [...rows].sort((a,b)=>{
    let av=a[state.sortKey], bv=b[state.sortKey];
    if(state.sortKey==="status"){av=ord[a.status.key];bv=ord[b.status.key]}
    if(typeof av==="string"){return state.sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av)}
    return state.sortDir==="asc"?av-bv:bv-av;
  });

  const tb=$("#tbody");
  if(!sorted.length){
    tb.innerHTML=`<tr><td colspan="7" class="empty">Nenhuma entrega corresponde aos filtros selecionados.</td></tr>`;
    $("#pagination").innerHTML = "";
    return;
  }

  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage);
  
  if(state.currentPage > totalPages) state.currentPage = totalPages || 1;

  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedItems = sorted.slice(startIndex, endIndex);

  tb.innerHTML = paginatedItems.map(d=>{
    const bcls = d.status.key==="ok"?"b-ok":d.status.key==="crit"?"b-crit":"b-late";
    const dColor = d.atraso>3?C.red:d.atraso>0?C.amber:C.green;
    const sign = d.atraso>0?"+":"";
    return `<tr>
      <td class="num">#${d.id_entrega}</td>
      <td>${d.transportadora}</td>
      <td>${d.regiao}</td>
      <td class="num">${d.prazo_dias}d</td>
      <td class="num">${d.dias_reais}d</td>
      <td class="num delay-val" style="color:${dColor}">${sign}${d.atraso}d</td>
      <td><span class="badge ${bcls}">${d.status.label}</span></td>
    </tr>`;
  }).join("");

  renderPaginationControls(totalPages, totalItems);

  document.querySelectorAll("thead th").forEach(th=>{
    const k=th.dataset.k, arrow=th.querySelector(".arrow");
    if(k===state.sortKey){th.classList.add("sorted");arrow.textContent=state.sortDir==="asc"?"↑":"↓"}
    else{th.classList.remove("sorted");arrow.textContent="↕"}
  });
}

function renderPaginationControls(totalPages, totalItems) {
  const pagContainer = $("#pagination");
  if (totalPages <= 1) {
    pagContainer.innerHTML = `<small style="color:${C.muted}">Mostrando todos os ${totalItems} itens.</small>`;
    return;
  }

  pagContainer.innerHTML = `
    <button class="btn-reset" id="btn-prev" ${state.currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>Anterior</button>
    <span style="font-family:'Inter', sans-serif; font-size:13px; font-weight:600; color:${C.muted}">Página ${state.currentPage} de ${totalPages}</span>
    <button class="btn-reset" id="btn-next" ${state.currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>Próximo</button>
  `;

  $("#btn-prev").onclick = () => { if(state.currentPage > 1) { state.currentPage--; renderTable(applyFilters()); } };
  $("#btn-next").onclick = () => { if(state.currentPage < totalPages) { state.currentPage++; renderTable(applyFilters()); } };
}

function checkDataAvailability(){
  if(DATA.length === 0){
    $("#totals").innerHTML = `
      <div class="total-card hero" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 12px;">📦 Sem dados carregados</div>
        <div class="tc-tag" style="font-size: 14px; margin-bottom: 20px;">
          Nenhum registro de entrega foi localizado no sistema.
        </div>
        <p style="color:#fff; font-size:13px; max-width:500px; margin: 0 auto 16px;">
          Por favor, utilize o botão <strong>"Importar CSV / XLS"</strong> no canto superior direito para carregar uma nova planilha.
        </p>
      </div>
    `;
    $("#ranking").innerHTML = '<div class="empty">Nenhum dado cadastrado para gerar o ranking.</div>';
    $("#tbody").innerHTML = `<tr><td colspan="7" class="empty">Aguardando importação de arquivos para listagem de entregas.</td></tr>`;
    $("#rcount").innerHTML = `Exibindo <b>0</b> de <b>0</b> entregas`;
    $("#pagination").innerHTML = "";
    return false;
  }
  return true;
}

function render(){
  const rows = applyFilters();
  $("#rcount").innerHTML = `Exibindo <b>${rows.length}</b> de <b>${DATA.length}</b> entregas`;
  
  if (!checkDataAvailability()) {
    buildCharts([]);
    return; 
  }

  renderKPIs(rows);
  buildCharts(rows);
  renderRanking(rows);
  renderTable(rows);
}

$("#f-regiao").onchange = e=>{state.regiao=e.target.value; state.currentPage=1; render()};
$("#f-transp").onchange = e=>{state.transp=e.target.value; state.currentPage=1; render()};
$("#f-status").onchange = e=>{state.status=e.target.value; state.currentPage=1; render()};
$("#reset").onclick = ()=>{
  state.regiao=state.transp=state.status="";
  state.currentPage = 1;
  $("#f-regiao").value=$("#f-transp").value=$("#f-status").value="";
  render();
};
document.querySelectorAll("thead th").forEach(th=>{
  th.onclick=()=>{
    const k=th.dataset.k;
    if(state.sortKey===k){state.sortDir=state.sortDir==="asc"?"desc":"asc"}
    else{state.sortKey=k;state.sortDir = (k==="transportadora"||k==="regiao")?"asc":"desc"}
    state.currentPage = 1
    renderTable(applyFilters());
  };
});

function loadDeliveries(rawRows){
  DATA = buildData(rawRows);
  
  localStorage.setItem("logitrack_data", JSON.stringify(rawRows));
  
  state.regiao = state.transp = state.status = "";
  state.currentPage = 1; 
  populateFilters();
  $("#f-regiao").value = $("#f-transp").value = $("#f-status").value = "";
  renderInsights();
  render();
}

const fileInput = $("#file-input");
const importStatus = $("#import-status");
function setStatus(msg, kind){
  importStatus.textContent = msg;
  importStatus.className = "import-status" + (kind ? " "+kind : "");
}
$("#btn-upload").onclick = ()=> fileInput.click();
fileInput.onchange = e=>{
  const file = e.target.files[0];
  if(!file) return;
  setStatus("Processando…", "");
  Importer.parseFile(file)
    .then(rows=>{
      loadDeliveries(rows);
      setStatus(`${rows.length} entrega(s) importada(s) de "${file.name}".`, "ok");
    })
    .catch(err=> setStatus(err.message || "Não foi possível importar o arquivo.", "err"))
    .finally(()=>{ fileInput.value=""; });
};

renderInsights();
render();