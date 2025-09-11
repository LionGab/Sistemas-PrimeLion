const fs = require('fs');
const path = require('path');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

console.log('🏗️  Construindo /public para produção...');
ensureDir('public');

const itemsToCopy = ['index.html','assets','pages','components'];

function copyRecursive(src, dest){
  const st = fs.statSync(src);
  if(st.isDirectory()){
    ensureDir(dest);
    for(const f of fs.readdirSync(src)){
      copyRecursive(path.join(src,f), path.join(dest,f));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

for(const item of itemsToCopy){
  if(fs.existsSync(item)){
    console.log(`📂 Copiando ${item}...`);
    copyRecursive(item, path.join('public', item));
  } else {
    console.log(`⚠️  ${item} não encontrado, pulando...`);
  }
}

// 404 para GitHub Pages
const notFound = path.join('public','404.html');
if(!fs.existsSync(notFound)){
  fs.writeFileSync(notFound, '<!doctype html><meta charset="utf-8"><title>404</title><p>Recurso não encontrado.</p>');
}

// Varredura para bloquear arquivos indevidos no build
const banned = [/debug/i, /^test/i, /limpar/i];
function scan(dir){
  for(const f of fs.readdirSync(dir)){
    const p = path.join(dir,f);
    const st = fs.statSync(p);
    if(st.isDirectory()) scan(p);
    else if(banned.some(rx => rx.test(f))){
      throw new Error(`Arquivo proibido encontrado em /public: ${p}`);
    }
  }
}
scan('public');

console.log('✅ Build concluído! /public pronto para deploy.');