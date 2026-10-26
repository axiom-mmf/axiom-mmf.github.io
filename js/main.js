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
// RDE-2 render: click-to-expand (desktop, fine pointer only), FLIP animation.
(()=>{
const mq=matchMedia('(pointer:fine) and (min-width:900px)'),rm=matchMedia('(prefers-reduced-motion: reduce)');
const imgs=[...document.querySelectorAll('.render-card img, img[data-zoom]')];
let bd=null,clone=null,src=null,busy=false;const D=450,E='cubic-bezier(.22,.61,.36,1)';
function prep(i){const on=mq.matches;i.classList.toggle('zoomable',on);if(on){i.tabIndex=0;i.setAttribute('role','button');i.setAttribute('aria-expanded','false');i.setAttribute('aria-label',(i.alt||'Image')+' — expand')}else{i.removeAttribute('tabindex');i.removeAttribute('role');i.removeAttribute('aria-expanded');i.removeAttribute('aria-label')}}
function setup(){imgs.forEach(prep)}
setup();mq.addEventListener('change',()=>{if(clone)close(true);setup()});

let G=null,gi=0,ui=null;
function gal(i){if(!i.dataset.gallery)return;G=i.dataset.gallery.split(',');const al=(i.dataset.galleryAlts||'').split('|');gi=0;
ui=document.createElement('div');ui.className='zoom-ui';ui.innerHTML='<button class="zg-prev" aria-label="Previous image">‹</button><button class="zg-next" aria-label="Next image">›</button><span class="zg-n mono" aria-live="polite"></span>';document.body.appendChild(ui);
ui.querySelector('.zg-prev').onclick=e=>{e.stopPropagation();show(gi-1)};ui.querySelector('.zg-next').onclick=e=>{e.stopPropagation();show(gi+1)};
let sx=null;const sw=el=>{el.addEventListener('pointerdown',e=>{sx=e.clientX},{passive:true});el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});el.addEventListener('touchend',e=>{if(sx==null)return;const d=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(d)>40){e.preventDefault();show(gi+(d<0?1:-1))}})};
sw(clone);sw(bd);clone.draggable=false;clone.addEventListener('dragstart',e=>e.preventDefault());let sw2=false;[clone,bd].forEach(el=>{el.addEventListener('pointerup',e=>{if(e.pointerType==='touch'||sx==null)return;const d=e.clientX-sx;if(Math.abs(d)>40){sw2=true;show(gi+(d<0?1:-1))}});el.addEventListener('click',e=>{if(sw2){sw2=false;e.stopImmediatePropagation()}sx=null},true)});
G.al=al;lab();pre()}
function lab(){ui.querySelector('.zg-n').textContent=(gi+1)+' / '+G.length;if(G.al[gi])clone.alt=G.al[gi]}
function pre(){[gi+1,gi-1].forEach(k=>{const u=G[(k+G.length)%G.length];if(isV(u))return;const p=new Image();p.src=u})}
const isV=u=>/\.mp4$/.test(u),pos=u=>u.replace(/-\d+\.mp4$/,'-poster.webp');let zv=null;
function vdrop(){if(zv){zv.remove();zv=null}}
function vput(){vdrop();if(!clone||!G||!isV(G[gi]))return;const u=G[gi],v=document.createElement('video');v.className='zoom-img zoom-vid';v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('aria-hidden','true');v.poster=pos(u);
v.innerHTML='<source src="'+u+'" type="video/mp4"><source src="'+u.replace(/\.mp4$/,'.webm')+'" type="video/webm">';['left','top','width','height'].forEach(k=>v.style[k]=clone.style[k]);document.body.appendChild(v);zv=v;if(!rm.matches)v.play().catch(()=>{})}
function fit(c,n){if(!c.dataset.b0)c.dataset.b0=JSON.stringify([c.style.left,c.style.top,c.style.width,c.style.height]);const ar=n.naturalWidth&&n.naturalHeight?n.naturalWidth/n.naturalHeight:0,b=JSON.parse(c.dataset.b0);if(!ar||Math.abs(ar-parseFloat(b[2])/parseFloat(b[3]))<.02){[c.style.left,c.style.top,c.style.width,c.style.height]=b;return}let w=innerWidth*.8,h=w/ar;if(h>innerHeight*.8){h=innerHeight*.8;w=h*ar}Object.assign(c.style,{left:(innerWidth-w)/2+'px',top:(innerHeight-h)/2+'px',width:w+'px',height:h+'px'})}
function show(k){if(!G||!clone)return;gi=(k+G.length)%G.length;const c=clone,u=G[gi],im=isV(u)?pos(u):u;vdrop();c.onerror=null;c.style.transition='opacity 160ms ease';c.style.opacity='0';
setTimeout(()=>{if(clone!==c)return;const n=new Image();n.onload=n.onerror=()=>{if(clone!==c)return;fit(c,n);c.src=im;c.style.opacity='1';vput()};n.src=im},160);lab();pre()}

// Mobile / touch viewer: full-screen, native horizontal scroll-snap; swipe down, backdrop or × to close
let mv=null;
function mopen(i){if(mv)return;const L=i.dataset.gallery?i.dataset.gallery.split(','):[i.dataset.zoom||i.currentSrc||i.src],A=(i.dataset.galleryAlts||'').split('|');
mv=document.createElement('div');mv.className='mv'+(rm.matches?' rm':'');mv.setAttribute('role','dialog');mv.setAttribute('aria-modal','true');mv.setAttribute('aria-label',i.alt||'Image viewer');
mv.innerHTML='<button class="mv-x" aria-label="Close">×</button><div class="mv-track">'+L.map((u,k)=>{const al=(A[k]||i.alt||'').replace(/"/g,'&quot;');return '<figure class="mv-s">'+(isV(u)?(rm.matches?'<img src="'+pos(u)+'" alt="'+al+'">':'<video muted loop playsinline autoplay preload="auto" poster="'+pos(u)+'" aria-label="'+al+'"><source src="'+u+'" type="video/mp4"><source src="'+u.replace(/\.mp4$/,'.webm')+'" type="video/webm"></video>'):'<img src="'+u+'" alt="'+al+'" decoding="async"'+(k>1?' loading="lazy"':'')+'>')+'</figure>'}).join('')+'</div>'+(L.length>1?'<span class="mv-n mono" aria-live="polite">1 / '+L.length+'</span>':'');
document.body.appendChild(mv);document.documentElement.classList.add('zoom-lock');const tr=mv.querySelector('.mv-track'),n=mv.querySelector('.mv-n');
tr.addEventListener('scroll',()=>{if(n)n.textContent=(Math.round(tr.scrollLeft/tr.clientWidth)+1)+' / '+L.length},{passive:true});
mv.querySelector('.mv-x').onclick=mclose;mv.addEventListener('click',e=>{if(!e.target.closest('img,button,video'))mclose()});
let y0=null,x0=0,dy=0;mv.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;y0=e.touches[0].clientY;x0=e.touches[0].clientX;dy=0},{passive:true});
mv.addEventListener('touchmove',e=>{if(y0==null)return;const t=e.touches[0],ddy=t.clientY-y0,ddx=t.clientX-x0;if(dy===0&&Math.abs(ddx)>Math.abs(ddy))return y0=null;dy=Math.max(0,ddy);if(dy>0){e.preventDefault();tr.style.transform='translateY('+dy+'px)';mv.style.setProperty('--a',Math.max(.25,1-dy/400))}},{passive:false});
mv.addEventListener('touchend',()=>{if(y0==null)return;y0=null;if(dy>90)mclose();else{tr.style.transform='';mv.style.removeProperty('--a')}});
requestAnimationFrame(()=>mv&&mv.classList.add('on'));mv.querySelector('.mv-x').focus({preventScroll:true})}
function mclose(){if(!mv)return;const m=mv;mv=null;m.classList.remove('on');setTimeout(()=>{m.remove();if(!clone)document.documentElement.classList.remove('zoom-lock')},rm.matches?0:200)}
document.addEventListener('keydown',e=>{if(mv&&e.key==='Escape')mclose()});
function open(i){if(busy||clone||!mq.matches)return;const sc=i.closest('.s-scroll');if(sc&&!sc.classList.contains('done'))return;busy=true;src=i;const r=i.getBoundingClientRect(),ar=r.width/r.height;
let w=innerWidth*.8,h=w/ar;if(h>innerHeight*.8){h=innerHeight*.8;w=h*ar}const x=(innerWidth-w)/2,y=(innerHeight-h)/2;
bd=document.createElement('div');bd.className='zoom-bd';document.body.appendChild(bd);
clone=new Image();clone.src=i.dataset.zoom||'/assets/work/rde-2-1600.webp';clone.onerror=()=>{clone.onerror=null;clone.src=i.dataset.zoomFallback||'/assets/work/rde-2.png'};clone.alt=i.alt;clone.className='zoom-img';
Object.assign(clone.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',transform:`translate(${r.left-x}px,${r.top-y}px) scale(${r.width/w})`});
document.body.appendChild(clone);gal(i);i.style.visibility='hidden';i.setAttribute('aria-expanded','true');document.documentElement.classList.add('zoom-lock');
clone.addEventListener('click',()=>close());bd.addEventListener('click',()=>close());
const t=rm.matches?0:D;requestAnimationFrame(()=>{clone.style.transition=`transform ${t}ms ${E}`;bd.style.transition=`opacity ${t}ms ease`;clone.style.transform='none';bd.style.opacity='1';setTimeout(()=>{busy=false;vput()},t)})}
function close(now){if(!clone||(busy&&!now))return;busy=true;vdrop();if(ui){ui.remove();ui=null;G=null}const i=src,c=clone,b=bd,r=i.getBoundingClientRect(),cr=c.getBoundingClientRect();
const t=(rm.matches||now)?0:D;c.style.transition=`transform ${t}ms ${E}`;b.style.transition=`opacity ${t}ms ease`;
if(c.dataset.b0&&JSON.stringify([c.style.left,c.style.top,c.style.width,c.style.height])!==c.dataset.b0){c.style.transition=`opacity ${t}ms ease`;c.style.opacity='0'}else c.style.transform=`translate(${r.left-parseFloat(c.style.left)}px,${r.top-parseFloat(c.style.top)}px) scale(${r.width/parseFloat(c.style.width)})`;b.style.opacity='0';
setTimeout(()=>{c.remove();b.remove();i.style.visibility='';i.setAttribute('aria-expanded','false');document.documentElement.classList.remove('zoom-lock');clone=bd=null;busy=false;i.focus({preventScroll:true})},t)}
function bind(i){i.addEventListener('click',e=>{if(!mq.matches){if(i.closest('.wk-img')){e.preventDefault();mopen(i)}return}e.preventDefault();open(i)});i.addEventListener('keydown',e=>{if(mq.matches&&(e.key==='Enter'||e.key===' ')){e.preventDefault();clone?close():open(i)}})}
document.querySelectorAll('.wk-img[data-anim]').forEach(d=>{if(rm.matches)return;const u=d.dataset.anim,v=document.createElement('video');v.className='wk-vid';v.muted=true;v.loop=true;v.playsInline=true;v.preload='none';v.setAttribute('aria-hidden','true');v.poster=pos(u);
v.innerHTML='<source src="'+u+'" type="video/mp4"><source src="'+u.replace(/\.mp4$/,'.webm')+'" type="video/webm">';d.appendChild(v);d.classList.add('has-anim');
const on=()=>{v.play().then(()=>d.classList.add('playing')).catch(()=>{})},off=()=>{d.classList.remove('playing');setTimeout(()=>{if(!d.classList.contains('playing'))v.pause()},350)};
d.addEventListener('mouseenter',()=>{if(mq.matches)on()});d.addEventListener('mouseleave',()=>{if(mq.matches)off()});
new IntersectionObserver(es=>es.forEach(e=>{if(mq.matches){if(!e.isIntersecting)off();return}e.isIntersecting?on():off()}),{threshold:.6}).observe(d)});
imgs.forEach(bind);window.axZoomAdd=i=>{if(imgs.includes(i))return;imgs.push(i);prep(i);bind(i)};
// Selected Work: any placeholder tile whose render file now exists becomes a zoomable image tile
document.querySelectorAll('.wk-img[data-art]:not(.vp)').forEach(d=>{const g=d.dataset.art,p=new Image();p.onload=()=>{const im=new Image();im.src='/assets/work/'+g+'-800.webp';im.srcset='/assets/work/'+g+'-800.webp 800w, /assets/work/'+g+'-1600.webp 1600w';im.sizes='(max-width:900px) 92vw, 340px';im.width=800;im.height=500;im.decoding='async';im.alt=(d.getAttribute('aria-label')||'').replace(/ render \(coming soon\)/,'');im.dataset.zoom='/assets/work/'+g+'-1600.webp';im.dataset.zoomFallback='/assets/work/'+g+'.webp';d.className='wk-img vp';d.removeAttribute('role');d.removeAttribute('aria-label');d.textContent='';d.appendChild(im);window.axZoomAdd(im)};p.src='/assets/work/'+g+'-800.webp'});
document.addEventListener('keydown',e=>{if(!clone)return;if(G&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();show(gi+(e.key==='ArrowRight'?1:-1));return}if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();close()}});
})();

// Scroll reveal (about page): cut line sweeps exterior -> section view while the block is pinned.
(()=>{const sw=document.querySelector('.sweep.rv');if(!sw)return;const st=sw.querySelector('.s-scroll');
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;let pt=0,pc=0,run=true;
if(rm){st.style.setProperty('--p',.5);st.style.setProperty('--o',1);const q=sw.querySelector('.rv-pct');if(q)q.textContent='50%';return}
const sk=sw.querySelector('.sticky'),pct=sw.querySelector('.rv-pct');let top=72,span=1;
function lay(){const fh=sk.offsetHeight;top=Math.max(64,(innerHeight-fh)/2);span=Math.round(innerHeight*1.1);sk.style.setProperty('--st',top+'px');sw.style.height=(fh+span)+'px'}
lay();addEventListener('resize',lay);addEventListener('load',lay);
function read(){const r=sw.getBoundingClientRect();let t=Math.min(1,Math.max(0,(top-r.top)/span));pt=t<.04?0:t>.96?1:(t-.04)/.92}
document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)requestAnimationFrame(tick)});
function tick(){if(!run)return;if(!document.documentElement.classList.contains('zoom-lock')){read();pc+=(pt-pc)*.08;if(Math.abs(pc-pt)<1e-4)pc=pt;
st.style.setProperty('--p',pc.toFixed(4));st.style.setProperty('--o',(pc<=.001||pc>=.999)?0:1);st.classList.toggle('done',pc>=.995);if(pct)pct.textContent=Math.round(pc*100)+'%'}requestAnimationFrame(tick)}
requestAnimationFrame(tick)})();
