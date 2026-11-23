// prediction.js - k-nearest neighbors (k-NN) regression, written from scratch.
const KNN={k:5,
 init(hist){const c=hist.map(r=>r.cap);this.capMin=Math.min(...c);this.capMax=Math.max(...c)},
 // Features, each scaled to 0..1: capacity, day, hour, class scheduled (0/1), class size / capacity.
 vec(r){const c=v=>Math.max(0,Math.min(1,v));
  return[c((r.cap-this.capMin)/(this.capMax-this.capMin||1)),r.day/4,c((r.hour-8)/7),r.sched,c(r.size/r.cap)]},
 // Distance = straight-line distance over the features, +1 penalty if room types differ.
 dist(a,b){let s=a.type===b.type?0:1;const x=this.vec(a),y=this.vec(b);x.forEach((v,i)=>s+=(v-y[i])**2);return Math.sqrt(s)},
 // Predict the occupancy RATE (occupancy/capacity) of the k nearest records, then scale to this room's capacity.
 predict(q,train,k=this.k){
  if(!q||!(q.cap>0)||!train||train.length<k||!(k>=1))return{error:"Invalid input or not enough historical records."};
  const nb=train.map(r=>({r,d:this.dist(q,r)})).sort((a,b)=>a.d-b.d).slice(0,k);
  const rate=nb.reduce((s,n)=>s+n.r.occ/n.r.cap,0)/k;
  return{pred:Math.max(0,Math.min(q.cap,Math.round(rate*q.cap))),nb}},
 // Chronological split: train on weeks 1-3, test on week 4 (test records are never in the training set).
 evaluate(h,k=this.k){const tr=h.filter(r=>r.w<4),te=h.filter(r=>r.w===4);
  const mean=tr.reduce((s,r)=>s+r.occ,0)/tr.length;let ae=0,se=0,bae=0,bse=0;const byHour={};
  te.forEach(r=>{const p=this.predict(r,tr,k).pred,e=p-r.occ,be=mean-r.occ;
   ae+=Math.abs(e);se+=e*e;bae+=Math.abs(be);bse+=be*be;
   const o=byHour[r.hour]=byHour[r.hour]||{a:0,p:0};o.a+=r.occ;o.p+=p});
  const n=te.length;return{n,trainN:tr.length,mae:ae/n,rmse:Math.sqrt(se/n),bMae:bae/n,bRmse:Math.sqrt(bse/n),byHour}}};
