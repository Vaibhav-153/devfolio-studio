/* Node built-in test runner. Loads first-party TypeScript source using the project's TypeScript dependency. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename });
  mod._compile(result.outputText, filename);
};
const {defaultLayout, exampleSite, exampleProjects} = require('../lib/defaults.ts');
const {cleanLayout,cleanSnapshot,safeHttpUrl,validHandle} = require('../lib/validation.ts');
process.env.NEXT_PUBLIC_ROOT_DOMAIN='example.com';
const {getTenantHandle} = require('../lib/host.ts');

test('seeded portfolio layouts are valid', () => {
  const home = cleanLayout(defaultLayout());
  assert.ok(home.blocks.some(b => b.type === 'Freeform'));
  assert.equal(cleanLayout(defaultLayout('projects')).schemaVersion, 1);
});
test('freeform layouts preserve distinct mobile positions', () => {
  const doc = cleanLayout(defaultLayout());
  const node = doc.blocks.find(b => b.type === 'Freeform').props.nodes[0];
  assert.notDeepEqual(node.layout.desktop, node.layout.mobile);
  assert.ok(node.layout.mobile.w <= 100);
});
test('malicious HTML block types, duplicate IDs and excessive blocks fail validation', () => {
  assert.throws(() => cleanLayout({schemaVersion:1,blocks:[{id:'1',type:'Script',props:{},style:{}}]}));
  assert.throws(() => cleanLayout({schemaVersion:1,blocks:[{id:'same',type:'Text'},{id:'same',type:'Hero'}]}));
  assert.throws(() => cleanLayout({schemaVersion:1,blocks:Array(61).fill({id:'z',type:'Hero'})}));
});
test('unsafe URLs are never accepted for published links', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('data:text/html,<script>'), '');
  assert.equal(safeHttpUrl('https://example.com/'), 'https://example.com/');
});
test('handles and subdomains must be canonical and non-reserved', () => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN='example.com';
  assert.equal(validHandle('developer-101'), true);
  assert.equal(validHandle('admin'), false);
  assert.equal(validHandle('a'), false);
  assert.equal(getTenantHandle('developer-101.example.com:443'),'developer-101');
  assert.equal(getTenantHandle('app.example.com'), null);
  assert.equal(getTenantHandle('developer-101.example.com.attacker.org'), null);
});
test('public snapshots use an approved component and content schema', () => {
  const raw={schemaVersion:1,template:'minimal',site:exampleSite,projects:exampleProjects,pages:[{key:'home',title:'Home',layout:defaultLayout()}]};
  const clean=cleanSnapshot(raw);
  assert.ok(clean);
  assert.equal(clean.pages[0].key,'home');
  const invalid=JSON.parse(JSON.stringify(raw));invalid.pages[0].layout.blocks[0].type='iframe';
  assert.equal(cleanSnapshot(invalid),null);
});
