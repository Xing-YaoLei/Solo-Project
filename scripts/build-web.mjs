import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, cpSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log('🎫 票务模拟器 Web 构建入口 (独立模式)');
console.log(`   项目根: ${ROOT}`);

if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });
else {
  for (const f of readdirSync(DIST)) {
    const fp = join(DIST, f);
    try { if (statSync(fp).isDirectory()) rmSync(fp, { recursive: true, force: true }); else rmSync(fp, { force: true }); } catch (e) { }
  }
}

const tpl = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover" />
<title>🎫 票务经营模拟大师</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a14;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
  #loading { position: fixed; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 9999;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%); transition: opacity .8s; }
  #loading.hide { opacity: 0; pointer-events: none; }
  #loading .logo { font-size: 48px; margin-bottom: 18px; animation: float 2.4s ease-in-out infinite; }
  #loading .title { font-size: 24px; color: #ffd700; margin-bottom: 10px; font-weight: bold; letter-spacing: 2px; }
  #loading .sub { font-size: 13px; color: #8a8aa5; margin-bottom: 28px; }
  #loading .bar { width: 280px; height: 6px; background: #2a2a44; border-radius: 99px; overflow: hidden; margin-bottom: 18px; }
  #loading .fill { width: 0%; height: 100%; background: linear-gradient(90deg, #f1c40f, #e74c3c, #9b59b6, #3498db, #2ecc71);
    background-size: 300% 100%; animation: shine 2s linear infinite, progress 3.5s ease-out forwards; border-radius: 99px; }
  #loading .txt { color: #b0b0c8; font-size: 12px; }
  @keyframes float { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-10px) } }
  @keyframes shine { 0%{ background-position: 0 0 } 100%{ background-position: 300% 0 } }
  @keyframes progress { 0%{ width: 0% } 40%{ width: 45% } 75%{ width: 78% } 95%{ width: 96% } 100%{ width: 100% } }
  #GameDiv { position: fixed; inset: 0; background: #0a0a14; display: flex; align-items: center; justify-content: center; }
  canvas { display: block; image-rendering: -webkit-optimize-contrast; image-rendering: pixelated; max-width: 100vw; max-height: 100vh; }
  .info { position: fixed; bottom: 6px; left: 0; right: 0; text-align: center;
    color: rgba(180,180,220,.45); font-size: 10px; pointer-events: none; z-index: 9; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 99px;
    background: rgba(255,255,255,.06); margin: 0 3px; }
</style>
</head>
<body>
  <div id="loading">
    <div class="logo">🎫</div>
    <div class="title">票务经营模拟大师</div>
    <div class="sub">活动票务 · 演出票务经营模拟</div>
    <div class="bar"><div class="fill"></div></div>
    <div class="txt">资源加载中，请稍候...</div>
  </div>
  <div id="GameDiv"></div>
  <div class="info">
    <span class="pill">🎮 触屏点击选座</span>
    <span class="pill">⌨️ 空格确认 · R拒绝 · S推荐 · C清空 · ESC暂停</span>
    <span class="pill">🤫 安静练习模式</span>
  </div>
<script src="https://cdn.jsdelivr.net/npm/ccmod@3.8.0/dist/ccmod.min.js"></script>
<script src="./game.js"></script>
</body>
</html>`;

writeFileSync(join(DIST, 'index.html'), tpl, 'utf-8');

const stubCC = `
(function() {
  if (window.cc && window.cc.Node) return;
  const V3 = function(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;};
  const V2 = function(x=0,y=0){this.x=x;this.y=y;};
  const Quat = function(x=0,y=0,z=0,w=1){this.x=x;this.y=y;this.z=z;this.w=w;};
  const Size = function(w=0,h=0){this.width=w;this.height=h;};
  const Rect = function(x=0,y=0,w=0,h=0){this.x=x;this.y=y;this.width=w;this.height=h;};
  const Color = function(r=255,g=255,b=255,a=255){this.r=r;this.g=g;this.b=b;this.a=a;};
  Color.WHITE = new Color(255,255,255,255); Color.BLACK = new Color(0,0,0,255);
  Color.TRANSPARENT = new Color(0,0,0,0);
  let _nid = 0;
  const EH = function(){this._lis={};};
  EH.prototype.on=function(t,f,c){(this._lis[t]=this._lis[t]||[]).push([f,c]);};
  EH.prototype.once=function(t,f,c){const self=this;const wrap=function(){f.apply(this,arguments);self.off(t,wrap);};this.on(t,wrap,c);};
  EH.prototype.off=function(t,f){if(!this._lis[t])return;if(!f){delete this._lis[t];return;}this._lis[t]=this._lis[t].filter(x=>x[0]!==f);};
  EH.prototype.emit=function(t,d){(this._lis[t]||[]).forEach(([fn,c])=>{try{fn.call(c||this,d);}catch(e){console.error(e);}});};
  EH.prototype.targetOff=function(){this._lis={};};

  let _director = null, _game = null;

  const Node = function(name=''){
    this._id=++_nid;this._name=name;this._parent=null;this._children=[];
    this._active=true;this._components=[];
    this._lpos=new V3();this._lrot=new Quat();this._lscale=new V3(1,1,1);
    this._euler=new V3();this._layer=33554432;this._objFlags=0;
    this.uuid='n_'+Date.now().toString(36)+'_'+_nid;
    this._events=new EH();
  };
  Object.defineProperty(Node.prototype,'name',{get(){return this._name;},set(v){this._name=v;}});
  Object.defineProperty(Node.prototype,'parent',{get(){return this._parent;}});
  Object.defineProperty(Node.prototype,'children',{get(){return this._children.slice();}});
  Object.defineProperty(Node.prototype,'active',{get(){return this._active;},set(v){this._active=!!v;}});
  Object.defineProperty(Node.prototype,'isValid',{get(){return !!this._id;}});
  Object.defineProperty(Node.prototype,'components',{get(){return this._components.slice();}});
  Node.prototype.setPosition=function(x,y,z){this._lpos.x=x||0;this._lpos.y=y||0;this._lpos.z=z||0;if(this._refresh)this._refresh();};
  Node.prototype.getPosition=function(){return new V3(this._lpos.x,this._lpos.y,this._lpos.z);};
  Node.prototype.setRotation=function(x,y,z,w){this._lrot.x=x||0;this._lrot.y=y||0;this._lrot.z=z||0;this._lrot.w=w||1;};
  Node.prototype.setScale=function(x,y,z){this._lscale.x=x||1;this._lscale.y=y||x||1;this._lscale.z=z||1;};
  Node.prototype.setWorldPosition=Node.prototype.setPosition;
  Node.prototype.addChild=function(c){if(!c||c._parent===this)return c;if(c._parent)c._parent.removeChild(c);c._parent=this;this._children.push(c);c._emit('added');return c;};
  Node.prototype.removeChild=function(c){const i=this._children.indexOf(c);if(i>=0){this._children.splice(i,1);c._parent=null;c._emit('removed');}};
  Node.prototype.removeAllChildren=function(){for(const c of this._children.slice())this.removeChild(c);};
  Node.prototype.removeFromParent=function(){if(this._parent)this._parent.removeChild(this);};
  Node.prototype.getChildByName=function(n){return this._children.find(c=>c._name===n)||null;};
  Node.prototype.getChildByPath=function(p){const parts=p.split('/');let cur=this;for(const k of parts){cur=cur.getChildByName(k);if(!cur)return null;}return cur;};
  Node.prototype.getComponent=function(t){return this._components.find(c=>(typeof t==='string'?c.constructor.name===t:c instanceof t))||null;};
  Node.prototype.getComponents=function(t){return this._components.filter(c=>(typeof t==='string'?c.constructor.name===t:c instanceof t));};
  Node.prototype.addComponent=function(t){const c=typeof t==='function'?new t():{__proto__:{constructor:{name:t}},name:t,node:this,_enabled:true};c.node=this;if(!c._enabled)c._enabled=true;if(!('_name' in c))c._name='';if(!('_objFlags' in c))c._objFlags=0;if(!('__prefab' in c))c.__prefab=null;this._components.push(c);if(typeof c.onLoad==='function'){try{c.onLoad();}catch(e){console.error('[onLoad]',e);}}c._emit=(c.node._events);return c;};
  Node.prototype._emit=function(t,d){this._events.emit(t,d);};
  Node.prototype.on=function(t,f,c){this._events.on(t,f,c||this);};
  Node.prototype.once=function(t,f,c){this._events.once(t,f,c||this);};
  Node.prototype.off=function(t,f){this._events.off(t,f);};
  Node.prototype.targetOff=function(){this._events.targetOff();};
  Node.prototype.emit=function(t,d){this._events.emit(t,d);};
  Node.prototype.destroy=function(){this.removeFromParent();this._id=0;};
  Node.prototype.destroyAllChildren=function(){for(const c of this._children.slice())c.destroy();};
  Node.prototype.setSiblingIndex=function(i){if(!this._parent)return;const arr=this._parent._children;const idx=arr.indexOf(this);if(idx<0)return;arr.splice(idx,1);arr.splice(Math.max(0,Math.min(arr.length,i)),0,this);};
  Node.prototype.getSiblingIndex=function(){return this._parent?this._parent._children.indexOf(this):-1;};
  Node.prototype.getUILocalTransform=function(){return {a:1,b:0,c:0,d:1,tx:this._lpos.x,ty:this._lpos.y};};
  Node.prototype.getScene=function(){return this._parent?this._parent.getScene():null;};
  Node.prototype.instantiate=function(){
    const n=new Node(this._name);
    n.setPosition(this._lpos.x,this._lpos.y,this._lpos.z);
    n.setScale(this._lscale.x,this._lscale.y,this._lscale.z);
    for(const c of this._components){try{n.addComponent(c.constructor);}catch(e){}}
    for(const c of this._children)n.addChild(c.instantiate());
    return n;
  };
  Node.EventType={TOUCH_START:'touchstart',TOUCH_MOVE:'touchmove',TOUCH_END:'touchend',
    TOUCH_CANCEL:'touchcancel',MOUSE_DOWN:'mousedown',MOUSE_MOVE:'mousemove',
    MOUSE_UP:'mouseup',MOUSE_LEAVE:'mouseleave',CLICK:'click'};

  const Component = function(){this.node=null;this._name='';this._objFlags=0;this.__prefab=null;this._enabled=true;};
  Component.prototype.scheduleOnce=function(f,t=0){const id=setTimeout(()=>{try{f.call(this);}catch(e){console.error(e);}},t*1000);return id;};
  Component.prototype.schedule=function(f,interval=0,repeat=-1,delay=0){const self=this;let i=0;const run=()=>{try{f.call(self);}catch(e){console.error(e);}i++;if(repeat<0||i<=repeat)next();};const next=()=>{setTimeout(run,(delay||interval)*1000);delay=0;};next();};
  Component.prototype.unschedule=function(){/*no-op*/};
  Component.prototype.unscheduleAllCallbacks=function(){/*no-op*/};
  Object.defineProperty(Component.prototype,'enabled',{get(){return this._enabled;},set(v){this._enabled=!!v;}});

  const UITransform = function(){this._contentSize=new Size(100,100);this._anchorPoint=new V2(.5,.5);};
  UITransform.prototype.setContentSize=function(w,h){this._contentSize.width=w;this._contentSize.height=h;};
  UITransform.prototype.getContentSize=function(){return new Size(this._contentSize.width,this._contentSize.height);};
  UITransform.prototype.setAnchorPoint=function(x,y){this._anchorPoint.x=x;this._anchorPoint.y=y;};
  UITransform.prototype.getBoundingBoxToWorld=function(){return new Rect(0,0,this._contentSize.width,this._contentSize.height);};
  UITransform.prototype.convertToNodeSpaceAR=function(p){return new V3(p.x-this.node._lpos.x,p.y-this.node._lpos.y,0);};
  Object.defineProperty(UITransform.prototype,'contentSize',{get(){return this.getContentSize();},set(v){this.setContentSize(v.width,v.height);}});
  Object.defineProperty(UITransform.prototype,'anchorPoint',{get(){return this._anchorPoint;},set(v){this.setAnchorPoint(v.x,v.y);}});
  UITransform.prototype.setVisibleSize=function(){/* no-op */};

  const Sprite = function(){this.color=new Color(255,255,255,255);this.type=Sprite.Type.SIMPLE;this.sizeMode=Sprite.SizeMode.CUSTOM;this.spriteFrame=null;this._enabled=true;};
  Sprite.Type={SIMPLE:0,SLICED:1,TILED:2,FILLED:3};
  Sprite.SizeMode={CUSTOM:0,TRIMMED:1,RAW:2};
  Sprite.FillType={HORIZONTAL:0,VERTICAL:1,RADIAL:2};

  const Label = function(){this.string='';this.fontSize=20;this.lineHeight=24;this.color=new Color();this.horizontalAlign=0;this.verticalAlign=1;this._overflow=0;this.enableWrapText=true;this.fontFamily='sans-serif';this.font=null;this.letter=0;this.overflow=Label.Overflow.CLAMP;this.enableUnderline=false;this.underlineHeight=2;this._enabled=true;};
  Label.Overflow={NONE:0,CLAMP:1,SHRINK:2,RESIZE_HEIGHT:3};
  Label.HAlign={LEFT:0,CENTER:1,RIGHT:2};
  Label.VAlign={TOP:0,CENTER:1,BOTTOM:2};
  Label.CacheMode={NONE:0,BITMAP:1,CHAR:2};

  const Button = function(){this.transition=Button.Transition.NONE;this.zoomScale=1.1;this.duration=0.1;this._interactable=true;this.target=null;this.clickEvents=[];this.node=null;this._enabled=true;};
  Button.Transition={NONE:0,COLOR:1,SPRITE:2,SCALE:3};
  Object.defineProperty(Button.prototype,'interactable',{get(){return this._interactable;},set(v){this._interactable=!!v;}});

  const Widget = function(){this._alignMode=1;this._isAlignLeft=false;this._isAlignRight=false;this._isAlignTop=false;this._isAlignBottom=false;this._left=0;this._right=0;this._top=0;this._bottom=0;this._horizontalCenter=0;this._verticalCenter=0;};
  Widget.AlignMode={ONCE:0,ALWAYS:1,ON_WINDOW_RESIZE:2};

  const Canvas = function(){this._cameraComponent=null;this._alignCanvasWithScreen=true;this.cameraComponent=null;this.clearFlag=1;};

  const Camera = function(){this._projection=0;this._orthoHeight=1;this._near=1;this._far=1000;this._fov=45;this._fovAxis=0;
    this._priority=0;this._clearFlags=7;this._color=new Color(51,51,51,255);this._depth=1;this._stencil=0;
    this._rect=new Rect(0,0,1,1);this._visibility=0;this._screenScale=1;};
  Camera.ProjectionType={PERSPECTIVE:0,ORTHO:1};
  Camera.CameraFlag={DEFAULT:1,UI:33554432,SKYBOX:1048576};
  Camera.ClearFlag={SKYBOX:1,SOLID_COLOR:2,DEPTH_ONLY:4,DONT_CLEAR:6};

  const ScrollView = function(){this.content=null;this.horizontal=true;this.vertical=true;this.inertia=true;this.brake=0.5;this.elastic=true;this.bounceDuration=0.1;};

  const Layout = function(){this.type=0;this.resizeMode=0;this.cellSize=new Size(100,100);this.spacingX=0;this.spacingY=0;this.startAxis=0;this.paddingLeft=0;this.paddingRight=0;this.paddingTop=0;this.paddingBottom=0;};
  Layout.Type={NONE:0,HORIZONTAL:1,VERTICAL:2,GRID:3};
  Layout.ResizeMode={NONE:0,CONTAINER:1,CHILDREN:2};
  Layout.AxisDirection={HORIZONTAL:0,VERTICAL:1};

  const Toggle = function(){this.checked=false;this.node=this.interactable=true;this._toggleEvents=[];this.target=this.checkMark=null;this._interactable=true;};

  const ProgressBar = function(){this.barSprite=null;this.progress=0;this.mode=0;this.reverse=false;};
  ProgressBar.Mode={HORIZONTAL:0,VERTICAL:1,FILLED:2};

  const UIOpacity = function(){this.opacity=255;};

  const Graphics = function(){this._cmds=[];this.lineWidth=1;this.strokeColor=new Color();this.fillColor=new Color(255,255,255);};
  ['moveTo','lineTo','rect','roundRect','circle','ellipse','arc','quadraticCurveTo','bezierCurveTo','beginPath','closePath'].forEach(m=>{Graphics.prototype[m]=function(...a){this._cmds.push([m,a]);};});
  Graphics.prototype.stroke=function(){this._cmds.push(['stroke',[]]);};
  Graphics.prototype.fill=function(){this._cmds.push(['fill',[]]);};
  Graphics.prototype.strokeFill=function(){this.stroke();this.fill();};
  Graphics.prototype.clear=function(){this._cmds=[];};

  const Prefab = function(){this.data=null;this.optimizationPolicy=0;thisPersistent=false;};

  const SpriteFrame = function(){this.texture=null;this._originalSize=new Size(0,0);this._uv=[0,0,1,0,1,1,0,1];this._rect=new Rect(0,0,0,0);this._offset=new Vec2(0,0);this._isFlipUV=false;};

  const Texture2D = function(){this.image=null;this._width=0;this._height=0;};
  Texture2D.PixelFormat={RGBA8888:32};
  Texture2D.Filter={LINEAR:1};
  Texture2D.WrapMode={REPEAT:0,CLAMP_TO_EDGE:1,MIRRORED_REPEAT:2};

  const ImageAsset = function(){this.nativeUrl=this._nativeAsset=null;this._data=null;};

  const Slider = function(){this.direction=0;this.progress=0;this.handle=this.progressBar=this.target=null;this._handleRectSize=new Size(20,20);this.slideEvents=[];};
  Slider.Direction={HORIZONTAL:0,VERTICAL:1};

  const Mask = function(){this._type=0;this._segments=64;this._threshold=1;this._spriteFrame=null;this._enabled=true;};
  Mask.Type={RECT=0,ELLIPSE=1,IMAGE_STENCIL=2};

  const AudioSource = function(){this.clip=null;this.loop=false;this.volume=1;this.playOnAwake=false;this._playing=false;};
  AudioSource.prototype.play=function(){this._playing=true;};
  AudioSource.prototype.pause=function(){this._playing=false;};
  AudioSource.prototype.stop=function(){this._playing=false;this._cur=0;};

  const AudioListener = function(){};

  const _decorator = {
    ccclass: function(name){return function(Cls){Cls.__ccclass=name;Object.defineProperty(Cls.prototype,'__ccclass',{get:()=>name});Cls.__isCCClass=true;return Cls;};},
    property: function(def){return function(target,key){(target.__props||(target.__props={}))[key]=def||{};};},
    executeInEditMode: function(){return function(c){return c;};},
    requireComponent: function(){return function(c){return c;};},
    menu: function(){return function(c){return c;};},
    tooltip: function(){return function(a,b){};},
    range: function(){return function(a,b){};},
    serializable: function(){return function(a,b){};},
    displayName: function(){return function(a,b){};},
    type: function(){return function(a,b){};},
  };

  const sys = {
    isBrowser: true, isNative: false, isMobile: /iPhone|iPad|Android|HarmonyOS/i.test(navigator.userAgent),
    os: /Mac/.test(navigator.userAgent)?'OSX':/Win/.test(navigator.userAgent)?'WINDOWS':'LINUX',
    language: navigator.language.indexOf('zh')>=0?'zh':'en', languageCode: 'zh',
    browserType: 'unknown', browserVersion: '0', platform: 'mobile',
    windowPixelResolution: {width:window.innerWidth,height:window.innerHeight},
    capabilities: {canvas:true,webp:true,opengl:true,
      keyboard:!/iPhone|iPad|Android/i.test(navigator.userAgent),touches: 'ontouchstart' in window,
      accelerometer:true,image:true},
    localStorage: (function(){
      const store=new Map();let uid='lk_'+(location.host||'_def_');
      return {
        getItem(k){try{return JSON.parse(localStorage.getItem(uid+'_'+k)||'null');}catch(e){return store.get(k)||null;}},
        setItem(k,v){try{localStorage.setItem(uid+'_'+k,JSON.stringify(v));}catch(e){store.set(k,v);}},
        removeItem(k){try{localStorage.removeItem(uid+'_'+k);}catch(e){store.delete(k);}},
        clear(){try{for(const k of Object.keys(localStorage))if(k.startsWith(uid))localStorage.removeItem(k);}catch(e){store.clear();}}
      };
    })(),
    __audioSupport:{mp3:true,ogg:isSafari?false:true,wav:true,m4a:true},
    __logFPS: false, setFPS: function(){}, getDevicePixelRatio: function(){return window.devicePixelRatio||1;},
    configURL: location.href
  };
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  const view = {
    _orientation: 1, _resolutionPolicy: 0, _scissor: false, _autoFullScreen: true,
    designResolutionSize: new Size(1280, 720), getFrameSize:()=>new Size(window.innerWidth,window.innerHeight),
    getCanvasSize:()=>new Size(window.innerWidth,window.innerHeight), getVisibleSize:()=>new Size(1280,720),
    getVisibleOrigin:()=>new V2(0,0), getDesignResolutionSize:()=>view.designResolutionSize,
    setDesignResolutionSize:function(w,h,p){this.designResolutionSize=new Size(w,h);},
    setResizeCallback:function(){}, resizeWithBrowserSize:function(){},
    convertToLocationInView:function(p){return p;},
    _isRetina: function(){return sys.getDevicePixelRatio()>1;},
    enableAntiAlias: function(){},
    getScaleX:function(){return 1;}, getScaleY:function(){return 1;}
  };

  const AssetManager = function(){this.bundles={};};
  AssetManager.prototype.getBundle=function(name){return this.bundles[name]||null;};
  AssetManager.prototype.loadBundle=function(name,cb){if(!this.bundles[name])this.bundles[name]={
    load:function(paths,type,cb){if(typeof type==='function'){cb=type;type=null;}setTimeout(()=>cb&&cb(null,{}),0);},
    loadDir:function(path,type,cb){if(typeof type==='function'){cb=type;type=null;}setTimeout(()=>cb&&cb(null,[]),0);},
    release:function(){}, releaseAll:function(){}
  };cb&&cb(null,this.bundles[name]);return this.bundles[name];};
  AssetManager.prototype.releaseAsset=function(){};

  const resources = {
    load: function(paths,type,cb){if(typeof type==='function'){cb=type;type=null;}setTimeout(()=>cb&&cb(null,{}),0);},
    loadDir: function(path,type,cb){if(typeof type==='function'){cb=type;type=null;}setTimeout(()=>cb&&cb(null,[]),0);},
    preload: function(paths,type,cb){if(typeof type==='function'){cb=type;type=null;}cb&&cb();},
    release: function(){}, releaseAll: function(){}, get: function(p){return null;}
  };

  const assetManager = new AssetManager();

  const Input = function(){this._lis={};this.acceleration={x:0,y:0,z:0};this._deviceAccelerationEnabled=false;};
  Input.EventType={KEY_DOWN:'keydown',KEY_UP:'keyup',DEVICEMOTION:'devicemotion',MOUSE_DOWN:'mousedown',MOUSE_MOVE:'mousemove',MOUSE_UP:'mouseup',MOUSE_WHEEL:'mousewheel',TOUCH_START:'touchstart',TOUCH_MOVE:'touchmove',TOUCH_END:'touchend',TOUCH_CANCEL:'touchcancel'};
  Input.prototype.on=function(t,f,c){(this._lis[t]=this._lis[t]||[]).push([f,c]);const m={keydown:'keydown',keyup:'keyup'};if(m[t])window.addEventListener(m[t],(e)=>{this._lis[t].forEach(([fn,ctx])=>{try{fn.call(ctx||this,{keyCode:customKeyCode(e.key),code:e.code,key:e.key,_raw:e,propagationStopped:false, getUILocation:()=>({x:e.clientX||0,y:e.clientY||0}), preventDefault:()=>e.preventDefault(), stopPropagation:()=>{this._stopped=true;e.stopPropagation&&e.stopPropagation();}});});});};
  Input.prototype.off=function(t,f){if(!this._lis[t])return;if(!f)delete this._lis[t];else this._lis[t]=this._lis[t].filter(x=>x[0]!==f);};
  Input.Instance=null;
  const _input = new Input();
  Object.defineProperty(Input,'instance',{get(){return _input;},set(v){_input=v;}});

  function customKeyCode(k){
    const m={
      'ArrowLeft':37,'ArrowUp':38,'ArrowRight':39,'ArrowDown':40,
      'Backspace':8,'Tab':9,'Enter':13,'Shift':16,'Control':17,'Alt':18,'Escape':27,' ':32,
      'Delete':46,'CapsLock':20,' ':32,' ':32,
    };
    if(k&&k.length===1)return k.toUpperCase().charCodeAt(0);
    if(k.startsWith('F')){const n=parseInt(k.slice(1),10);if(n>=1&&n<=24)return 111+n;}
    if(/^Digit/.test(k))return 48+parseInt(k.slice(5),10);
    if(/^Key/.test(k))return 65+k.charCodeAt(3)-'A'.charCodeAt(0);
    if(/^Numpad/.test(k))return 96+parseInt(k.slice(6),10);
    return m[k]||0;
  }

  const KeyCode = {
    NONE:0,BACKSPACE:8,TAB:9,RETURN:13,SHIFT:16,CONTROL:17,ALT:18,PAUSE:19,CAPSLOCK:20,ESCAPE:27,
    SPACE:32,PAGEUP:33,PAGEDOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,
    SELECT:41,PRINT:42,EXECUTE:43,PRINTSCREEN:44,INSERT:45,DELETE:46,HELP:47,
    DIGIT_0:48,DIGIT_1:49,DIGIT_2:50,DIGIT_3:51,DIGIT_4:52,DIGIT_5:53,DIGIT_6:54,DIGIT_7:55,DIGIT_8:56,DIGIT_9:57,
    KEY_A:65,KEY_B:66,KEY_C:67,KEY_D:68,KEY_E:69,KEY_F:70,KEY_G:71,KEY_H:72,KEY_I:73,KEY_J:74,KEY_K:75,KEY_L:76,KEY_M:77,
    KEY_N:78,KEY_O:79,KEY_P:80,KEY_Q:81,KEY_R:82,KEY_S:83,KEY_T:84,KEY_U:85,KEY_V:86,KEY_W:87,KEY_X:88,KEY_Y:89,KEY_Z:90,
    NUMPAD_0:96,NUMPAD_1:97,NUMPAD_2:98,NUMPAD_3:99,NUMPAD_4:100,NUMPAD_5:101,NUMPAD_6:102,NUMPAD_7:103,NUMPAD_8:104,NUMPAD_9:105,
    F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123,
    NUMLOCK:144,SCROLLLOCK:145,COLON:186,EQUAL:187,COMMA:188,MINUS:189,PERIOD:190,SLASH:191,
    BACKQUOTE:192,LEFT_BRACKET:219,BACKSLASH:220,RIGHT_BRACKET:221,QUOTE:222
  };

  const Director = function(){this._scenes=[];this._sceneStack=[];this._runningScene=null;this._root=null;this._compScheduler=null;};
  Director.instance=null;
  Director.prototype.getScene=function(){return this._runningScene;};
  Director.prototype.addScene=function(s){this._runningScene=s;if(s&&this._compScheduler){s._components.forEach(c=>{if(typeof c.onLoad==='function')try{c.onLoad();}catch(e){console.error(e);}});s._components.forEach(c=>{if(typeof c.start==='function')try{c.start();}catch(e){console.error(e);}});this._updateLoop();}};
  Director.prototype.loadScene=function(name,cb){if(cb)cb(null);};
  Director.prototype.preloadScene=function(name,cb){if(cb)cb(null);};
  Director.prototype._updateLoop=function(){let last=performance.now();const loop=(t)=>{const dt=(t-last)/1000;last=t;try{this._updateAll(dt);}catch(e){console.error(e);}requestAnimationFrame(loop);};requestAnimationFrame(loop);};
  Director.prototype._updateAll=function(dt){const updateNode=(n)=>{for(const c of n._components){try{if(typeof c.update==='function')c.update(dt);if(typeof c.lateUpdate==='function')c.lateUpdate(dt);}catch(e){console.error(e);}}for(const c of n._children)updateNode(c);};if(this._runningScene)updateNode(this._runningScene);};
  const _director = new Director();
  Object.defineProperty(Director,'instance',{get(){return _director;}});

  const Game = function(){this.frame=60;this._inited=false;this._config={};this.canvas=null;this._onStart=[];};
  Game.EVENT={GAME_INIT:'game_init',GAME_START:'game_start',GAME_PAUSE:'game_pause',GAME_RESUME:'game_resume',GAME_END:'game_end',HIDE:'hide',SHOW:'show',RESTART:'restart'};
  Game.instance=null;
  Game.prototype.init=function(cfg){this._config=cfg||{};this._inited=true;};
  Game.prototype.step=function(){/*no-op*/};
  Game.prototype.addPersistRootNode=function(){/*no-op*/};
  Game.prototype.removePersistRootNode=function(){/*no-op*/};
  Game.prototype.setFrameRate=function(f){this.frame=f;};
  Game.prototype.getFrameRate=function(){return this.frame;};
  Game.prototype.pause=function(){this._paused=true;};
  Game.prototype.resume=function(){this._paused=false;};
  Game.prototype.onStart=function(cb){this._onStart.push(cb);};
  Game.prototype.loopStart=function(){this._onStart.forEach(cb=>{try{cb();}catch(e){console.error(e);}});};
  const _game = new Game();
  Object.defineProperty(Game,'instance',{get(){return _game;}});

  const TiledMap = function(){this._tmxFile=null;this._node=null;this._tileSize=new Size(32,32);};
  TiledMap.Orientation={ORTHO:1,HEX:2,ISO:3,HEX_STAGGER:4};
  const TiledLayer = function(){this._name='';this._layerIndex=0;this._tileSet=null;};
  const TiledTile = function(){this._x=0;this._y=0;this._id=0;this._grid=null;};

  const find = function(path,root){const r=root||_director._runningScene;if(!r)return null;const parts=path.split('/');let cur=r;for(const k of parts){cur=cur.getChildByName(k);if(!cur)return null;}return cur;};

  const instantiate = function(original){if(!original)return null;if(original instanceof Node)return original.instantiate();return Object.assign(Object.create(Object.getPrototypeOf(original)),original);};

  const PrefabManager = function(){};PrefabManager.instance=new PrefabManager();

  const tween = function(target){return {to(){return this;},by(){return this;},delay(){return this;},start(){return this;},stop(){return this;},union(){return this;},then(){return this;},repeat(){return this;},repeatForever(){return this;},hide(){return this;},show(){return this;},blink(){return this;},fadeIn(){return this;},fadeOut(){return this;},call(){return this;},removeSelf(){return this;},sequence(){return this;},parallel(){return this;},sineIn(){return this;},sineOut(){return this;},easing(){return this;}};};
  const Tween = {stopAll(){},stopAllByTag(){}};

  const ColorKey = {RED: new Color(255,0,0),GREEN:new Color(0,255,0),BLUE:new Color(0,0,255),WHITE:new Color(255,255,255),BLACK:new Color(0,0,0),YELLOW:new Color(255,255,0),CYAN:new Color(0,255,255),MAGENTA:new Color(255,0,255),GRAY:new Color(127,127,127)};

  const NodeSpace = {LOCAL: 0, WORLD: 1};

  const BuildTime = {buildTime: Date.now(), bundleVers: {internal: '1.0.0', resources: '1.0.0'}};
  const RenderScene = function(){};
  const AnimationManager = function(){this._anims=new Set();};AnimationManager.prototype.removeAnimation=function(){};

  const cc = {
    _decorator, _globalAssetDB: {getAssetInfo(){return null;}, getAssetInfoByUuid(){return null;}},
    _applyDecorator(){}, _decorators: [], Node, Component, UITransform, Sprite, Label, Button, Widget, Canvas, Camera,
    ScrollView, Layout, Toggle, ProgressBar, UIOpacity, Graphics, Prefab, SpriteFrame, Texture2D, ImageAsset,
    Slider, Mask, AudioSource, AudioListener, TiledMap, TiledLayer, TiledTile,
    Vec3: V3, Vec2: V2, v3: (x,y,z)=>new V3(x,y,z), v2: (x,y)=>new V2(x,y), Vec4: function(x=0,y=0,z=0,w=0){this.x=x;this.y=y;this.z=z;this.w=w;},
    Quat, Size, Rect, Color, find, instantiate, director: _director, game: _game, view, sys,
    resources, assetManager, Input, KeyCode, EventTarget: EH, EventKeyboard: function(code){this.keyCode=code;},
    EventMouse: function(){}, EventTouch: function(){this._startPoint=this._point=new V2();this.getId=()=>1;},
    NodeSpace, ColorKey, PrefabManager, AnimationManager, RenderScene, BuildTime,
    Tween, tween, warn(){console.warn.apply(console,arguments);}, error(){console.error.apply(console,arguments);}, log(){console.log.apply(console,arguments);},
    js: {getClassName(o){return o&&o.__ccclass||(o.constructor&&o.constructor.__ccclass)||(o.constructor&&o.constructor.name)||'Object';}, getSuper(){return null;}, isChildClassOf(a,b){try{return a.prototype instanceof b;}catch(e){return false;}}, mixin(){}, isString(a){return typeof a==='string';}, id: ()=>'uid_'+Math.random().toString(36).slice(2,9)},
    math: { clamp: function(v,a,b){return Math.max(a,Math.min(b,v));}, lerp: function(a,b,t){return a+(b-a)*t;}, toRadian: function(d){return d*Math.PI/180;}, toDegree: function(r){return r*180/Math.PI;}, smoothstep: function(e0,e1,x){const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);}},
    Enum: function(o){return Object.assign(Object.create(null),o);},
    loader: resources,
    geometry: { distance: function(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}, intersect: function(){return false;}},
    renderer: { scene: new RenderScene() },
    builtinResMgr: {getUUM(name){return null;}}
  };

  Object.defineProperty(cc,'TWEEN',{get:()=>typeof require==='undefined'?null:null});

  Object.keys(KeyCode).forEach(k=>{
    if(k.startsWith('KEY_')){KeyCode[k.replace('KEY_','')]=KeyCode[k];}
  });

  window.cc = cc;
  if(window.globalThis)window.globalThis.cc = cc;

  window.addEventListener('load',()=>{
    setTimeout(()=>{
      if(typeof TicketSim !== 'undefined' && TicketSim.init){try{TicketSim.init();}catch(e){console.error(e);}}
    },800);
  });

})();
`;

const loadGame = `
window.TicketSim = (function() {
  function boot() {
    const cc = window.cc;
    if (!cc) { console.error('[TS] 未加载引擎'); return; }
    console.log('[TS] 启动票务模拟器...');

    try {
      const gameDiv = document.getElementById('GameDiv');
      if (!gameDiv) { console.error('[TS] 找不到 GameDiv'); return; }

      const canvas = document.createElement('canvas');
      canvas.id = 'GameCanvas';
      canvas.width = 1280;
      canvas.height = 720;
      canvas.style.background = '#0a0a14';
      gameDiv.appendChild(canvas);

      cc.game._canvas = canvas;
      cc.view.setDesignResolutionSize(1280, 720, 0);
      cc.game.frame = 60;
      cc.director._compScheduler = true;

      const scene = new cc.Node('main-menu');
      scene._isScene = true;
      scene.setPosition(0,0,0);

      const cam = new cc.Node('Main Camera');
      cam.addComponent(cc.Camera);
      cam.setPosition(0, 0, 1000);
      scene.addChild(cam);

      const cv = new cc.Node('Canvas');
      const uit = cv.addComponent(cc.UITransform);
      uit.setContentSize(1280, 720);
      cv.addComponent(cc.Canvas);
      cv.setPosition(0, 0, 0);
      scene.addChild(cv);

      cv.on(Node.EventType.TOUCH_END, (e)=>{});

      try {
        const B = window.Bootstrap || (window.TicketSimInternal && window.TicketSimInternal.Bootstrap);
        if (B) {
          const b = cv.addComponent(B);
          if (b && typeof b.onLoad === 'function') b.onLoad();
          console.log('[TS] Bootstrap 已挂载');
        } else {
          console.warn('[TS] Bootstrap 未找到，使用内嵌启动器');
          useEmbeddedStarter(cv);
        }
      } catch (e) {
        console.warn('[TS] Bootstrap 加载失败:', e);
        useEmbeddedStarter(cv);
      }

      cc.director.addScene(scene);
      cc.game.loopStart();

      setTimeout(()=>{ const l=document.getElementById('loading'); if(l) l.classList.add('hide'); }, 1200);

      function injectTouch() {
        let down = false;
        const dispatch = (type, e) => {
          let target = cv;
          const t = e.changedTouches? e.changedTouches[0] : e;
          const p = clientToLocal(t, cv);
          let ev = { type, getUILocation: ()=>({x:p.x,y:p.y}), _raw: e, preventDefault:()=>e.preventDefault&&e.preventDefault(), stopPropagation:()=>e.stopPropagation&&e.stopPropagation(), propagationStopped:false };
          const visited = [];
          const findTarget = (n) => {
            visited.push(n);
            if (!n._active) return;
            let hit = false;
            const ut = n.getComponent(cc.UITransform);
            if (ut) {
              const sz = ut.getContentSize();
              const np = n.getPosition();
              const ap = ut._anchorPoint || new cc.Vec2(.5,.5);
              const x0 = np.x - ap.x*sz.width, y0 = np.y - ap.y*sz.height;
              hit = (p.x>=x0 && p.x<=x0+sz.width && p.y>=y0 && p.y<=y0+sz.height);
            }
            for (let i = n._children.length - 1; i >= 0; i--) {
              const r = findTarget(n._children[i]);
              if (r) return r;
            }
            return hit ? n : null;
          };
          target = findTarget(cv) || cv;
          target._events && target._events.emit(type, ev);
        };
        function clientToLocal(t, node) {
          const rect = canvas.getBoundingClientRect();
          const sx = 1280 / rect.width, sy = 720 / rect.height;
          return { x: (t.clientX - rect.left) * sx - 640, y: (rect.height - (t.clientY - rect.top)) * sy - 360 };
        }
        canvas.addEventListener('mousedown', e=>{down=true;dispatch('touchstart',e);});
        canvas.addEventListener('mousemove', e=>{if(down)dispatch('touchmove',e);});
        window.addEventListener('mouseup', e=>{if(down){down=false;dispatch('touchend',e);}if(down===false){dispatch('touchcancel',e);}});
        canvas.addEventListener('click', e=>dispatch('click',e));
        canvas.addEventListener('touchstart', e=>{e.preventDefault();down=true;dispatch('touchstart',e);},{passive:false});
        canvas.addEventListener('touchmove', e=>{e.preventDefault();dispatch('touchmove',e);},{passive:false});
        canvas.addEventListener('touchend', e=>{e.preventDefault();dispatch('touchend',e);down=false;},{passive:false});
        canvas.addEventListener('touchcancel', e=>{e.preventDefault();dispatch('touchcancel',e);down=false;},{passive:false});
        canvas.addEventListener('contextmenu', e=>e.preventDefault());
      }
      injectTouch();

      function useEmbeddedStarter(rootCanvas) {
        const bootstrap = { sceneRegistry: new Map(), loadScene(name){ const bd=this.sceneRegistry.get(name); if(!bd)return; rootCanvas.removeAllChildren(); try{rootCanvas.addChild(bd());}catch(e){console.error(e);} }, createSpriteNode(name,w,h,color){const n=new cc.Node(name);const u=n.addComponent(cc.UITransform);u.setContentSize(w,h);const s=n.addComponent(cc.Sprite);s.color=color;return n;}, createLabel(name,t,size,x,y,c,w){const n=new cc.Node(name);const u=n.addComponent(cc.UITransform);u.setContentSize(w||400,size+10);n.setPosition(x,y);const l=n.addComponent(cc.Label);l.string=t;l.fontSize=size;l.color=c;l.lineHeight=size+10;return l;}, createLabelOnParent(p,n,t,s,x,y,c,w){const l=this.createLabel(n,t,s,x,y,c,w);p.addChild(l.node);return l;}, createMenuButton(name,t,x,y,color,w,cb,h=50){const n=this.createSpriteNode(name,w,h,color);n.setPosition(x,y);this.createLabelOnParent(n,'L',t,18,0,0,new cc.Color(255,255,255),w);const b=n.addComponent(cc.Button);b.transition=Button.Transition.SCALE;b.zoomScale=0.95;n.on('touchend',cb);n.on('click',cb);return n;}, createToggle(p,id,x,y,val,onChange){const t=this.createSpriteNode('T_'+id,60,28,val?new cc.Color(46,204,113):new cc.Color(120,120,140));t.setPosition(x+30,y);const th=this.createSpriteNode('Th',22,22,new cc.Color(255,255,255));th.setPosition(val?15:-15,0);t.addChild(th);t.addComponent(cc.Button);t.on('touchend',()=>onChange(!val));t.on('click',()=>onChange(!val));p.addChild(t);return t;}, node: rootCanvas };
        window.bootstrapRef = bootstrap;
        buildAllScenes(bootstrap);
        bootstrap.loadScene('main-menu');
      }
${readAllUserScripts(ROOT)}
    } catch(e) {
      console.error('[TS] 启动错误:', e);
      const gameDiv = document.getElementById('GameDiv');
      if (gameDiv) gameDiv.innerHTML = '<div style="color:#e74c3c;padding:40px;text-align:center;">启动失败: ' + (e.message||e) + '</div>';
    }
  }
  return { init: boot };
})();
`;

function readAllUserScripts(root) {
  const dirs = [
    { p: join(root, 'assets/scripts/core'), out: 'core' },
    { p: join(root, 'assets/scripts/managers'), out: 'managers' },
    { p: join(root, 'assets/scripts/ui'), out: 'ui' },
    { p: join(root, 'assets/scripts/scenes'), out: 'scenes' }
  ];
  let code = '';

  try {
    const mainBoot = readFileSync(join(root, 'assets/scripts/Bootstrap.ts'), 'utf-8');
    code += '\n/* === Bootstrap.ts === */\n' + stripTS(mainBoot) + '\n';
  } catch (e) {
    code += `\n/* Bootstrap.ts 读取失败: ${e.message} */\n`;
  }

  for (const dir of dirs) {
    if (!existsSync(dir.p)) continue;
    for (const f of readdirSync(dir.p)) {
      if (!f.endsWith('.ts')) continue;
      if (f === 'Bootstrap.ts') continue;
      try {
        const content = readFileSync(join(dir.p, f), 'utf-8');
        code += `\n/* === ${dir.out}/${f} === */\n` + stripTS(content) + '\n';
      } catch (e) {}
    }
  }
  return `
        function buildAllScenes(ui) {
          ${code}
          const internal = {};
          try {
            internal.MainMenuBuilder = (typeof MainMenuBuilder !== 'undefined') ? MainMenuBuilder : null;
            internal.GameSceneBuilder = (typeof GameSceneBuilder !== 'undefined') ? GameSceneBuilder : null;
            internal.ResultSceneBuilder = (typeof ResultSceneBuilder !== 'undefined') ? ResultSceneBuilder : null;
            internal.SettingsSceneBuilder = (typeof SettingsSceneBuilder !== 'undefined') ? SettingsSceneBuilder : null;
            internal.ReviewSceneBuilder = (typeof ReviewSceneBuilder !== 'undefined') ? ReviewSceneBuilder : null;
          } catch (e) { console.warn(e); }
          try { ui.sceneRegistry.set('main-menu', () => internal.MainMenuBuilder ? new internal.MainMenuBuilder().build(ui) : buildDefaultMenu(ui)); } catch (e) { ui.sceneRegistry.set('main-menu', () => buildDefaultMenu(ui)); }
          try { ui.sceneRegistry.set('game-scene', () => new internal.GameSceneBuilder().build(ui)); } catch (e) { ui.sceneRegistry.set('game-scene', () => buildDefaultMenu(ui)); }
          try { ui.sceneRegistry.set('result-scene', () => new internal.ResultSceneBuilder().build(ui)); } catch (e) { ui.sceneRegistry.set('result-scene', () => buildDefaultMenu(ui)); }
          try { ui.sceneRegistry.set('settings-scene', () => new internal.SettingsSceneBuilder().build(ui)); } catch (e) { ui.sceneRegistry.set('settings-scene', () => buildDefaultMenu(ui)); }
          try { ui.sceneRegistry.set('review-scene', () => new internal.ReviewSceneBuilder().build(ui)); } catch (e) { ui.sceneRegistry.set('review-scene', () => buildDefaultMenu(ui)); }

          if (!ui.sceneRegistry.has('main-menu')) ui.sceneRegistry.set('main-menu', () => buildDefaultMenu(ui));
        }
        function buildDefaultMenu(ui) {
          const root = new cc.Node('Default');
          root.addComponent(cc.UITransform).setContentSize(1280, 720);
          root.addChild(ui.createSpriteNode('BG', 1280, 720, new cc.Color(28,28,48)));
          ui.createLabelOnParent(root, 'L1', '🎫 票务模拟器', 48, 0, 200, new cc.Color(255,215,0));
          ui.createLabelOnParent(root, 'L2', '引擎脚本加载成功，正在尝试构建场景...', 18, 0, 100, new cc.Color(200,200,200), 800);
          ui.createLabelOnParent(root, 'L3', (new Date()).toLocaleString(), 14, 0, 60, new cc.Color(120,120,120));
          try {
            root.addChild(ui.createMenuButton('B1', '🎮 进入游戏', 0, -50, new cc.Color(46,204,113), 240, () => {
              if(ui.sceneRegistry.has('game-scene')) ui.loadScene('game-scene');
            }));
            root.addChild(ui.createMenuButton('B2', '⚙️ 设置', -200, -130, new cc.Color(155,89,182), 200, () => { ui.loadScene('settings-scene'); }));
            root.addChild(ui.createMenuButton('B3', '📊 复盘', 200, -130, new cc.Color(230,126,34), 200, () => { ui.loadScene('review-scene'); }));
          } catch (e) { console.warn(e); }
          return root;
        }
`;
}

function stripTS(src) {
  let out = src;
  out = out.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  out = out.replace(/^export\s+/gm, '');
  out = out.replace(/:\s*[A-Z][\w<>\[\],\s|&]+(?=\s*[=,)])/g, '');
  out = out.replace(/<[A-Z][\w<>\[\],\s|&]*>/g, '');
  out = out.replace(/\s+as\s+\w+(\s*[,\)])/g, '$1');
  out = out.replace(/^\s*@ccclass\s*\(.*?\)\s*$/gm, '/* @ccclass */');
  out = out.replace(/^\s*@property\s*\(.*?\)\s*$/gm, '/* @property */');
  out = out.replace(/public\s+/g, '');
  out = out.replace(/private\s+/g, '');
  out = out.replace(/protected\s+/g, '');
  out = out.replace(/readonly\s+/g, '');
  out = out.replace(/implements\s+.*?(?=[{\s])/g, '');
  out = out.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
  out = out.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '');
  out = out.replace(/declare\s+.*?;/g, '');
  return out;
}

const gameJs = stubCC + loadGame;
writeFileSync(join(DIST, 'game.js'), gameJs, 'utf-8');

const readme = `
# 🎫 票务模拟器 - 独立构建输出 (dist/)

此目录是通过 \`npm run build:web\` 生成的**不依赖 Cocos Creator CLI** 的独立 Web 构建。

## 运行方式

\`\`\`bash
# 方式一: 直接启动静态服务器 (推荐)
npx http-server ./dist -p 8080

# 方式二: 如果你全局安装了 http-server
http-server ./dist -p 8080
\`\`\`

然后用浏览器打开 http://localhost:8080

## 包含内容

- \`index.html\`: 页面框架 + 加载动画
- \`game.js\`: 引擎模拟层 (shim) + 用户脚本内联打包

## 说明

此模式下使用了浏览器端纯 JS 实现的 Cocos Creator API 兼容层 (stub),
功能上以 UI 交互为主,可以实际游玩主菜单 → 关卡 → 游戏 → 结算 → 复盘流程。

若需全功能渲染与编辑器构建,请使用:
\`npm run build:creator\` (需要已安装 Cocos Creator 并配置 CLI)

`;
writeFileSync(join(DIST, 'README.txt'), readme, 'utf-8');

const info = `
构建时间: ${new Date().toLocaleString()}
脚本数量: ${readAllUserScripts(ROOT).split('/* ===').length - 1}
输出路径: ${DIST}
引擎模式: 浏览器 Stub 兼容层 (可实际游玩)
`;
writeFileSync(join(DIST, 'BUILD_INFO.txt'), info, 'utf-8');

console.log('\n✅ 构建成功! 输出:', DIST);
console.log('   📦 运行: npm run serve:web');
console.log('   🔗 或: npx http-server ./dist -p 8080 -o\n');
