if(location.search.includes("m=1"))document.documentElement.classList.add("m");
if(location.search.includes("static"))document.documentElement.classList.add("static");
// Scroll reveal
const els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)||location.search.includes('static')){els.forEach(e=>e.classList.add('in'))}
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});els.forEach(e=>io.observe(e))}
// Abstract rings for flagship placeholder (not engine geometry)
const g=document.getElementById('rings');
if(g){for(let i=0;i<18;i++){const c=document.createElementNS('http://www.w3.org/2000/svg','ellipse');c.setAttribute('cx',300);c.setAttribute('cy',300);c.setAttribute('rx',60+i*12);c.setAttribute('ry',(60+i*12)*0.38);c.setAttribute('transform',`rotate(${i*10} 300 300)`);g.appendChild(c)}}
// Hero voxel field
const cv=document.getElementById('field'),ctx=cv.getContext('2d');let W,H,t=0;
function rs(){W=cv.width=cv.offsetWidth*devicePixelRatio;H=cv.height=cv.offsetHeight*devicePixelRatio}
addEventListener('resize',rs);rs();
const still=location.search.includes('static')||matchMedia('(prefers-reduced-motion:reduce)').matches;
function draw(){ctx.clearRect(0,0,W,H);const s=Math.max(10,W/90);
for(let x=0;x<W;x+=s)for(let y=0;y<H;y+=s){const v=Math.sin(x*.004+t)*Math.cos(y*.006-t*.7)+Math.sin((x+y)*.002+t*.5);
if(v>.35){ctx.fillStyle=v>1.2?'rgba(255,106,43,.8)':'rgba(232,230,225,'+(v-.6)*.5+')';ctx.fillRect(x,y,s*.72,s*.72)}}
t+=.006;if(!still)requestAnimationFrame(draw)}
draw();
