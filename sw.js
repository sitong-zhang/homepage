const CACHE='zjt-earth-v8';
const ASSETS=[
'./',
'./vendor/three/build/three.module.js',
'./vendor/three/examples/jsm/controls/OrbitControls.js',
'./vendor/three/examples/jsm/postprocessing/EffectComposer.js',
'./vendor/three/examples/jsm/postprocessing/RenderPass.js',
'./vendor/three/examples/jsm/postprocessing/ShaderPass.js',
'./vendor/three/examples/jsm/postprocessing/MaskPass.js',
'./vendor/three/examples/jsm/postprocessing/Pass.js',
'./vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js',
'./vendor/three/examples/jsm/postprocessing/OutputPass.js',
'./vendor/three/examples/jsm/shaders/CopyShader.js',
'./vendor/three/examples/jsm/shaders/LuminosityHighPassShader.js',
'./vendor/three/examples/jsm/shaders/OutputShader.js',
'./vendor/d3-array.min.js',
'./vendor/d3-geo.min.js',
'./vendor/topojson-client.min.js',
'./vendor/land-10m.json',
'./vendor/mediapipe/vision_bundle.mjs',
'./vendor/mediapipe/gesture_recognizer.task',
'./vendor/mediapipe/wasm/vision_wasm_internal.js',
'./vendor/mediapipe/wasm/vision_wasm_internal.wasm',
'./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js',
'./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm'
];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(function(resp){
      if(resp&&resp.ok){const cl=resp.clone();caches.open(CACHE).then(function(c){c.put(e.request,cl)})}
      return resp;
    }).catch(function(){return caches.match('./')}));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(r){
    if(r)return r;
    return fetch(e.request).then(function(resp){
      if(resp&&resp.ok){const cl=resp.clone();caches.open(CACHE).then(function(c){c.put(e.request,cl)})}
      return resp;
    });
  }).catch(function(){return caches.match('./')}));
});
