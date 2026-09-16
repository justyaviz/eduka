import {useSyncExternalStore} from 'react';
const subscribe=(cb:()=>void)=>{window.addEventListener('popstate',cb);return()=>window.removeEventListener('popstate',cb)};
export const usePathname=()=>useSyncExternalStore(subscribe,()=>['/','/app','/app/','/app.html','/login'].includes(window.location.pathname)?'/home':window.location.pathname);
const router={push(path:string){history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'))},back(){history.back()}};
export const useRouter=()=>router;
