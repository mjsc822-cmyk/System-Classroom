// scheduling.js - transparent rule-based room checks (not an advanced optimizer).
const SCHED={
 // Mandatory rules. Returns a list of reasons the room FAILS (empty list = room is suitable).
 check(room,ev,schedules,skipId){const f=[];
  if(room.cap<ev.att)f.push(`Capacity ${room.cap} is below ${ev.att} attendees`);
  if(ev.type&&room.type!==ev.type)f.push(`Room type is ${room.type}, needs ${ev.type}`);
  (ev.equip||[]).forEach(q=>{if(!room.equip.includes(q))f.push("Missing equipment: "+q)});
  const a=U.toMin(ev.start),b=U.toMin(ev.end);
  schedules.filter(s=>s.room===room.id&&s.day===ev.day&&s.id!==skipId&&U.overlap(a,b,U.toMin(s.start),U.toMin(s.end)))
   .forEach(s=>f.push(`Overlaps "${s.name}" (${s.start}-${s.end})`));
  return f},
 // Optional preference score: less unused capacity is better; the preferred room gets +5.
 recommend(ev,rooms,schedules){return rooms.map(r=>{
   const score=Math.round(100-(r.cap-ev.att)/r.cap*100)+(r.id===ev.room?5:0);
   return{room:r,fails:this.check(r,ev,schedules),score}})
  .sort((x,y)=>(x.fails.length>0)-(y.fails.length>0)||y.score-x.score)},
 validate(e){const x=[];if(!e.name)x.push("Activity name is required");
  if(!Number.isInteger(e.att)||e.att<=0)x.push("Attendees must be a positive whole number");
  const a=U.toMin(e.start),b=U.toMin(e.end);
  if(isNaN(a)||isNaN(b))x.push("Start and end time are required");else if(b<=a)x.push("End time must be later than start time");
  return x}};
