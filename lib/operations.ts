/** Minimal structured logging: no emails, tokens, layout JSON, PII, or raw URLs. */
export type OperationalEvent = 'readiness_failure'|'publication_rejected'|'publication_failure'|'restore_failure'|'unpublish_failure'|'beta_feedback_failure';
export function logOperationalEvent(event:OperationalEvent, fields: {code?:string; operation?:string; requestId?:string} = {}) {
  const safe = {
    event,
    time:new Date().toISOString(),
    code:typeof fields.code==='string'?fields.code.slice(0,50):undefined,
    operation:typeof fields.operation==='string'?fields.operation.slice(0,40):undefined,
    requestId:typeof fields.requestId==='string'?fields.requestId.slice(0,64):undefined,
  };
  console.error(JSON.stringify(safe));
}
