import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
export const LEGACY_PATH = '/__legacy/impact-velocity.html';
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

/* Runs in the page before any page script: seeded Math.random with a call counter,
   virtual clock for performance.now and requestAnimationFrame, a fixed audio sample rate,
   silent speech, and a pointer lock that always reports the game canvas as locked. */
function installDeterminism(seed){
  var s=seed>>>0, calls=0;
  Math.random=function(){
    calls++;
    s=(s+0x6D2B79F5)>>>0;
    var t=s;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
  window.__rng={calls:function(){return calls;},reseed:function(n){s=n>>>0;calls=0;}};
  /* initAudio fills noise buffers with one Math.random call per sample, so the device sample rate
     (48 kHz locally, different on CI) would shift every later random value and change the scenario. */
  var NativeAudioContext=window.AudioContext;
  if(NativeAudioContext){
    window.AudioContext=function(opts){return new NativeAudioContext(Object.assign({sampleRate:48000},opts||{}));};
    window.AudioContext.prototype=NativeAudioContext.prototype;
  }
  var vt=0, queue=[];
  performance.now=function(){return vt;};
  window.requestAnimationFrame=function(cb){queue.push(cb);return queue.length;};
  window.cancelAnimationFrame=function(){};
  window.__step=function(ms){vt+=ms;var cbs=queue.splice(0);for(var i=0;i<cbs.length;i++)cbs[i](vt);};
  var synth={speak:function(){},cancel:function(){},getVoices:function(){return [];},onvoiceschanged:null};
  Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  window.SpeechSynthesisUtterance=function(text){this.text=text;};
  Object.defineProperty(Document.prototype,'pointerLockElement',{configurable:true,
    get:function(){return document.querySelector('#cwrap canvas');}});
  Element.prototype.requestPointerLock=function(){return Promise.resolve();};
  Document.prototype.exitPointerLock=function(){};
}

export async function prepare(page, seed){
  await page.addInitScript(installDeterminism, seed);
  await page.route('https://upload.wikimedia.org/**', function(route){ return route.abort(); });
  await page.route(THREE_CDN, function(route){
    return route.fulfill({ contentType: 'text/javascript',
      body: readFileSync(resolve(ROOT, 'node_modules/three/build/three.min.js'), 'utf8') });
  });
  await page.route('**' + LEGACY_PATH, function(route){
    return route.fulfill({ contentType: 'text/html',
      body: readFileSync(resolve(ROOT, 'legacy/impact-velocity.html'), 'utf8') });
  });
}

/* Legacy keeps its state in window globals; give it the same window.__iv shape Impact installs. */
function installLegacyAdapter(){
  /* eslint-disable no-undef */
  window.__iv={read:function(){
    return {state:state,paused:paused,P:P,bots:bots,inv:inv,curKey:curKey,curSlot:curSlot,katanaMode:katanaMode,
      reloadT:reloadT,flipT:flipT,adsAmt:adsAmt,swingT:swingT,knifeT:knifeT,dashCd:dashCd,wallRunning:wallRunning,
      grappleHave:grappleHave,grapAnchor:grapAnchor,uavOn:uavOn,gunslinger:gunslinger,rainCharges:rainCharges,
      rainActive:rainActive,sabre:sabre,match:match,teamScore:teamScore,loadoutPrimary:loadoutPrimary,sens:sens,
      camera:camera,vm:vm,rags:rags,goreP:goreP,tracers:tracers,pickups:pickups,rainMeshes:rainMeshes};
  },actions:{killBot:killBot,damagePlayer:damagePlayer}};
}

export async function openLegacy(page, seed){
  await prepare(page, seed);
  await page.goto(LEGACY_PATH);
  await page.evaluate(installLegacyAdapter);
}

export async function openImpact(page, seed){
  await prepare(page, seed);
  await page.goto('/impact.html?parity');
}

/* Runs a scripted scenario inside the page, one virtual 60 Hz frame at a time,
   and returns one snapshot per frame. */
function runInPage(arg){
  var steps=arg.steps, frames=arg.frames;
  var LEAF=['feed','topbar','hitm','announce','streakM','hpline','movehint','powers','ammoline','sabreT',
    'deathcam','toast','resTitle','resTable','lockmsg'];
  var BOX=['hud','mmWrap','vign','sabreGlow','scope','menuMain','menuPause','menuResults'];
  var SLIDERS=['sens','sens2','musv','musv2','sfxv'];
  function v(o){return o?[o.x,o.y,o.z]:null;}
  function el(id){return document.getElementById(id);}
  function snap(){
    var r=window.__iv.read(), P=r.P;
    return {
      rng:window.__rng.calls(), state:r.state, paused:r.paused,
      P:{pos:v(P.pos),vel:v(P.vel),onGround:P.onGround,alive:P.alive,hp:P.hp,kills:P.kills,deaths:P.deaths,
        yaw:P.yaw,pitch:P.pitch,roll:P.roll,sliding:P.sliding,crouchAmt:P.crouchAmt,lastHurt:P.lastHurt,
        respT:P.respT,streak:P.streak,multiN:P.multiN,lastKillT:P.lastKillT},
      bots:r.bots.map(function(b){return {name:b.name,team:b.team,pos:v(b.pos),vel:v(b.vel),hp:b.hp,alive:b.alive,
        kills:b.kills,deaths:b.deaths,respT:b.respT,burst:b.burst,burstCd:b.burstCd,rotY:b.g.rotation.y,
        target:b.target?b.target.name:null};}),
      inv:JSON.parse(JSON.stringify(r.inv)),
      weapon:[r.curKey,r.curSlot,r.katanaMode,r.reloadT,r.flipT,r.adsAmt,r.swingT,r.knifeT,r.dashCd,r.wallRunning,r.loadoutPrimary,r.sens],
      powers:[r.grappleHave,v(r.grapAnchor),r.uavOn,r.gunslinger.have,r.gunslinger.ammo,r.rainCharges,r.rainActive,r.sabre.active,r.sabre.t],
      match:[r.match.mode,r.match.time,r.match.over,r.teamScore.blue,r.teamScore.red],
      cam:v(r.camera.position).concat([r.camera.rotation.x,r.camera.rotation.y,r.camera.rotation.z,r.camera.fov]),
      vm:r.vm?v(r.vm.position).concat([r.vm.rotation.x,r.vm.rotation.y,r.vm.rotation.z,r.vm.visible]):null,
      fx:[r.rags.length,r.goreP.length,r.tracers.length,r.pickups.length,r.rainMeshes.length],
      leaf:LEAF.map(function(id){var e=el(id);return e.innerHTML+'|'+e.style.cssText;}),
      box:BOX.map(function(id){return el(id).style.cssText;}),
      sliders:SLIDERS.map(function(id){return el(id).value;}),
      minimap:r.uavOn?el('mm').toDataURL():null
    };
  }
  function act(a){
    var r=window.__iv.read();
    if(a.type==='key')document.dispatchEvent(new KeyboardEvent(a.down?'keydown':'keyup',{code:a.code,cancelable:true}));
    else if(a.type==='mouse')document.dispatchEvent(new MouseEvent(a.down?'mousedown':'mouseup',{button:a.button}));
    else if(a.type==='look')document.dispatchEvent(new MouseEvent('mousemove',{movementX:a.dx,movementY:a.dy}));
    else if(a.type==='click')document.querySelector(a.sel).click();
    else if(a.type==='kill'){
      if(r.P.streak>=a.untilStreak)return;
      var b=r.bots.filter(function(x){return x.alive&&x.team!==r.P.team;})[0];
      if(b)window.__iv.actions.killBot(b,r.P,'TEST',false);
    }
    else if(a.type==='hurt')window.__iv.actions.damagePlayer(a.amt,r.bots[0]);
  }
  var out=[], k=0;
  for(var f=0;f<frames;f++){
    while(k<steps.length&&steps[k].f===f)act(steps[k++]);
    window.__step(1000/60);
    out.push(snap());
  }
  return out;
}

export async function runScenario(page, scenario){
  return page.evaluate(runInPage, scenario);
}

/* Scenario builder: frame-indexed input steps, sorted by frame. */
export function scenario(frames){
  var steps=[];
  var api={
    frames:frames,
    key:function(code,from,to){steps.push({f:from,type:'key',code:code,down:true});steps.push({f:to,type:'key',code:code,down:false});return api;},
    tap:function(code,f){return api.key(code,f,f+2);},
    mouse:function(button,from,to){steps.push({f:from,type:'mouse',button:button,down:true});steps.push({f:to,type:'mouse',button:button,down:false});return api;},
    look:function(from,to,dx,dy){for(var f=from;f<to;f++)steps.push({f:f,type:'look',dx:dx,dy:dy});return api;},
    click:function(sel,f){steps.push({f:f,type:'click',sel:sel});return api;},
    /* every `every` frames in [from,to), kill one living enemy for the player while their streak is below `streak` */
    killsUntil:function(streak,from,to,every){for(var f=from;f<to;f+=every)steps.push({f:f,type:'kill',untilStreak:streak});return api;},
    hurt:function(amt,f){steps.push({f:f,type:'hurt',amt:amt});return api;},
    build:function(){
      var sorted=steps.map(function(s,i){return {s:s,i:i};})
        .sort(function(a,b){return a.s.f-b.s.f||a.i-b.i;}).map(function(x){return x.s;});
      return {frames:frames,steps:sorted};
    }
  };
  return api;
}
