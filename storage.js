// storage.js - saves only rooms and schedules in this browser's localStorage (not shared with anyone).
const Store={KEY:"csi-demo-v1",
 fresh(){return JSON.parse(JSON.stringify({rooms:SAMPLE_ROOMS,schedules:SAMPLE_SCHEDULES}))},
 load(){try{const s=JSON.parse(localStorage.getItem(this.KEY));if(s&&Array.isArray(s.rooms)&&Array.isArray(s.schedules))return s}catch(e){}return this.fresh()},
 save(db){try{localStorage.setItem(this.KEY,JSON.stringify(db));return true}catch(e){return false}},
 reset(){try{localStorage.removeItem(this.KEY)}catch(e){}return this.fresh()}};
