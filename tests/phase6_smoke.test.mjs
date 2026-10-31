import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedBase,probeRelease} from '../scripts/release-smoke.mjs';

const response=(status,extra={})=>({status,headers:{get:key=>({...{'x-content-type-options':'nosniff','x-frame-options':'DENY','cache-control':'no-store'},...extra})[key]||null}});
const fake=async url=>{const u=new URL(url);if(u.hostname.startsWith('admin.'))return response(404);
 if(u.pathname==='/dashboard')return response(307);
 if(u.pathname.includes('phase6-not-real'))return response(404);
 return response(200);};
test('passes read-only root and wildcard checks in a mock deployment',async()=>{
 const result=await probeRelease({baseUrl:'https://platform.example/',rootDomain:'platform.example',publicHandle:'developer',projectSlug:'test-project',fetcher:fake});
 assert.equal(result.ok,true);assert.equal(result.summary.pass,9);assert.equal(result.limited,true);
});
test('flags misconfigured database readiness without claiming release success',async()=>{
 const mock=async url=>new URL(url).pathname==='/health/ready'?response(503):fake(url);
 const result=await probeRelease({baseUrl:'https://platform.example/',fetcher:mock});
 assert.equal(result.ok,false);assert.equal(result.results.find(x=>x.label==='Database readiness').status,'fail');
});
test('detects missing security headers',async()=>{
 const mock=async()=>response(200,{'x-content-type-options':'missing'});
 const result=await probeRelease({baseUrl:'https://platform.example/',fetcher:mock});assert.equal(result.ok,false);
});
test('rejects remote cleartext HTTP and embedded credentials',()=>{
 for(const url of ['http://platform.example/','https://someone:secret@platform.example/','https://platform.example/dashboard'])assert.throws(()=>allowedBase(url));
});
test('never sends authorization headers during public probes',async()=>{
 let intercepted=false;
 await probeRelease({baseUrl:'https://platform.example/',fetcher:async (_,opts)=>{if(opts.headers.Authorization||opts.headers.authorization)intercepted=true;return fake(_);}});
 assert.equal(intercepted,false);
});
