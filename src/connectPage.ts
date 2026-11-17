export function getConnectPageHtml(instanceId: string): string {
  const safeId = JSON.stringify(instanceId)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conectar WhatsApp — Stella</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:32px;max-width:420px;width:100%}
h1{font-size:1.4rem;font-weight:700;color:#1a1a2e;margin-bottom:4px}
.subtitle{color:#6b7280;font-size:.85rem;margin-bottom:20px}
.status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:.82rem;font-weight:600;margin-bottom:20px}
.status-badge.connected{background:#dcfce7;color:#166534}
.status-badge.qr_pending{background:#fef9c3;color:#854d0e}
.status-badge.connecting{background:#e0e7ff;color:#3730a3}
.status-badge.disconnected{background:#fee2e2;color:#991b1b}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor}
.qr-wrap{text-align:center;margin:12px 0}
.qr-wrap img{max-width:200px;border:1px solid #e5e7eb;border-radius:12px;padding:8px}
.qr-hint{color:#6b7280;font-size:.82rem;margin-top:8px}
.timer{color:#9ca3af;font-size:.78rem;margin-top:4px}
.divider{display:flex;align-items:center;gap:12px;margin:16px 0;color:#9ca3af;font-size:.82rem}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#e5e7eb}
.input-wrap{display:flex;gap:8px;margin-bottom:12px}
input[type=tel]{flex:1;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:.9rem;outline:none}
input[type=tel]:focus{border-color:#6366f1}
button{padding:10px 18px;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn-p{background:#6366f1;color:#fff;width:100%;margin-bottom:10px}
.btn-p:hover{opacity:.9}
.btn-p:disabled{opacity:.5;cursor:not-allowed}
.btn-s{background:#f3f4f6;color:#374151;width:100%}
.btn-s:hover{background:#e5e7eb}
.code-box{background:#1e1e2e;color:#a6e3a1;font-size:2.2rem;font-weight:700;letter-spacing:.35em;text-align:center;padding:20px;border-radius:12px;margin:16px 0;font-family:monospace}
.code-hint{color:#6b7280;font-size:.82rem;text-align:center;line-height:1.6}
.hidden{display:none!important}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
.conn-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin-top:12px}
.conn-phone{font-size:1.1rem;font-weight:700;color:#166534}
.conn-label{color:#6b7280;font-size:.82rem;margin-top:4px}
.err-box{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;color:#991b1b;font-size:.85rem;margin-top:12px}
</style>
</head>
<body>
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
          <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite"></div>
          <span style="color:#6b7280;font-size:.85rem">Gerando QR code...</span>
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
