'use strict';
const $ = id => document.getElementById(id);
const video = $('main-video');
const dialog = $('image-dialog');
let previousImageButton;
function selectDemo(sample){
  video.pause();
  $('main-error').hidden = true;
  video.poster = sample.poster;
  video.src = sample.src;
  video.load();
  $('stage-id').textContent = `${sample.id} / ${t(sample.label).toUpperCase()}`;
  $('stage-format').textContent = t(sample.format);
  $('demo-code').textContent = `${sample.id} / ${t("REQUESTED VERSION")}`;
  $('demo-title').textContent = t(sample.title);
  $('demo-description').textContent = t(sample.description);
  $('review-focus').textContent = t(sample.focus);
  $('requirements').replaceChildren(...sample.requirements.map(text => {const li=document.createElement('li');li.textContent=t(text);return li;}));
  $('dialogue').replaceChildren(...sample.dialogue.map(([speaker,jp,en])=>{const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=t(speaker)+': ';const line=document.createElement('span');line.lang='ja';line.textContent=jp;p.append(strong,line);if(!IS_JA)p.append(document.createElement('br'),en);return p;}));
  $('reference-images').replaceChildren(...sample.images.map(([src,label])=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',IS_JA ? `${t(label)}を拡大` : `Inspect ${label.toLowerCase()}`);const im=document.createElement('img');im.src=src;im.alt=t(label);const caption=document.createElement('span');caption.textContent=t(label)+' ↗';b.append(im,caption);b.addEventListener('click',()=>{previousImageButton=b;$('full-image').src=src;$('full-image').alt=t(label);$('image-caption').textContent=t(label);dialog.showModal();});return b;}));
  document.querySelectorAll('.demo-tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===sample.id)));
}
SAMPLES.forEach(sample=>{const b=document.createElement('button');b.className='demo-tab';b.type='button';b.dataset.id=sample.id;const dot=document.createElement('i');dot.className='dot';dot.style.setProperty('--dot',sample.color);dot.setAttribute('aria-hidden','true');const code=document.createElement('span');code.className='tab-code';code.textContent=sample.id;b.append(dot,code,t(sample.label));b.addEventListener('click',()=>selectDemo(sample));$('demo-tabs').append(b);});
video.addEventListener('error',()=>{$('main-error').hidden=false;});
// Only one video plays at a time, except the deliberate side-by-side comparison.
let syncPair=null;
document.querySelectorAll('video').forEach(player=>{
  player.addEventListener('play',()=>{const group=syncPair&&syncPair.includes(player)?syncPair:[player];if(group.length===1&&syncPair)endSync();document.querySelectorAll('video').forEach(other=>{if(!group.includes(other))other.pause();});});
  player.addEventListener('pause',()=>{if(syncPair&&syncPair.includes(player)&&!player.ended)endSync();});
  if(player!==video){const error=document.createElement('p');error.className='media-error';error.hidden=true;error.setAttribute('role','status');error.textContent=t('This preview is unavailable. Please check the media folder.');player.after(error);const onError=()=>{error.hidden=false;};player.addEventListener('error',onError);player.querySelectorAll('source').forEach(source=>source.addEventListener('error',onError));}
});
$('close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>previousImageButton?.focus());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
selectDemo(SAMPLES[0]);

// The board contains presentation references only; dragging changes layout, not production.
const board=document.querySelector('.hero-board');
const wires=board.querySelector('.connections');
const nodes=[...board.querySelectorAll('.workflow-node')];
const initial=nodes.map(n=>({left:parseFloat(n.style.left),top:parseFloat(n.style.top)}));
const paths=nodes.slice(0,-1).map(()=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');wires.append(p);return p;});
function drawWires(){
 const target=nodes.at(-1);const tx=target.offsetLeft,ty=target.offsetTop+target.offsetHeight/2;
 nodes.slice(0,-1).forEach((n,i)=>{const x=n.offsetLeft+n.offsetWidth,y=n.offsetTop+n.offsetHeight/2,bend=Math.max(45,Math.abs(tx-x)*.42);paths[i].setAttribute('d',`M ${x} ${y} C ${x+bend} ${y}, ${tx-bend} ${ty}, ${tx} ${ty}`);});
}
function moveNode(n,x,y){n.style.left=Math.max(8,Math.min(board.clientWidth-n.offsetWidth-8,x))+'px';n.style.top=Math.max(8,Math.min(board.clientHeight-n.offsetHeight-32,y))+'px';drawWires();}
nodes.forEach(n=>{
 const handle=n.querySelector('.node-handle');let drag=null;
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:n.offsetLeft,top:n.offsetTop};handle.setPointerCapture(e.pointerId);n.classList.add('dragging');});
 handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;moveNode(n,drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);});
 const finish=()=>{drag=null;n.classList.remove('dragging');};handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);
 handle.addEventListener('keydown',e=>{const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!steps[e.key])return;e.preventDefault();const [x,y]=steps[e.key],step=e.shiftKey?30:10;moveNode(n,n.offsetLeft+x*step,n.offsetTop+y*step);});
});
$('reset-board').addEventListener('click',()=>{nodes.forEach((n,i)=>moveNode(n,initial[i].left,initial[i].top));document.querySelector('.board-scroll').scrollLeft=0;});
new ResizeObserver(drawWires).observe(board);
drawWires();

document.querySelectorAll('[data-inspect]').forEach(button=>{
 const label=t(button.dataset.caption);button.setAttribute('aria-label',IS_JA?`${label}を拡大`:`Inspect ${label.toLowerCase()}`);
 button.addEventListener('click',()=>{previousImageButton=button;$('full-image').src=button.dataset.inspect;$('full-image').alt=label;$('image-caption').textContent=label;dialog.showModal();});
});

const compareBase=$('compare-base'),compareResult=$('compare-result');
function endSync(){if(!syncPair)return;const pair=syncPair;syncPair=null;pair.forEach(v=>v.pause());compareBase.muted=false;}
$('play-both').addEventListener('click',()=>{
 endSync();const pair=[compareBase,compareResult];compareBase.muted=true;
 pair.forEach(v=>{v.pause();v.currentTime=0;});
 const ready=v=>v.readyState>=3?Promise.resolve():new Promise(res=>{v.addEventListener('canplay',res,{once:true});if(v.networkState===0||v.readyState===0)v.load();});
 Promise.all(pair.map(ready)).then(()=>{syncPair=pair;return Promise.all(pair.map(v=>v.play()));}).catch(()=>endSync());
});
compareResult.addEventListener('ended',()=>{if(syncPair){syncPair=null;compareBase.muted=false;}});
