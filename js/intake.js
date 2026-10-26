// Web3Forms access key. Get a free key at https://web3forms.com (enter your email, the key is emailed to you).
const WEB3FORMS_ACCESS_KEY = '4abdd290-d8bf-46f6-b11a-bef68203ede5';
// Address shown when the form isn't connected or sending fails. Leave '' to hide it.
const CONTACT_EMAIL = '';

const STORE = 'axiom-intake-v1';
const form = document.getElementById('intake');
const steps = [...form.querySelectorAll('.step')];
const prog = [...document.querySelectorAll('.progress li')];
const errBox = document.getElementById('errors');
const btnBack = document.getElementById('back'), btnNext = document.getElementById('next'), btnSubmit = document.getElementById('submit');
const result = document.getElementById('result');
const SERVICE_LABEL = {cad:'CAD for hire',axiom:'Computational design (Axiom)',automation:'Automation (Shelly / ESP32 / CLICK PLC)',plugin:'Rhino voxel-to-.3dm plugin interest',other:'Other'};
let cur = 1;

const service = () => (form.querySelector('[name=service]:checked') || {}).value;

function syncBranches(){
  form.querySelectorAll('.branch').forEach(b=>{
    const on = b.dataset.for === service();
    b.classList.toggle('on', on);
    b.querySelectorAll('input,select,textarea').forEach(el=>el.disabled = !on);
  });
}

function show(n, focus=true){
  cur = n;
  steps.forEach(s=>s.classList.toggle('active', +s.dataset.step===n));
  prog.forEach(p=>{const i=+p.dataset.p;p.classList.toggle('done',i<n);p.classList.toggle('cur',i===n);p.toggleAttribute('aria-current',i===n)});
  btnBack.hidden = n===1;
  btnNext.hidden = n===5; btnSubmit.hidden = n!==5;
  if(n===5) buildReview();
  errBox.textContent='';
  save();
  if(focus){const l=steps[n-1].querySelector('legend'); l.tabIndex=-1; l.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'});}
}

function labelFor(el){
  const fs = el.closest('fieldset.f');
  if(el.type==='radio') return (fs ? fs.querySelector('legend') : steps[1].querySelector('legend')).textContent.replace(/^\d+ — /,'').replace(' *','');
  const l = form.querySelector(`label[for="${el.id}"]`);
  return l ? l.childNodes[0].textContent.replace(' *','').trim() : el.name;
}

function validate(n){
  const errs=[]; const seen=new Set();
  steps[n-1].querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.disabled || el.name==='botcheck') return;
    el.removeAttribute('aria-invalid');
    if(el.type==='radio'){ if(seen.has(el.name)) return; seen.add(el.name);
      if(el.required && !form.querySelector(`[name="${el.name}"]:checked`)) errs.push({el,msg:`Please choose an option for "${labelFor(el)}".`}); return; }
    if(el.value) el.value = el.type==='checkbox' ? el.value : el.value.trim ? el.value : el.value;
    if(!el.checkValidity()){
      el.setAttribute('aria-invalid','true');
      let msg = `"${labelFor(el)}" `;
      if(el.validity.valueMissing) msg += 'is required.';
      else if(el.validity.typeMismatch) msg += el.type==='email' ? 'needs a valid email address.' : 'needs a full link starting with https://.';
      else if(el.validity.tooShort) msg += `needs at least ${el.minLength} characters.`;
      else msg += 'looks incorrect.';
      errs.push({el,msg});
    }
  });
  errBox.innerHTML='';
  if(errs.length){
    const ul=document.createElement('ul');
    errs.forEach(e=>{const li=document.createElement('li');li.textContent=e.msg;ul.appendChild(li)});
    errBox.appendChild(ul); errs[0].el.focus();
  }
  return !errs.length;
}

function data(){
  const fd = new FormData(form); const o={};
  for(const [k,v] of fd.entries()) if(k!=='botcheck' && v!=='') o[k]=v;
  return o;
}

function buildReview(){
  const dl=document.getElementById('review'); dl.innerHTML='';
  const d=data();
  form.querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.disabled||['botcheck','consent'].includes(el.name)||!(el.name in d)) return;
    if(el.type==='radio' && !el.checked) return;
    const dt=document.createElement('dt'), dd=document.createElement('dd');
    dt.textContent = el.name==='service' ? 'Service' : labelFor(el);
    dd.textContent = el.name==='service' ? SERVICE_LABEL[d.service] : d[el.name];
    dl.append(dt,dd);
  });
}

function save(){
  const d=data(); delete d.consent;
  try{localStorage.setItem(STORE, JSON.stringify({step:cur, d}))}catch(e){}
}
function restore(){
  let s; try{s=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
  if(!s) return 1;
  Object.entries(s.d||{}).forEach(([k,v])=>{
    form.querySelectorAll(`[name="${k}"]`).forEach(el=>{
      if(el.type==='radio') el.checked = el.value===v; else el.value=v;
    });
  });
  return Math.min(Math.max(+s.step||1,1),5);
}

function contactLine(){
  return CONTACT_EMAIL ? `Please email <a href="mailto:${CONTACT_EMAIL}?subject=Project%20inquiry">${CONTACT_EMAIL}</a> instead.` : 'Please contact us directly instead.';
}
function showResult(kind, title, html){
  form.hidden = kind==='ok'; document.querySelector('.progress').hidden = kind==='ok';
  result.className='result '+kind; result.hidden=false;
  result.innerHTML=`<h2></h2>${html}`; result.querySelector('h2').textContent=title; result.focus({preventScroll:true}); kind==='ok'?window.scrollTo(0,0):result.scrollIntoView({block:'nearest'});
}

btnNext.addEventListener('click',()=>{ if(validate(cur)) show(cur+1) });
btnBack.addEventListener('click',()=>show(cur-1));
form.addEventListener('input',()=>{syncBranches();save()});
form.addEventListener('change',()=>{syncBranches();save()});
form.addEventListener('keydown',e=>{ if(e.key==='Enter' && e.target.tagName!=='TEXTAREA' && e.target.type!=='submit' && e.target.tagName!=='BUTTON'){ e.preventDefault(); if(cur<5) btnNext.click(); else btnSubmit.click(); }});

form.addEventListener('submit', async e=>{
  e.preventDefault();
  if(!validate(5)) return;
  if(document.getElementById('botcheck').checked) { showResult('ok','Thanks — request received.','<p>We will be in touch.</p>'); return; }
  const d=data();
  if(!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY==='REPLACE_ME'){
    showResult('err','Form not yet connected.',`<p>Online submission isn't switched on yet, so nothing was sent. Your answers are saved in this browser.</p><p>${contactLine()}</p>`);
    return;
  }
  const payload = {access_key:WEB3FORMS_ACCESS_KEY, subject:`New intake: ${SERVICE_LABEL[d.service]} — ${d.name}`, from_name:'Axiom / MMF website', botcheck:false, ...d, service:SERVICE_LABEL[d.service]};
  btnSubmit.disabled=true; btnSubmit.textContent='Sending…';
  try{
    const r = await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
    const j = await r.json().catch(()=>({}));
    if(r.ok && j.success){
      localStorage.removeItem(STORE);
      showResult('ok','Thanks — request received.',`<p>We reply within two business days with next steps or a fixed quote. A copy of your answers went to our inbox.</p><p><a class="btn ghost" href="index.html">Back to home</a></p>`);
    } else throw new Error(j.message || `HTTP ${r.status}`);
  }catch(err){
    showResult('err','Something went wrong.',`<p>Your request didn't send (${String(err.message).replace(/[<>&]/g,'')}). Your answers are still saved, so you can try again.</p><p>${contactLine()}</p><p><button class="btn" type="button" onclick="location.reload()">Try again</button></p>`);
  }finally{btnSubmit.disabled=false; btnSubmit.textContent='Submit request';}
});

// Screenshot/testing hook: intake.html?demo=N fills sample data and opens step N
const q=new URLSearchParams(location.search);
if(q.has('demo')){
  const s={name:'Sample Client',email:'client@example.com',company:'Example Ltd.',service:q.get('svc')||'automation',au_site:'Machine shop / manufacturing',au_io:'8–32',au_onsite:'yes',au_location:'Belleville, ON',description:'Monitor spindle runtime on three mills and alert on coolant level.',budget:'$1,000–$5,000',timeline:'2–6 weeks',controlled:'no',referral:'Search'};
  Object.entries(s).forEach(([k,v])=>form.querySelectorAll(`[name="${k}"]`).forEach(el=>{if(el.type==='radio')el.checked=el.value===v;else el.value=v}));
  syncBranches(); show(+q.get('demo')||1,false);
  if(q.has('fallback')){document.getElementById('consent').checked=true;form.requestSubmit()}
  if(q.has('err')){show(1,false);document.getElementById('email').value='bad';validate(1)}
} else {
  let st=restore(); const pre=q.get('service');
  const r=pre&&form.querySelector(`[name=service][value="${CSS.escape(pre)}"]`);
  if(r){r.checked=true; if(st<2) st=2;}
  syncBranches(); show(st, false);
}
