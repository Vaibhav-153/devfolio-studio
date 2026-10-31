const fs=require('node:fs');const path=require('node:path');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root=path.join(__dirname,'..');let checked=0,errors=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','preview','preview-phase2','preview-phase3','public'].includes(item.name))continue;let p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.tsx?$/.test(p)){checked++;const source=fs.readFileSync(p,'utf8');const sf=ts.createSourceFile(p,source,ts.ScriptTarget.Latest,true,p.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const e of sf.parseDiagnostics||[])errors.push(path.relative(root,p)+': '+ts.flattenDiagnosticMessageText(e.messageText,' '));
}}}
walk(root);console.log(`${checked} TS/TSX files checked`);if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('PASS: TypeScript syntax parsed');
