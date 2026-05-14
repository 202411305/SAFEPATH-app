const NODES={
  'Main Gate':{x:.08,y:.5,type:'entrance'},
  'Gate 2':{x:.08,y:.25,type:'entrance'},
  'Admin Building':{x:.28,y:.22,type:'building'},
  'Library':{x:.28,y:.5,type:'building'},
  'Canteen':{x:.28,y:.75,type:'building'},
  'CCS Building':{x:.52,y:.22,type:'building'},
  'Science Hall':{x:.52,y:.5,type:'building'},
  'Gym':{x:.52,y:.75,type:'building'},
  'Chapel':{x:.72,y:.35,type:'building'},
  'Nursing Bldg':{x:.72,y:.65,type:'building'},
  'Emergency Exit 1':{x:.9,y:.2,type:'exit'},
  'Emergency Exit 2':{x:.9,y:.8,type:'exit'},
  'Elevator A':{x:.4,y:.35,type:'elevator'},
  'Ramp B':{x:.4,y:.65,type:'accessible'},
  'Stairs 1':{x:.6,y:.42,type:'stairs'},
};

const EDGES=[
  ['Main Gate','Library',40],['Main Gate','Canteen',50],
  ['Gate 2','Admin Building',35],['Gate 2','Library',45],
  ['Admin Building','Library',30],['Admin Building','CCS Building',40],
  ['Library','Science Hall',35],['Library','Canteen',30],
  ['Library','Elevator A',20],['Elevator A','Admin Building',25],
  ['Elevator A','CCS Building',30],
  ['Canteen','Gym',30],['Canteen','Ramp B',15],
  ['Ramp B','Gym',20],['Ramp B','Science Hall',30],
  ['CCS Building','Chapel',40],['CCS Building','Stairs 1',20],
  ['Stairs 1','Science Hall',15],['Science Hall','Chapel',35],
  ['Science Hall','Nursing Bldg',35],['Gym','Nursing Bldg',30],
  ['Chapel','Emergency Exit 1',25],['Nursing Bldg','Emergency Exit 2',25],
  ['CCS Building','Emergency Exit 1',50],['Gym','Emergency Exit 2',40],
];

const PWD_AVOID=['Stairs 1'];

let currentPath=[];let emergencyMode=false;let currentStatus='Online';
let userName='Juan dela Cruz';let userEmail='22-01234@gordoncollege.edu.ph';
let avatarDataUrl=null;

// Hide splash screen after loading
setTimeout(() => {
  document.getElementById('splash').classList.add('hide');
}, 3000);

function authTab(id,el){
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel'+id.charAt(0).toUpperCase()+id.slice(1)).classList.add('active');
}

function setLoginRole(role){
  document.getElementById('roleUser').classList.toggle('active', role==='user');
  document.getElementById('roleAdmin').classList.toggle('active', role==='admin');
  document.getElementById('roleNote').textContent = role==='admin'
    ? 'Safety Admin access is restricted to approved accounts only.'
    : 'Users can navigate, report incidents, and use emergency routing.';
  document.getElementById('li_email').placeholder = role==='admin'
    ? 'Enter admin email'
    : 'e.g. 22-01234 or name@gordoncollege.edu.ph';
}

function doLogin() {
  const e = document.getElementById('li_email').value.trim();
  const p = document.getElementById('li_pass').value;

  if (!e || !p) {
    toast('Please enter email and password.');
    return;
  }

  toast('Verifying credentials...');

  setTimeout(() => {
    // Gagawa tayo ng display name base sa email
    const name = e.split('@')[0].charAt(0).toUpperCase() + e.split('@')[0].slice(1);
    
    // Pasok agad sa system!
    launchApp(name, e);
    
    toast('Login successful! Welcome to SafePath.');
  }, 600);
}

function verifyOtp(){
  const v=document.getElementById('otpInput').value;
  if(v.length!==6){toast('Enter the 6-digit code.');return;}
  closeModal('mOtp');
  const e=document.getElementById('otpInput').dataset.email||'student@gordoncollege.edu.ph';
  const name=e.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  launchApp(name,e);
}

function doRegister() {
    toast('Registration is disabled for this demo.');
}

function launchApp(name, email) {
    userName = name; 
    userEmail = email;
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('app').classList.add('show');
    
    // Update UI Elements
    document.getElementById('profName').textContent = name;
    document.getElementById('profEmail').textContent = email;
    document.getElementById('dtName').textContent = name;
    updateAvatarDisplay(name);
    
    // Initializers
    initMap();
    populateSelects();
}

function updateAvatarDisplay(name) {
  const avatar = document.getElementById('avatarCircle');
  if (!avatar) return;
  if (avatarDataUrl) {
    avatar.style.backgroundImage = `url(${avatarDataUrl})`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
    avatar.textContent = '';
  } else {
    avatar.style.backgroundImage = 'none';
    avatar.style.backgroundColor = '#1a7a4a';
    const initials = name.split(' ').map(w => w[0] || '').join('').slice(0,2).toUpperCase();
    avatar.textContent = initials;
  }
}

function triggerAvatarUpload() {
  document.getElementById('avatarUpload').click();
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Please choose a valid image file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    avatarDataUrl = reader.result;
    updateAvatarDisplay(document.getElementById('dtNameEdit').value.trim() || userName);
    toast('Photo selected. Save changes to apply.');
  };
  reader.readAsDataURL(file);
}

function doLogout(){
  document.getElementById('app').classList.remove('show');
  document.getElementById('overlay').style.display='flex';
  currentPath=[];emergencyMode=false;
  document.getElementById('emergBtn').classList.remove('active');
}

function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){
  document.getElementById(id).classList.remove('open');
  if(id==='mQR'&&qrCountdownTimer){clearInterval(qrCountdownTimer);qrCountdownTimer=null;document.getElementById('qrCountdown').style.color='inherit';document.getElementById('qrCountdown').textContent='5:00';}
}
function openTerms(){openModal('mTerms');}
function acceptTerms(){document.getElementById('termsCheck').checked=true;closeModal('mTerms');}
function openReset(){openModal('mReset');}
let resetStep1=true;
function resetStep(){
  if(resetStep1){
    const c=document.getElementById('rst_contact').value.trim();
    if(!c){toast('Enter your email or phone.');return;}
    document.getElementById('rst_step2').style.display='block';
    document.getElementById('rstBtn').textContent='Reset Password';
    resetStep1=false;toast('OTP sent!');
  } else {
    const otp=document.getElementById('rst_otp').value;
    const np=document.getElementById('rst_new').value;
    const cp=document.getElementById('rst_confirm').value;
    if(otp.length!==6){toast('Enter the 6-digit OTP.');return;}
    if(np!==cp){toast('Passwords do not match.');return;}
    closeModal('mReset');toast('Password reset successfully!');
    resetStep1=true;document.getElementById('rst_step2').style.display='none';
    document.getElementById('rstBtn').textContent='Send Code';
  }
}
let qrCountdownTimer=null;
function startQRCountdown(){
  if(qrCountdownTimer)clearInterval(qrCountdownTimer);
  let timeLeft=300;
  const updateDisplay=()=>{
    const min=Math.floor(timeLeft/60);
    const sec=(timeLeft%60).toString().padStart(2,'0');
    document.getElementById('qrCountdown').textContent=`${min}:${sec}`;
    if(timeLeft===30){document.getElementById('qrCountdown').style.color='var(--danger)';}
    if(timeLeft===0){
      clearInterval(qrCountdownTimer);
      document.getElementById('qrCountdown').textContent='EXPIRED';
      document.getElementById('qrCountdown').style.color='var(--danger)';
      return;
    }
    timeLeft--;
  };
  updateDisplay();
  qrCountdownTimer=setInterval(updateDisplay,1000);
}
function openQR(){openModal('mQR');startQRCountdown();}

function goSec(name){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('nav'+name).classList.add('active');
  if(name==='Nav'){setTimeout(drawMap,50);}
}

function toast(msg,dur=2500){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),dur);
}

function populateSelects(){
  const keys=Object.keys(NODES);
  ['startSel','endSel'].forEach((id,i)=>{
    const sel=document.getElementById(id);
    sel.innerHTML='<option value="">— Select location —</option>';
    keys.forEach(k=>{sel.innerHTML+=`<option>${k}</option>`;});
    if(i===0)sel.value='Main Gate';
    if(i===1)sel.value='CCS Building';
  });
}

let canvas,ctx,W,H;
function initMap(){
  canvas=document.getElementById('mapCanvas');
  ctx=canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize',()=>{resizeCanvas();drawMap();});
  drawMap();
}
function resizeCanvas(){
  const rect=canvas.parentElement.getBoundingClientRect();
  W=canvas.width=rect.width;
  H=canvas.height=parseInt(getComputedStyle(canvas).height)||260;
}
function nodePos(k){return{x:NODES[k].x*W,y:NODES[k].y*H};}

function drawMap(){
  if(!ctx)return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#f0f3eb';ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='#e0e8e2';ctx.lineWidth=1;
  for(let x=40;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=40;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const pathSet=new Set();
  for(let i=1;i<currentPath.length;i++){pathSet.add(currentPath[i-1]+'|'+currentPath[i]);pathSet.add(currentPath[i]+'|'+currentPath[i-1]);}

  EDGES.forEach(([a,b])=>{
    const pa=nodePos(a),pb=nodePos(b);
    const inPath=pathSet.has(a+'|'+b);
    ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
    ctx.strokeStyle=inPath?'#f59e0b':'#c8d8ce';
    ctx.lineWidth=inPath?4:2;
    ctx.setLineDash(inPath?[]:[4,3]);
    ctx.stroke();ctx.setLineDash([]);
  });

  Object.entries(NODES).forEach(([k,v])=>{
    const {x,y}=nodePos(k);
    const isStart=currentPath[0]===k,isEnd=currentPath[currentPath.length-1]===k;
    const inPath=currentPath.includes(k);
    const colors={building:'#3b82f6',exit:'#ef4444',stairs:'#f97316',elevator:'#38bdf8',accessible:'#22c55e',entrance:'#8b5cf6'};
    let col=colors[v.type]||'#888';
    if(isStart)col='#ec4899';else if(isEnd)col='#14b8a6';else if(inPath)col='#f59e0b';
    ctx.beginPath();ctx.arc(x,y,inPath?9:7,0,Math.PI*2);
    ctx.fillStyle=col;ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#1a2a1e';ctx.font=`bold ${Math.max(9,W/70)}px Segoe UI,sans-serif`;
    ctx.textAlign='center';
    const label=k.length>12?k.substring(0,11)+'…':k;
    ctx.fillText(label,x,y+(inPath?9:7)+12);
  });
}

function dijkstra(start,end,usePWD,useAStar){
  const keys=Object.keys(NODES);
  const graph={};
  keys.forEach(k=>{graph[k]={};});
  EDGES.forEach(([a,b,w])=>{
    if(usePWD&&(PWD_AVOID.includes(a)||PWD_AVOID.includes(b)))return;
    graph[a][b]=w;graph[b][a]=w;
  });
  const dist={},prev={},visited=new Set();
  keys.forEach(k=>{dist[k]=Infinity;prev[k]=null;});
  dist[start]=0;
  const pq=[...keys];
  let nodesVisited=0;
  while(pq.length){
    pq.sort((a,b)=>{
      let da=dist[a],db=dist[b];
      if(useAStar){
        const ea=NODES[end]?Math.hypot((NODES[a].x-NODES[end].x),(NODES[a].y-NODES[end].y))*100:0;
        const eb=NODES[end]?Math.hypot((NODES[b].x-NODES[end].x),(NODES[b].y-NODES[end].y))*100:0;
        da+=ea;db+=eb;
      }
      return da-db;
    });
    const u=pq.shift();
    if(dist[u]===Infinity)break;
    visited.add(u);nodesVisited++;
    if(u===end)break;
    Object.entries(graph[u]).forEach(([nb,w])=>{
      if(!visited.has(nb)&&dist[u]+w<dist[nb]){dist[nb]=dist[u]+w;prev[nb]=u;}
    });
  }
  const path=[];let cur=end;
  while(cur){path.unshift(cur);cur=prev[cur];}
  return path[0]===start?{path,dist:dist[end],visited:nodesVisited}:null;
}

function findPath(){
  const s=document.getElementById('startSel').value;
  const e=document.getElementById('endSel').value;
  if(!s||!e){toast('Please select both start and end locations.');return;}
  if(s===e){toast('Start and end cannot be the same.');return;}
  const pwd=document.getElementById('pwdToggle').checked;
  const algo=document.getElementById('algoToggle').checked;
  const result=dijkstra(s,e,pwd,algo);
  if(!result){toast('No path found. Try disabling PWD Mode.');return;}
  currentPath=result.path;
  document.getElementById('statAlgo').textContent=algo?'A*':'Dijkstra';
  document.getElementById('statDist').textContent=result.dist+'m';
  document.getElementById('statNodes').textContent=result.visited;
  document.getElementById('statMode').textContent=pwd?'PWD':'Standard';
  const dl=document.getElementById('dirList');
  dl.innerHTML='';
  result.path.forEach((node,i)=>{
    const li=document.createElement('li');
    li.className='dir-item';
    li.textContent=i===0?`Start at ${node}`:i===result.path.length-1?`Arrive at ${node}`:`Continue to ${node}`;
    dl.appendChild(li);
  });
  drawMap();
  toast(`Route found! ${result.dist}m via ${result.path.length} stops.`);
}

function clearPath(){
  currentPath=[];
  document.getElementById('statAlgo').textContent='Dijkstra';
  document.getElementById('statDist').textContent='—';
  document.getElementById('statNodes').textContent='—';
  document.getElementById('statMode').textContent='Standard';
  document.getElementById('dirList').innerHTML='<li class="dir-empty">Select a start and end point, then tap Find Path.</li>';
  drawMap();
}

function onPWD(){const v=document.getElementById('pwdToggle').checked;toast(v?'PWD Mode on — stairs avoided.':'PWD Mode off.');}
function onAlgo(){
  const v=document.getElementById('algoToggle').checked;
  document.getElementById('algoDesc').textContent=v?'A* — heuristic, faster search':'Dijkstra — guaranteed shortest';
  document.getElementById('statAlgo').textContent=v?'A*':'Dijkstra';
}

function toggleEmergency(){
  emergencyMode=!emergencyMode;
  const btn=document.getElementById('emergBtn');
  const banner=document.getElementById('emerBanner');
  btn.classList.toggle('active',emergencyMode);
  banner.classList.toggle('show',emergencyMode);
  if(emergencyMode){
    const exits=Object.keys(NODES).filter(k=>NODES[k].type==='exit');
    let best=null,bestDist=Infinity;
    const start=document.getElementById('startSel').value||'Main Gate';
    exits.forEach(exit=>{
      const r=dijkstra(start,exit,false,false);
      if(r&&r.dist<bestDist){bestDist=r.dist;best=r;}
    });
    if(best){
      currentPath=best.path;
      document.getElementById('statDist').textContent=bestDist+'m';
      drawMap();
      toast('🚨 Emergency route to nearest exit!',3500);
    }
  } else {
    clearPath();banner.textContent='';
    toast('Emergency mode deactivated.');
  }
}

function setStatus(s){
  currentStatus=s;
  document.getElementById('hdrDot').className='dot '+(s==='Online'?'online':s==='Busy'?'busy':'dnd');
  document.getElementById('hdrStatus').textContent=s;
  ['Online','Busy','DND'].forEach(st=>{
    const btn=document.getElementById('s'+st.charAt(0).toUpperCase()+st.slice(1).toLowerCase().replace('dn','Dn'));
    if(btn)btn.className='status-btn';
  });
  const map={Online:'sOnline',Busy:'sBusy',DND:'sDnd'};
  const classMap={Online:'active-online',Busy:'active-busy',DND:'active-dnd'};
  if(document.getElementById(map[s]))document.getElementById(map[s]).className='status-btn '+classMap[s];
  toast('Status set to '+s);
}

function genReport(type){
  const label=type==='weekly'?'Weekly':'Monthly';
  const today=new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'});
  document.getElementById('reportPreview').innerHTML=`
    <div style="text-align:left;width:100%">
      <div style="font-weight:600;font-size:14px;color:var(--primary);margin-bottom:.5rem">${label} Navigation Report</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:.75rem">Generated: ${today}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:13px">
        <div><span style="color:var(--text3)">Total Routes</span><br><b style="color:var(--text)">12</b></div>
        <div><span style="color:var(--text3)">Avg Distance</span><br><b style="color:var(--text)">145m</b></div>
        <div><span style="color:var(--text3)">PWD Routes</span><br><b style="color:var(--text)">3</b></div>
        <div><span style="color:var(--text3)">Emergency Uses</span><br><b style="color:var(--text)">0</b></div>
      </div>
    </div>`;
  toast(label+' report generated!');
}

function toggleFaq(el){el.classList.toggle('open');}
