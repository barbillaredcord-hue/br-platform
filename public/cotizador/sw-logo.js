const CACHE='aluxor-user-logo-v1';
const LOGO='/cotizador/aluxor-logo.svg';
self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin && url.pathname===LOGO){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const custom=await cache.match(LOGO,{ignoreSearch:true});
      if(custom)return custom;
      return fetch(event.request);
    })());
  }
});
self.addEventListener('message',event=>{if(event.data?.type==='ALUXOR_LOGO_UPDATED'){self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>clients.forEach(c=>c.postMessage({type:'ALUXOR_LOGO_UPDATED'})))}});