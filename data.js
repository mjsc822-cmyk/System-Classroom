// data.js - FICTIONAL sample data. Not real CvSU-Imus data. Identical on every page load.
const DAYS=["Mon","Tue","Wed","Thu","Fri"], HOURS=[8,9,10,11,13,14,15];
const TYPES=["Lecture","Computer Lab","Science Lab","Seminar","Auditorium","Study Area"];
const EQUIP=["Projector","Whiteboard","Computers","Lab Bench","Sound System"];
const DEMO_NOW={day:0,min:540}; // demo clock: Monday 09:00 (for "active/upcoming" counts)
const SAMPLE_ROOMS=[
 {id:"LR-101",building:"Sample Bldg A",type:"Lecture",cap:50,equip:["Projector","Whiteboard"],occ:38},
 {id:"LR-102",building:"Sample Bldg A",type:"Lecture",cap:40,equip:["Projector"],occ:40},
 {id:"LR-201",building:"Sample Bldg B",type:"Lecture",cap:80,equip:["Projector","Whiteboard"],occ:30},
 {id:"CL-101",building:"Sample Bldg B",type:"Computer Lab",cap:30,equip:["Computers","Projector"],occ:27},
 {id:"CL-102",building:"Sample Bldg B",type:"Computer Lab",cap:40,equip:["Computers"],occ:12},
 {id:"SL-101",building:"Sample Bldg C",type:"Science Lab",cap:25,equip:["Lab Bench"],occ:10},
 {id:"SR-101",building:"Sample Bldg A",type:"Seminar",cap:20,equip:["Projector"],occ:4},
 {id:"AUD-1",building:"Sample Bldg C",type:"Auditorium",cap:200,equip:["Projector","Sound System"],occ:60},
 {id:"LIB-1",building:"Sample Bldg C",type:"Study Area",cap:60,equip:[],occ:45}];
// day: 0=Mon..4=Fri. s1 and s2 deliberately overlap in CL-101 so conflict detection has something to find.
const SAMPLE_SCHEDULES=[
 {id:"s1",name:"Intro to Programming",day:0,start:"08:00",end:"10:00",att:28,type:"Computer Lab",equip:["Computers"],room:"CL-101"},
 {id:"s2",name:"Data Structures Lab",day:0,start:"09:00",end:"11:00",att:25,type:"Computer Lab",equip:["Computers"],room:"CL-101"},
 {id:"s3",name:"General Physics",day:0,start:"10:00",end:"12:00",att:38,type:"Lecture",equip:["Projector"],room:"LR-101"},
 {id:"s4",name:"Chemistry Lab",day:1,start:"13:00",end:"15:00",att:20,type:"Science Lab",equip:["Lab Bench"],room:"SL-101"},
 {id:"s5",name:"Math Seminar",day:1,start:"08:00",end:"09:30",att:15,type:"Seminar",equip:[],room:"SR-101"},
 {id:"s6",name:"Orientation Talk",day:2,start:"13:00",end:"16:00",att:150,type:"Auditorium",equip:["Sound System"],room:"AUD-1"},
 {id:"s7",name:"Software Engineering",day:2,start:"09:00",end:"11:00",att:45,type:"Lecture",equip:["Projector"],room:"LR-201"},
 {id:"s8",name:"Technical Writing",day:3,start:"10:00",end:"12:00",att:40,type:"Lecture",equip:[],room:"LR-102"},
 {id:"s9",name:"Networks Lab",day:4,start:"14:00",end:"16:00",att:30,type:"Computer Lab",equip:["Computers"],room:"CL-102"}];
// Small seeded random generator: same numbers every time (not Math.random).
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// Simulated history: 4 weeks x rooms x 5 days x 7 time slots. w = week number (used for the train/test split).
const HISTORY=(()=>{const r=rng(42),o=[];
 for(let w=1;w<=4;w++)SAMPLE_ROOMS.forEach(rm=>DAYS.forEach((d,di)=>HOURS.forEach(h=>{
  const sched=r()<0.55?1:0,size=sched?Math.round(rm.cap*(0.4+r()*0.5)):0;
  const occ=sched?Math.round(size*(0.75+r()*0.25)):Math.round(rm.cap*(0.02+r()*0.12));
  o.push({w,room:rm.id,type:rm.type,cap:rm.cap,day:di,hour:h,sched,size,occ})})));
 return o})();
// Simulated sensor readings (8 per room). A few exceptions are added on purpose to trigger alerts / missing data.
const SAMPLE_ENV=(()=>{const o={};
 SAMPLE_ROOMS.forEach((r,i)=>{o[r.id]=[8,9,10,11,12,13,14,15].map((h,t)=>({t:h+":00",temp:+(23+i*.2+t*.3).toFixed(1),hum:55+(t*7+i*3)%9,co2:Math.round(420+t*(20+i*3)+r.occ/r.cap*250)}))});
 o["CL-101"][7].temp=29.2;o["SL-101"][7].hum=76;o["LR-102"][7].co2=1180;o["SR-101"][7].co2=null;return o})();
