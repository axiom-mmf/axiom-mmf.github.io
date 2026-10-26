(()=>{
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,K=rm?1:0.08;
const lerp=(a,b,k)=>a+(b-a)*k;
// A: scroll
const sw=document.querySelector('.sweep'),sa=document.querySelector('.s-scroll');let pt=0,pc=0;
function readScroll(){const r=sw.getBoundingClientRect(),span=r.height-innerHeight;pt=rm?0.5:Math.min(1,Math.max(0,-r.top/Math.max(1,span)));pt=rm?.5:(pt<.1?0:pt>.9?1:(pt-.1)/.8)}
// B: lens
const L=document.querySelector('.s-lens');let lx=.5,ly=.5,tx=.5,ty=.5,lr=0,tr=0;const R=()=>Math.max(70,Math.min(140,L.clientWidth*.12));
function lp(e){const b=L.getBoundingClientRect();tx=(e.clientX-b.left)/b.width;ty=(e.clientY-b.top)/b.height;tr=R();if(lr<1){lx=tx;ly=ty}}
L.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')lp(e)});L.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)lp(e)});
L.addEventListener('pointerdown',e=>{L.setPointerCapture(e.pointerId);lp(e)});
L.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')tr=0});L.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')tr=0});L.addEventListener('pointercancel',()=>tr=0);
// C: slider
const S=document.querySelector('.s-slide'),H=S.querySelector('.handle');let sx=.5,st=.5,drag=false;
const sp=e=>{const b=S.getBoundingClientRect();st=Math.min(1,Math.max(0,(e.clientX-b.left)/b.width))};
S.addEventListener('pointerdown',e=>{drag=true;S.setPointerCapture(e.pointerId);sp(e)});S.addEventListener('pointermove',e=>{if(drag)sp(e)});
['pointerup','pointercancel'].forEach(t=>S.addEventListener(t,()=>drag=false));
H.addEventListener('keydown',e=>{const d={ArrowLeft:-.05,ArrowRight:.05,Home:-1,End:1}[e.key];if(d!=null){e.preventDefault();st=Math.min(1,Math.max(0,st+d))}});
let run=true;document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)requestAnimationFrame(tick)});
function tick(){if(!run)return;readScroll();
pc=lerp(pc,pt,K);if(Math.abs(pc-pt)<1e-4)pc=pt;sa.style.setProperty('--p',pc.toFixed(4));sa.style.setProperty('--o',(pc<=0.001||pc>=.999)?0:1);
lx=lerp(lx,tx,rm?1:.14);ly=lerp(ly,ty,rm?1:.14);lr=lerp(lr,tr,rm?1:.1);if(lr<.5&&tr===0)lr=0;
L.style.setProperty('--x',(lx*100).toFixed(2)+'%');L.style.setProperty('--y',(ly*100).toFixed(2)+'%');L.style.setProperty('--r',lr.toFixed(1)+'px');
sx=lerp(sx,st,rm||drag?(rm?1:.35):.12);S.style.setProperty('--x',(sx*100).toFixed(2)+'%');H.setAttribute('aria-valuenow',Math.round(st*100));
requestAnimationFrame(tick)}
requestAnimationFrame(tick);
})();
