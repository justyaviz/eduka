import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({base:'/crm/',plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url)),'next/link':fileURLToPath(new URL('./router-link.tsx',import.meta.url)),'next/navigation':fileURLToPath(new URL('./router.tsx',import.meta.url))}},build:{outDir:'../public/crm',emptyOutDir:true}});
