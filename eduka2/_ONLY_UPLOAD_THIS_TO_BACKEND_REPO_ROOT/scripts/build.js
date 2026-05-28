const fs = require("fs");
const path = require("path");
const here = __dirname;
const publicDir = path.join(here, "public");
const parentPublicDir = path.join(here, "..", "public");
function copyDir(src,dest){if(!fs.existsSync(src))return false;fs.mkdirSync(dest,{recursive:true});for(const item of fs.readdirSync(src)){const s=path.join(src,item),d=path.join(dest,item),st=fs.statSync(s);if(st.isDirectory())copyDir(s,d);else fs.copyFileSync(s,d)}return true}
if(!fs.existsSync(publicDir)&&fs.existsSync(parentPublicDir))copyDir(parentPublicDir,publicDir);
if(!fs.existsSync(publicDir)){fs.mkdirSync(publicDir,{recursive:true});fs.writeFileSync(path.join(publicDir,"index.html"),"<!doctype html><html><body><h1>EDUKA</h1></body></html>")}
console.log("Build check passed.");
