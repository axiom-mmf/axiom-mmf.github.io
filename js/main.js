if(location.search.includes("m=1"))document.documentElement.classList.add("m");
if(location.search.includes("static"))document.documentElement.classList.add("static");
// Scroll reveal
const els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)||location.search.includes('static')){els.forEach(e=>e.classList.add('in'))}
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});els.forEach(e=>io.observe(e))}

const g=document.getElementById('rings');
if(g){for(let i=0;i<18;i++){const c=document.createElementNS('http://www.w3.org/2000/svg','ellipse');c.setAttribute('cx',300);c.setAttribute('cy',300);c.setAttribute('rx',60+i*12);c.setAttribute('ry',(60+i*12)*0.38);c.setAttribute('transform',`rotate(${i*10} 300 300)`);g.appendChild(c)}}
// Hero voxel field: subtle, reactive. Pointer-events none; pauses when hidden.
(()=>{
const cv=document.getElementById('field'); if(!cv) return;
const ctx=cv.getContext('2d',{alpha:true});
const q=new URLSearchParams(location.search);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const still=reduce||q.has('static');
const coarse=matchMedia('(pointer: coarse)').matches;
const DPR=Math.min(devicePixelRatio||1,2);
const R=coarse?160:240;           // falloff radius (css px), wide and gentle
const PUSH=coarse?2.5:4;          // max displacement (css px)
const EASE=0.06;                  // pointer and voxel easing
let W,H,cell,cols,rows,pts=[];
const ptr={x:-9999,y:-9999,tx:-9999,ty:-9999,a:0,ta:0};
let t=+(q.get('t')||0), running=false, visible=true, scrollY=0, heroH=1;
function build(){
  const w=innerWidth,h=innerHeight; W=w;H=h;
  cv.width=w*DPR; cv.height=h*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  cell=Math.max(coarse?16:12,w/(coarse?26:90)); cols=Math.ceil(w/cell)+1; rows=Math.ceil(h/cell)+3;
  pts=new Array(cols*rows).fill(0).map(()=>({dx:0,dy:0,g:0}));
  heroH=(document.querySelector('.hero')||{offsetHeight:h}).offsetHeight;
}
function frame(){
  // ease pointer
  ptr.x+=(ptr.tx-ptr.x)*EASE; ptr.y+=(ptr.ty-ptr.y)*EASE; ptr.a+=(ptr.ta-ptr.a)*0.04;
  const prog=Math.min(scrollY/heroH,3);
  cv.style.opacity=(0.55-Math.min(prog,1)*0.45).toFixed(3); // fades to ~0.10 behind later sections
  const drift=(scrollY*0.06)%cell;          // slow depth drift
  const ph=t+prog*0.35;                     // phase shifts gently with scroll
  const sc=1+prog*0.04;                     // barely-perceptible depth scale
  ctx.clearRect(0,0,W,H);
  const s=cell*0.72, R2=R*R;
  for(let j=0;j<rows;j++){const y0=j*cell-drift;
    for(let i=0;i<cols;i++){
      const x=i*cell, X=(x-W/2)*sc+W/2, Y=(y0-H/2)*sc+H/2;
      const v=Math.sin(x*.004+ph)*Math.cos((y0+scrollY*0.3)*.006-ph*.7)+Math.sin((x+y0)*.002+ph*.5);
      const p=pts[j*cols+i];
      const ddx=X-ptr.x, ddy=Y-ptr.y, d2=ddx*ddx+ddy*ddy;
      let inf=0,tx=0,ty=0;
      if(d2<R2){inf=(1-d2/R2);inf*=inf*ptr.a;const d=Math.sqrt(d2)||1;tx=ddx/d*PUSH*inf;ty=ddy/d*PUSH*inf}
      p.dx+=(tx-p.dx)*EASE; p.dy+=(ty-p.dy)*EASE; p.g+=(inf-p.g)*EASE;
      const vv=v+p.g*0.18;                  // slight lift near cursor
      if(vv<=.55) continue;
      let r,g,b,a;
      if(vv>1.55){r=255;g=106;b=43;a=Math.min(.4,(vv-1.55)*.9+.12)}
      else{const w=p.g*0.35;                // faint warm tint, never full orange
        r=232+(255-232)*w|0; g=230+(150-230)*w|0; b=225+(110-225)*w|0; a=(vv-.55)*.32+p.g*.05}
      ctx.fillStyle=`rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.fillRect(X+p.dx,Y+p.dy,s*sc,s*sc);
    }}
}
function loop(){ if(!running) return; t+=.004; frame(); requestAnimationFrame(loop) }
function start(){ if(still||running||!visible) return; running=true; requestAnimationFrame(loop) }
function stop(){ running=false }
const move=(x,y)=>{ptr.tx=x;ptr.ty=y;ptr.ta=1};
addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});
addEventListener('pointerdown',e=>move(e.clientX,e.clientY),{passive:true});
document.addEventListener('pointerleave',()=>ptr.ta=0);
addEventListener('touchend',()=>ptr.ta=0,{passive:true});
addEventListener('scroll',()=>{scrollY=scrollY0();if(still)frame()},{passive:true});
const scrollY0=()=>window.scrollY||0;
addEventListener('resize',()=>{build();frame()});
document.addEventListener('visibilitychange',()=>{visible=!document.hidden; visible?start():stop()});
build();
// test hooks: ?mx=&my= simulated pointer, ?sy= scroll position
if(q.has('sy')){scrollTo({top:+q.get('sy'),behavior:'instant'});scrollY=+q.get('sy')}
if(q.has('mx')){ptr.x=ptr.tx=+q.get('mx');ptr.y=ptr.ty=+q.get('my');ptr.a=ptr.ta=1;for(let k=0;k<120;k++)frame()}
frame(); start();
})();
