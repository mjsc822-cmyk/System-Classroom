// environment.js - demonstration thresholds and alert rules. Edit ENV.limits to change them.
const ENV={
 limits:{temp:{label:"Temperature",unit:" °C",min:20,max:28},hum:{label:"Humidity",unit:"%",min:30,max:70},co2:{label:"CO₂",unit:" ppm",max:1000}},
 // FUTURE: replace SAMPLE_ENV with a real sensor/API source here (not implemented).
 series:id=>SAMPLE_ENV[id]||[],
 latest(id){const s=this.series(id);return s.length?s[s.length-1]:null},
 state(p,v){if(!Number.isFinite(v))return"No data";const l=this.limits[p];
  if(l.max!=null&&v>l.max)return"High";if(l.min!=null&&v<l.min)return"Low";return"Normal"},
 show(p,x){const v=x?x[p]:null;return Number.isFinite(v)?`${v}${this.limits[p].unit} (${this.state(p,v)})`:"No data"},
 // Missing readings never create an alert; they show as "No data".
 alerts(rooms){const o=[];rooms.forEach(r=>{const x=this.latest(r.id);if(!x)return;
  ["temp","hum","co2"].forEach(p=>{const s=this.state(p,x[p]);
   if(s==="High"||s==="Low")o.push({room:r.id,msg:`${r.id}: ${this.limits[p].label} ${s.toLowerCase()} (${x[p]}${this.limits[p].unit})`})})});return o}};
