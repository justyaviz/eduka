import {forwardRef,type AnchorHTMLAttributes} from 'react';
import {useRouter} from './router';
export default forwardRef<HTMLAnchorElement,AnchorHTMLAttributes<HTMLAnchorElement>>(function Link({href='',onClick,...props},ref){const router=useRouter();return <a {...props} href={href} ref={ref} onClick={e=>{onClick?.(e);if(!e.defaultPrevented&&e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&href.startsWith('/')&&props.target!=='_blank'){e.preventDefault();router.push(href)}}}/>});
