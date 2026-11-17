export function getConnectPageHtml(instanceId: string): string {
  const safeId = JSON.stringify(instanceId)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conectar WhatsApp via Baileys — Sancar</title>
<link rel="icon" type="image/png" href="https://sancar.space/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --verde-carvalho:#0B2C24;
  --verde-800:#0B2C24;
  --verde-400:#4ADE80;
  --verde-100:#E6EFE9;
  --cinza-900:#0F0F0F;
  --cinza-500:#7F8985;
  --cinza-200:#E2E5E3;
  --cinza-100:#EAEAEA;
  --cinza-050:#F5F6F5;
  --branco:#FFFFFF;
  --erro:#C24B3E;
  --erro-bg:#F8E5E2;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:var(--cinza-050);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;color:var(--cinza-900)}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.brand-logo{width:36px;height:36px;background:var(--verde-carvalho);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.brand-logo svg{width:22px;height:22px;fill:#fff}
.brand-name{display:flex;flex-direction:column;line-height:1}
.brand-title{font-family:'Lexend',sans-serif;font-weight:700;font-size:1rem;color:var(--verde-carvalho)}
.brand-sub{font-size:.72rem;color:var(--cinza-500);font-weight:500;letter-spacing:.03em}
.card{background:var(--branco);border-radius:16px;box-shadow:0 2px 16px rgba(11,44,36,.08);padding:28px 32px;max-width:420px;width:100%}
h1{font-family:'Lexend',sans-serif;font-size:1.3rem;font-weight:700;color:var(--verde-carvalho);margin-bottom:3px}
.subtitle{color:var(--cinza-500);font-size:.82rem;margin-bottom:18px}
.status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:.82rem;font-weight:600;margin-bottom:18px}
.status-badge.connected{background:var(--verde-100);color:var(--verde-carvalho)}
.status-badge.qr_pending{background:#fef9c3;color:#6b5a00}
.status-badge.connecting{background:var(--verde-100);color:var(--verde-carvalho)}
.status-badge.disconnected{background:var(--erro-bg);color:var(--erro)}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor}
.qr-wrap{text-align:center;margin:10px 0}
.qr-wrap img{max-width:200px;border:1px solid var(--cinza-200);border-radius:12px;padding:8px}
.qr-hint{color:var(--cinza-500);font-size:.82rem;margin-top:8px}
.timer{color:var(--cinza-500);font-size:.78rem;margin-top:4px}
.divider{display:flex;align-items:center;gap:12px;margin:14px 0;color:var(--cinza-500);font-size:.82rem}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--cinza-200)}
.input-wrap{display:flex;gap:8px;margin-bottom:12px}
input[type=tel]{flex:1;padding:10px 14px;border:1.5px solid var(--cinza-200);border-radius:10px;font-size:.9rem;font-family:'Inter',sans-serif;outline:none;color:var(--cinza-900)}
input[type=tel]:focus{border-color:var(--verde-carvalho)}
button{padding:10px 18px;border:none;border-radius:10px;font-size:.9rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all .15s}
.btn-p{background:var(--verde-carvalho);color:#fff;width:100%;margin-bottom:10px}
.btn-p:hover{background:#0d3529}
.btn-p:disabled{opacity:.5;cursor:not-allowed}
.btn-s{background:var(--cinza-100);color:var(--cinza-900);width:100%}
.btn-s:hover{background:var(--cinza-200)}
.code-box{background:var(--verde-carvalho);color:var(--verde-400);font-size:2.2rem;font-weight:700;letter-spacing:.35em;text-align:center;padding:20px;border-radius:12px;margin:16px 0;font-family:monospace}
.code-hint{color:var(--cinza-500);font-size:.82rem;text-align:center;line-height:1.6}
.hidden{display:none!important}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
.conn-box{background:var(--verde-100);border:1px solid var(--verde-400);border-radius:12px;padding:16px;text-align:center;margin-top:12px}
.conn-phone{font-size:1.1rem;font-weight:700;color:var(--verde-carvalho);font-family:'Lexend',sans-serif}
.conn-label{color:var(--cinza-500);font-size:.82rem;margin-top:4px}
.err-box{background:var(--erro-bg);border:1px solid #f5c6c3;border-radius:10px;padding:12px;color:var(--erro);font-size:.85rem;margin-top:12px}
</style>
</head>
<body>
<div class="brand">
  <div class="brand-logo">
    <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 4H6.5C5.1 4 4 5.1 4 6.5v3.5c0 1.4 1.1 2.5 2.5 2.5H11v1H7a1 1 0 0 0 0 2h4v1.5c0 1.4 1.1 2.5 2.5 2.5h1c1.4 0 2.5-1.1 2.5-2.5v-3c0-1.4-1.1-2.5-2.5-2.5H11V9h4.5C16.9 9 18 7.9 18 6.5v-1C18 4.1 16.9 4 15.5 4z" opacity=".0"/>
      <text x="4" y="17" font-family="Lexend,sans-serif" font-weight="700" font-size="15" fill="white">S.</text>
    </svg>
  </div>
  <div class="brand-name">
    <span class="brand-title">Stella · Sancar</span>
    <span class="brand-sub">Conectar WhatsApp via Baileys</span>
  </div>
</div>
<div class="card">
  <h1>Conectar WhatsApp</h1>
  <p class="subtitle">Instância: <code>${instanceId}</code></p>
  <div id="badge" class="status-badge connecting"><span class="dot"></span><span id="badge-txt">Verificando...</span></div>

  <div id="conn-ok" class="hidden">
    <div class="conn-box">
      <div class="conn-phone" id="conn-phone">Conectado</div>
      <div class="conn-label">WhatsApp conectado ✓</div>
    </div>
    <br>
    <button class="btn-s" onclick="goInitial()">Reconectar outro número</button>
  </div>

  <div id="main-section">
    <div id="initial-section">
      <button class="btn-p" onclick="startQR()">Conectar via QR Code</button>
      <div class="divider">ou</div>
      <button class="btn-s" onclick="showCode()">Conectar com número de telefone</button>
    </div>

    <div id="qr-section" class="hidden">
      <div class="qr-wrap">
        <div id="qr-loading" style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 0">
          <div style="width:40px;height:40px;border:3px solid var(--cinza-200);border-top-color:var(--verde-carvalho);border-radius:50%;animation:spin .7s linear infinite"></div>
          <span style="color:var(--cinza-500);font-size:.85rem">Gerando QR code...</span>
        </div>
        <img id="qr-img" src="" alt="QR Code" class="hidden">
        <p class="qr-hint hidden" id="qr-hint-txt">WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
        <p class="timer" id="qr-timer"></p>
      </div>
      <button class="btn-s" onclick="goInitial()">Cancelar</button>
    </div>

    <div id="code-section" class="hidden">
      <div class="input-wrap">
        <input type="tel" id="phone-in" placeholder="+55 11 98765-4321">
        <button class="btn-p" id="code-btn" onclick="getCode()" style="width:auto">Obter código</button>
      </div>
      <div id="code-display" class="hidden">
        <div class="code-box" id="code-val">---- ----</div>
        <p class="code-hint">Digite este código em:<br><b>WhatsApp → Dispositivos conectados → Vincular com número de telefone</b></p>
      </div>
      <div id="err" class="err-box hidden"></div>
      <br>
      <button class="btn-s" onclick="goInitial()">Cancelar</button>
    </div>
  </div>
</div>

<script>
const IID = ${safeId};
const BASE = '/connect/'+IID;
const JSON_H = {'Content-Type':'application/json'};
let pollT = null, cdT = null, connPollT = null, mode = 'init';

const $=id=>document.getElementById(id);
const hide=id=>$(id).classList.add('hidden');
const show=id=>$(id).classList.remove('hidden');

function setBadge(cls, txt){
  const b=$('badge'); b.className='status-badge '+cls;
  $('badge-txt').textContent=txt;
}
function showErr(msg){ const e=$('err'); e.textContent=msg; show('err'); }
function hideErr(){ hide('err'); }

async function checkStatus(){
  try{
    const r=await fetch(BASE+'/status');
    if(r.status===404){setBadge('disconnected','Desconectado');return;}
    const d=await r.json();
    if(d.status==='connected') onConnected(d.phoneNumber);
    else if(d.status==='qr_pending') setBadge('qr_pending','Aguardando QR');
    else if(d.status==='connecting') setBadge('connecting','Conectando...');
    else setBadge('disconnected','Desconectado');
  }catch(e){}
}

function onConnected(phone){
  stopAll();
  mode='connected';
  setBadge('connected','Conectado');
  $('conn-phone').textContent = phone ? '+'+phone : 'Conectado';
  hide('main-section'); show('conn-ok');
}

function goInitial(){
  stopAll(); mode='init';
  setBadge('disconnected','Desconectado');
  show('main-section'); hide('conn-ok');
  show('initial-section'); hide('qr-section'); hide('code-section');
  hide('code-display'); hideErr();
  // Reset QR section state for next use
  $('qr-img').src=''; hide('qr-img'); hide('qr-hint-txt'); show('qr-loading');
  $('qr-timer').textContent='';
}

async function startQR(){
  hideErr(); hide('initial-section');
  setBadge('connecting','Iniciando sessão...');
  try{
    const r=await fetch(BASE+'/start',{method:'POST',headers:JSON_H,body:JSON.stringify({instanceId:IID})});
    const d=await r.json();
    if(!r.ok){setBadge('disconnected','Erro'); show('initial-section'); return;}
    show('qr-section'); mode='qr'; pollQr();
  }catch(e){show('initial-section');}
}

function stopAll(){
  if(pollT){clearInterval(pollT);pollT=null;}
  if(cdT){clearTimeout(cdT);cdT=null;}
  if(connPollT){clearInterval(connPollT);connPollT=null;}
}

async function pollQr(){
  stopAll();
  await fetchQr();
  pollT=setInterval(fetchQr,20000);
}

async function fetchQr(){
  try{
    const r=await fetch(BASE+'/qr');
    const d=await r.json();
    if(d.status==='connected'){onConnected(d.phoneNumber);return;}
    if(d.qr){$('qr-img').src=d.qr;show('qr-img');show('qr-hint-txt');hide('qr-loading');setBadge('qr_pending','Aguardando escaneamento');startCd();}
  }catch(e){}
}

function startCd(){
  let s=20;
  const tick=()=>{ $('qr-timer').textContent='Atualizando em '+s+'s'; if(s>0){s--;cdT=setTimeout(tick,1000);}};
  tick();
}

function showCode(){
  hideErr(); hide('initial-section'); show('code-section'); mode='code';
}

async function getCode(){
  const phone=$('phone-in').value.trim();
  if(!phone){showErr('Digite o número com DDD e código do país. Ex: +55 11 98765-4321');return;}
  hideErr(); hide('code-display');
  const btn=$('code-btn'); btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span>Aguarde...';
  setBadge('connecting','Solicitando código...');
  try{
    const r=await fetch(BASE+'/pairing-code',{method:'POST',headers:JSON_H,body:JSON.stringify({phoneNumber:phone,instanceId:IID})});
    const d=await r.json();
    btn.disabled=false; btn.textContent='Novo código';
    if(!r.ok){showErr(d.error||'Erro ao obter código. Tente novamente.');setBadge('disconnected','Erro');return;}
    const fmt=d.code.replace(/(.{4})(.{4})/,'$1-$2');
    $('code-val').textContent=fmt; show('code-display');
    setBadge('connecting','Aguardando confirmação no WhatsApp...');
    stopAll();
    connPollT=setInterval(async()=>{
      const r2=await fetch(BASE+'/status');
      if(!r2.ok) return;
      const d2=await r2.json();
      if(d2.status==='connected'){onConnected(d2.phoneNumber);}
    },3000);
    setTimeout(()=>{ if(mode!=='connected'){clearInterval(connPollT);setBadge('disconnected','Tempo esgotado. Tente novamente.');}},120000);
  }catch(e){btn.disabled=false;btn.textContent='Obter código';showErr(e.message);}
}

checkStatus();
setInterval(checkStatus,20000);
</script>
</body>
</html>`
}
