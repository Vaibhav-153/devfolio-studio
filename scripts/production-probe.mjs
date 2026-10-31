#!/usr/bin/env node
/** A read-only, no-credentials HTTP probe for the deployed platform. */
const target=process.env.DEVFOLIO_PROBE_URL;
if(!target){console.error('Set DEVFOLIO_PROBE_URL to the HTTPS staging root.');process.exit(2);}
let origin;
try{origin=new URL(target);if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw Error('HTTPS required');}
catch{console.error('DEVFOLIO_PROBE_URL is not an allowed HTTP(S) root.');process.exit(2);}
for(const [path,expected] of [['/',200],['/health',200],['/health/ready',200]]){
  try{
    const res=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(12000),cache:'no-store',redirect:'manual'});
    const actual=res.status;
    const header=res.headers.get('x-content-type-options');
    if(actual!==expected||header!=='nosniff')throw Error(`HTTP ${actual}; headers ${header||'missing'}`);
    console.log(`PASS ${path} (${actual})`);
  }catch(e){console.error(`FAIL ${path}: ${e.message}`);process.exitCode=1;}
}
if(!process.exitCode)console.log('Production probe passed. This is not a multi-user security test.');
