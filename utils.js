// utils.js - helpers used by every module (one shared formula for each calculation).
const U={
 toMin(t){const m=/^(\d{1,2}):(\d{2})$/.exec(t||"");return m?+m[1]*60+ +m[2]:NaN},
 fmt:m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"),
 // Two intervals overlap only if each starts before the other ends (touching ends do not overlap).
 overlap:(a1,a2,b1,b2)=>a1<b2&&b1<a2,
 // Utilization (%) = occupancy / capacity x 100. Returns null for invalid data or zero capacity.
 util:(o,c)=>(Number.isFinite(o)&&Number.isFinite(c)&&c>0&&o>=0)?o/c*100:null,
 pct:u=>u===null?"n/a":u.toFixed(0)+"%",
 status:u=>u===null?"No data":u>=100?"Full":u>=85?"Near capacity":u>=50?"Moderate":"Low",
 // h() builds DOM elements; text is added as text nodes, so user input is never run as HTML.
 h(tag,a={},...k){const e=document.createElement(tag);
  for(const[n,v]of Object.entries(a))n==="class"?e.className=v:n.startsWith("on")?e.addEventListener(n.slice(2),v):e.setAttribute(n,v);
  k.flat().forEach(c=>e.append(c instanceof Node?c:String(c)));return e},
 badge(t){return U.h("span",{class:"b b-"+({Low:"ok",OK:"ok",Suitable:"ok",Moderate:"info","No data":"info",Full:"bad",Rejected:"bad"}[t]||"warn")},t)},
 table(head,rows,empty="No records."){const h=U.h;if(!rows.length)return h("p",{class:"muted"},empty);
  return h("table",{},h("thead",{},h("tr",{},head.map(x=>h("th",{},x)))),h("tbody",{},rows.map(r=>h("tr",{},r.map(c=>h("td",{},c))))))}};
