export type BetaFeedbackKind='bug'|'usability'|'idea';
export type BetaFeedbackSeverity='low'|'normal'|'blocking';
export type BetaFeedbackInput={kind:BetaFeedbackKind;severity:BetaFeedbackSeverity;title:string;description:string;pagePath:string};
export function validateBetaFeedback(raw:Record<string,unknown>):BetaFeedbackInput{
 const val=(key:string)=>typeof raw[key]==='string'?String(raw[key]).trim():'';
 const kind=val('kind'),severity=val('severity'),title=val('title'),description=val('description'),pagePath=val('pagePath')||'/dashboard';
 if(!['bug','usability','idea'].includes(kind))throw Error('Choose a feedback category.');
 if(!['low','normal','blocking'].includes(severity))throw Error('Choose a priority.');
 if(title.length<5||title.length>120)throw Error('Write a short title (5 to 120 characters).');
 if(description.length<20||description.length>3000)throw Error('Explain the issue or suggestion in 20 to 3000 characters.');
 if(pagePath.length>160||!pagePath.startsWith('/')||pagePath.startsWith('//')||/[\\\r\n]/.test(pagePath))throw Error('Invalid page location.');
 return {kind:kind as BetaFeedbackKind,severity:severity as BetaFeedbackSeverity,title,description,pagePath};
}
