'use strict';
const $=id=>document.getElementById(id);
let readers=[],grade=1,position=0,busy=false,mobile=matchMedia('(max-width:600px)').matches,mode='all',endAt=null,rep=0,timer=null,downX=null,skipClick=false,chosenLesson=null;
const book=()=>readers.find(r=>r.grade===grade),sheets=()=>[{image:book().cover,title:`Smart Junior ${grade}`,cover:true},...book().pages],activeLesson=()=>chosenLesson||book().pages[Math.max(0,Math.min(position-1,book().pages.length-1))];
function render(){chosenLesson=null;const pages=sheets(),left=pages[position],right=position===0?null:pages[position+1];$('book').classList.toggle('closed',position===0);const stepPositions=stops();$('left-page').src=left.image;$('left-page').alt=left.cover?`Обкладинка Smart Junior ${grade}`:`Smart Junior ${grade}: ${left.title}`;if(!mobile&&right){$('right-page').src=right.image;$('right-page').alt=`Smart Junior ${grade}: ${right.title}`}$('prev').disabled=position===0;$('next').disabled=position===stepPositions.at(-1);$('page-title').textContent=left.cover?`Smart Junior ${grade}`:left.title;$('page-count').textContent=`${position+1}${!mobile&&right?'–'+(position+2):''} / ${pages.length}`;for(const [el,p] of [[$('left-page'),left],[$('right-page'),right]]){el.parentElement.querySelectorAll('.hotspot').forEach(b=>b.remove());if(!p||p.cover)continue;for(const h of (p.hotspots||[])){const b=document.createElement('button');b.className='hotspot';b.style.cssText=`left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;b.setAttribute('aria-label',(h.kind==='audio'?'Слухати: ':'Грати: ')+p.title);b.onclick=e=>{e.stopPropagation();chosenLesson=p;$(h.kind==='audio'?'audio-button':'game-button').click()};el.parentElement.append(b)}}const count=stepPositions.length;$('dots').replaceChildren(...Array.from({length:count},(_,i)=>{const b=document.createElement('button');b.className=i===stepPositions.indexOf(position)?'active':'';b.setAttribute('aria-label',`Сторінка ${i+1}`);b.setAttribute('aria-current',String(b.className==='active'));b.onclick=()=>jump(stepPositions[i]);return b}));}
function stops(){return mobile?[0,1,2,3,4]:[0,1,3]}
let sound, sequence=0;
function rustle(){
 try{
  sound ||= new (window.AudioContext||window.webkitAudioContext)();
  sound.resume().catch(()=>{});
  const length=Math.floor(sound.sampleRate*.48), buffer=sound.createBuffer(1,length,sound.sampleRate), wave=buffer.getChannelData(0);
  for(let i=0;i<length;i++){const t=i/length;wave[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)**2*(.35+.65*Math.sin(9*t)**2)*.15}
  const source=sound.createBufferSource(), filter=sound.createBiquadFilter();filter.type='bandpass';filter.frequency.value=2500;filter.Q.value=.65;
  source.buffer=buffer;source.connect(filter);filter.connect(sound.destination);source.start();
 }catch{}
}
function jump(to, audible=true){
 if(!readers.length||busy||!stops().includes(to)||to===position)return;
 const token=++sequence, old=position, pages=sheets(), forward=to>old;
 if(audible)rustle();busy=true;
 const stage=$('book'),sheet=$('flip-sheet'),front=pages[old+(forward&&!mobile&&old?1:0)],back=pages[to+(!forward&&!mobile&&to?1:0)];
 position=to;render();stage.classList.add('animating');
 if(!mobile&&old>0&&to>0){$(forward?'left-page':'right-page').src=pages[old+(forward?0:1)].image}
 sheet.className=forward?'forward':'backward';
 sheet.replaceChildren(...[front,back].map(page=>{const face=document.createElement('i');face.style.backgroundImage='url("'+page.image+'")';return face}));
 const angle=forward?-179:179;
 const anim=sheet.animate([{transform:(!mobile&&old===0?'translateX(-50%) ':'')+'perspective(1900px) rotateY(0deg)'},{transform:'perspective(1900px) rotateY('+angle*.48+'deg) rotateZ('+(forward?-1:1)+'deg)',offset:.48},{transform:'perspective(1900px) rotateY('+angle+'deg)'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:830,easing:'cubic-bezier(.36,.04,.25,1)'});
 anim.finished.catch(()=>{}).then(()=>{if(token===sequence){stage.classList.remove('animating');busy=false;render()}});
}
function turn(direction){const a=stops();jump(a[a.indexOf(position)+direction])}
function setGrade(g){if(!readers.length)return;sequence++;busy=false;$('book').classList.remove('animating');$('flip-sheet').getAnimations().forEach(a=>a.cancel());grade=g;position=0;document.querySelectorAll('[data-grade]').forEach(b=>{const on=+b.dataset.grade===g;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});render();}
$('prev').onclick=()=>turn(-1);$('next').onclick=()=>turn(1);document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>setGrade(+b.dataset.grade));
window.addEventListener('resize',()=>{const next=matchMedia('(max-width:600px)').matches;if(mobile!==next){mobile=next;if(!mobile&&position>0)position=position<=2?1:3;if(readers.length)render()}});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.key==='ArrowRight'){e.preventDefault();turn(1)}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}});
$('book').addEventListener('pointerdown',e=>downX=e.clientX);$('book').addEventListener('pointerup',e=>{if(downX===null)return;const delta=e.clientX-downX;downX=null;if(Math.abs(delta)>45){skipClick=true;turn(delta<0?1:-1);setTimeout(()=>skipClick=false,250)}});$('book').addEventListener('pointercancel',()=>downX=null);
for(const id of ['left-page','right-page'])$(id).onclick=()=>{if(skipClick)return;if(position===0){jump(1);return;}$('zoom-page').src=$(id).src;$('zoom-page').alt=$(id).alt;$('zoom-dialog').showModal()};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else{const b=$('fullscreen');b.textContent='↕';b.setAttribute('aria-label','Поверніть телефон горизонтально для більшого зразка')}}catch(e){$('fullscreen').title='Цей браузер не дозволяє повноекранний режим'}};
function openDialog(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal()}
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('close',()=>{if(d.id==='game-dialog')$('game-frame').replaceChildren()});d.addEventListener('click',e=>{if(e.target===d)d.close()})});
$('audio-button').onclick=()=>{if(readers.length)window.location.assign(activeLesson().listenUrl)};
$('game-button').onclick=()=>{const p=activeLesson();openDialog('game-dialog');$('game-title').textContent=`${p.title} • Smart Junior ${grade}`;$('game-link').href=p.gameUrl;const f=document.createElement('iframe');f.src=p.gameUrl;f.title=`Гра до ридера: ${p.title}`;f.allow='fullscreen';$('game-frame').replaceChildren(f)};
fetch('assets/readers.json').then(r=>{if(!r.ok)throw Error('data');return r.json()}).then(data=>{readers=data;$('loading').hidden=true;setGrade(1);const first=sequence;setTimeout(()=>{if(first===sequence&&position===0&&!document.querySelector('dialog[open]'))jump(1,false)},1400)}).catch(()=>{$('loading').textContent='Не вдалося відкрити зразок. Оновіть сторінку.'});

window.addEventListener('pageshow', e=>{if(e.persisted && readers.length){busy=false;render()}});
