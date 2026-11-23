// app.js - navigation, rendering and events. Every page reads the same DB (rooms + schedules).
const {h}=U,$=id=>document.getElementById(id),PAGES=["dash","pred","sched","env","rooms"];
let DB=Store.load(),cur="dash",sel=null;const charts={};
KNN.init(HISTORY);const EVAL=KNN.evaluate(HISTORY); // computed once; history never changes
const room=id=>DB.rooms.find(r=>r.id===id);
const mount=(id,n)=>$(id).replaceChildren(n);
const cardsOf=l=>h("div",{class:"cards"},l.map(([t,v])=>h("div",{class:"card"},h("b",{},v),h("span",{},t))));
function note(t,bad){const e=$("toast");e.textContent=t;e.className=bad?"toast bad":"toast";e.hidden=false;clearTimeout(note.t);note.t=setTimeout(()=>e.hidden=true,5000)}
function save(){if(!Store.save(DB))note("Browser storage is unavailable: changes last only until you refresh.",true);render()}
function fillSel(id,vals,labels){const e=$(id),old=e.value;e.replaceChildren(...vals.map((v,i)=>h("option",{value:v},labels?labels[i]:v)));if(vals.map(String).includes(old))e.value=old}
function draw(id,cfg){if(typeof Chart==="undefined"){$(id).replaceWith(h("p",{class:"muted",id},"Chart.js could not load (internet is needed for the CDN)."));return}
 if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),cfg)}
const picked=id=>[...$(id).selectedOptions].map(o=>o.value);
// All alerts come from one function so the dashboard and other pages always agree.
function alerts(){const a=[];
 DB.rooms.forEach(r=>{const u=U.util(r.occ,r.cap);if(u!==null&&u>=85)a.push(["Capacity",`${r.id} is at ${U.pct(u)} of capacity`])});
 DB.schedules.forEach(s=>{const r=room(s.room),f=r?SCHED.check(r,s,DB.schedules,s.id):["Assigned room not found"];if(f.length)a.push(["Schedule",`${s.name} (${s.room}): ${f.join("; ")}`])});
 ENV.alerts(DB.rooms).forEach(x=>a.push(["Environment",x.msg]));return a}

function dash(){const rs=DB.rooms,us=rs.map(r=>U.util(r.occ,r.cap)).filter(u=>u!==null);
 const avg=us.length?us.reduce((a,b)=>a+b,0)/us.length:null;
 const n=DB.schedules.filter(s=>s.day===DEMO_NOW.day&&U.toMin(s.end)>DEMO_NOW.min).length;
 mount("cards",cardsOf([["Monitored rooms",rs.length],["Simulated current occupancy",rs.reduce((a,r)=>a+(+r.occ||0),0)],["Average utilization",U.pct(avg)],
  [`Activities active or upcoming (${DAYS[DEMO_NOW.day]} ${U.fmt(DEMO_NOW.min)} demo clock)`,n],["Environmental alerts",ENV.alerts(rs).length]]));
 mount("util",U.table(["Room","Building","Capacity","Occupancy","Utilization","Status"],rs.map(r=>{const u=U.util(r.occ,r.cap);return[r.id,r.building,r.cap,r.occ,U.pct(u),U.badge(U.status(u))]})));
 mount("envov",U.table(["Room","Temperature","Humidity","CO₂"],rs.map(r=>{const x=ENV.latest(r.id);return[r.id,...["temp","hum","co2"].map(p=>ENV.show(p,x))]})));
 const al=alerts();mount("alerts",al.length?h("ul",{},al.slice(0,8).map(a=>h("li",{},U.badge(a[0])," ",a[1]))):h("p",{class:"muted"},"No alerts."));
 draw("c-occ",{type:"line",data:{labels:HOURS.map(x=>x+":00"),datasets:[
  {label:"Actual (test week)",data:HOURS.map(x=>EVAL.byHour[x].a),borderColor:"#1d4ed8"},
  {label:"k-NN predicted",data:HOURS.map(x=>EVAL.byHour[x].p),borderColor:"#f59e0b",borderDash:[5,4]}]},
  options:{responsive:true,scales:{y:{title:{display:true,text:"Occupants (sum over test week)"}}}}})}

function pred(){fillSel("pr-room",DB.rooms.map(r=>r.id));const E=EVAL,f=x=>x.toFixed(2);
 mount("eval",h("div",{},h("p",{},`Trained on ${E.trainN} records (weeks 1-3), tested on ${E.n} later records (week 4), k=${KNN.k}.`),
  U.table(["Model","MAE (occupants)","RMSE (occupants)"],[["k-NN",f(E.mae),f(E.rmse)],["Baseline: mean training occupancy",f(E.bMae),f(E.bRmse)]])))}

function sched(){fillSel("s-room",["",...DB.rooms.map(r=>r.id)],["No preference",...DB.rooms.map(r=>r.id)]);
 mount("s-table",U.table(["Activity","Day","Time","Attendees","Room","Check",""],DB.schedules.map(s=>{
  const r=room(s.room),f=r?SCHED.check(r,s,DB.schedules,s.id):["Assigned room not found"];
  return[s.name,DAYS[s.day],s.start+"-"+s.end,s.att,s.room||"-",f.length?h("span",{class:"err"},f.join("; ")):U.badge("OK"),
   h("button",{class:"sm",onclick:()=>{DB.schedules=DB.schedules.filter(x=>x.id!==s.id);save()}},"Remove")]})))}

function env(){fillSel("e-room",DB.rooms.map(r=>r.id));const id=$("e-room").value,p=$("e-param").value,s=ENV.series(id),x=ENV.latest(id);
 mount("e-cards",cardsOf(["temp","hum","co2"].map(q=>[ENV.limits[q].label+" (latest)",ENV.show(q,x)])));
 mount("e-hist",U.table(["Time","Temp (°C)","Humidity (%)","CO₂ (ppm)"],s.map(r=>[r.t,r.temp??"No data",r.hum??"No data",r.co2??"No data"]),"No simulated readings for this room."));
 draw("c-env",{type:"line",data:{labels:s.map(r=>r.t),datasets:[{label:ENV.limits[p].label+ENV.limits[p].unit,data:s.map(r=>Number.isFinite(r[p])?r[p]:null),borderColor:"#1d4ed8"}]},options:{responsive:true}});
 const al=ENV.alerts(DB.rooms);mount("e-alerts",al.length?h("ul",{},al.map(a=>h("li",{},a.msg))):h("p",{class:"muted"},"No alerts."))}

function detail(){const r=room(sel);if(!r)return mount("r-detail",h("p",{class:"muted"},"Select a room to see its details."));
 const ss=DB.schedules.filter(s=>s.room===r.id);
 mount("r-detail",h("div",{},h("h3",{},r.id),h("p",{},`${r.building}, ${r.type}, capacity ${r.cap}, simulated occupancy ${r.occ} (${U.pct(U.util(r.occ,r.cap))})`),
  h("p",{},"Equipment: "+(r.equip.join(", ")||"none")),U.table(["Activity","Day","Time"],ss.map(s=>[s.name,DAYS[s.day],s.start+"-"+s.end]),"No scheduled activities.")))}
function rooms(){const bs=[...new Set(DB.rooms.map(r=>r.building))];fillSel("f-bld",["",...bs],["All buildings",...bs]);
 const q=$("f-q").value.trim().toLowerCase(),t=$("f-type").value,b=$("f-bld").value;
 const L=DB.rooms.filter(r=>(!q||r.id.toLowerCase().includes(q))&&(!t||r.type===t)&&(!b||r.building===b));
 mount("r-table",U.table(["Room","Building","Type","Capacity","Utilization","",""],L.map(r=>[r.id,r.building,r.type,r.cap,U.pct(U.util(r.occ,r.cap)),
  h("button",{class:"sm",onclick:()=>{sel=r.id;detail()}},"Details"),
  h("button",{class:"sm",onclick:()=>{DB.rooms=DB.rooms.filter(x=>x.id!==r.id);if(sel===r.id)sel=null;save()}},"Delete")]),"No rooms match the filters."));detail()}

function render(){({dash,pred,sched,env,rooms})[cur]()}
function go(p){cur=p;location.hash=p;document.querySelectorAll(".page").forEach(s=>s.hidden=s.id!=="p-"+p);
 document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.p===p));render();scrollTo(0,0)}

function init(){
 fillSel("pr-day",[0,1,2,3,4],DAYS);fillSel("s-day",[0,1,2,3,4],DAYS);fillSel("pr-hour",HOURS,HOURS.map(x=>x+":00"));
 fillSel("s-type",["",...TYPES],["Any",...TYPES]);fillSel("r-type",TYPES);fillSel("f-type",["",...TYPES],["All types",...TYPES]);
 fillSel("s-equip",EQUIP);fillSel("r-equip",EQUIP);
 document.addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(b)go(b.dataset.p)});
 ["f-q","f-type","f-bld"].forEach(i=>$(i).addEventListener("input",rooms));
 ["e-room","e-param"].forEach(i=>$(i).addEventListener("change",env));
 $("reset").onclick=()=>{if(confirm("Restore the original sample rooms and schedules?")){DB=Store.reset();sel=null;render();note("Sample data restored.")}};

 $("pred-go").onclick=()=>{const r=room($("pr-room").value),sc=$("pr-sched").checked?1:0,size=sc?+$("pr-size").value:0,k=+$("pr-k").value,day=+$("pr-day").value,hour=+$("pr-hour").value;
  const bad=m=>mount("pred-out",h("p",{class:"err"},m));
  if(!r)return bad("Choose a room first.");
  if(!Number.isInteger(size)||size<0||size>r.cap)return bad(`Class size must be a whole number from 0 to ${r.cap}.`);
  if(!Number.isInteger(k)||k<1||k>25)return bad("k must be a whole number from 1 to 25.");
  const res=KNN.predict({type:r.type,cap:r.cap,day,hour,sched:sc,size},HISTORY,k);if(res.error)return bad(res.error);
  const u=U.util(res.pred,r.cap),past=HISTORY.filter(x=>x.room===r.id&&x.day===day&&x.hour===hour);
  mount("pred-out",h("div",{},cardsOf([["Predicted occupants",res.pred],["Predicted utilization",U.pct(u)],["Room capacity",r.cap],["Status",U.status(u)]]),
   h("p",{},past.length?`Past simulated average for this room, day and hour: ${(past.reduce((a,x)=>a+x.occ,0)/past.length).toFixed(1)} occupants (${past.length} records).`:"No past records for this exact room, day and hour."),
   h("p",{},`The ${k} most similar past records:`),
   U.table(["#","Room","Day","Hour","Scheduled","Class size","Occupancy","Distance"],res.nb.map((n,i)=>[i+1,n.r.room,DAYS[n.r.day],n.r.hour+":00",n.r.sched?"Yes":"No",n.r.size,n.r.occ,n.d.toFixed(2)]))))};

 $("s-check").onclick=()=>{const ev={name:$("s-name").value.trim(),day:+$("s-day").value,start:$("s-start").value,end:$("s-end").value,att:+$("s-att").value,type:$("s-type").value,equip:picked("s-equip"),room:$("s-room").value};
  const er=SCHED.validate(ev);if(er.length)return note(er.join(". "),true);
  const rec=SCHED.recommend(ev,DB.rooms,DB.schedules),ok=rec.filter(x=>!x.fails.length),hr=Math.floor(U.toMin(ev.start)/60);
  mount("s-res",h("div",{},h("p",{class:ok.length?"":"err"},ok.length?`${ok.length} suitable room(s). Best match: ${ok[0].room.id}. This is a suggestion for human review, not an official assignment.`:"No suitable room: every room fails at least one mandatory rule (reasons below). Try another time, room type or attendee count."),
   U.table(["Room","Type / capacity","Result","Reasons","Predicted occupants",""],rec.map(x=>{const p=KNN.predict({type:x.room.type,cap:x.room.cap,day:ev.day,hour:hr,sched:1,size:Math.min(ev.att,x.room.cap)},HISTORY);
    return[x.room.id,`${x.room.type} / ${x.room.cap}`,U.badge(x.fails.length?"Rejected":"Suitable"),x.fails.length?x.fails.join("; "):`Fits with ${x.room.cap-ev.att} spare seats (score ${x.score})`,p.error?"n/a":p.pred,
     x.fails.length?"":h("button",{class:"sm",onclick:()=>{DB.schedules.push({...ev,id:"s"+Date.now(),room:x.room.id});$("s-res").replaceChildren();save();note(`Saved "${ev.name}" in ${x.room.id} (this browser only).`)}},"Assign")]}))))};

 $("r-add").onclick=()=>{const r={id:$("r-id").value.trim(),building:$("r-bld").value.trim(),type:$("r-type").value,cap:+$("r-cap").value,occ:+$("r-occ").value,equip:picked("r-equip")},e=[];
  if(!r.id)e.push("Room ID is required");else if(room(r.id))e.push("Room ID already exists");
  if(!r.building)e.push("Building is required");
  if(!Number.isInteger(r.cap)||r.cap<=0)e.push("Capacity must be a positive whole number");
  if(!Number.isInteger(r.occ)||r.occ<0||r.occ>r.cap)e.push("Occupancy must be between 0 and capacity");
  if(e.length)return note(e.join(". "),true);DB.rooms.push(r);save();note("Room added (saved in this browser only).")};

 const x=location.hash.slice(1);go(PAGES.includes(x)?x:"dash")}
init();
