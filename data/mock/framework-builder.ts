import type { FrameworkCheck, FrameworkSection, FrameworkWorkflowState } from '@/types/framework'

const sectionSeeds:[string,string,string,number,number,string[]][]=[
  ['performance','PERF','Performance',20,8,['Largest Contentful Paint','Interaction to Next Paint','Cumulative Layout Shift']],
  ['seo','SEO','SEO',20,9,['Meta descriptions','Indexability','Structured data']],
  ['accessibility','A11Y','Accessibility',15,6,['Heading hierarchy','Colour contrast','Keyboard navigation']],
  ['content','CONT','Content',10,5,['Value proposition','Content accuracy','Reading clarity']],
  ['ux','UX','User Experience',15,5,['Navigation clarity','Primary journeys','Responsive behaviour']],
  ['technical','TECH','Technical Health',15,6,['HTTPS configuration','Broken resources','Analytics configuration']],
  ['security','SEC','Security',5,3,['Security headers','Cookie controls','Exposed services']],
]

function makeChecks(sectionId:string,prefix:string,count:number,names:string[]):FrameworkCheck[]{return Array.from({length:count},(_,index)=>({id:`${sectionId}-${index+1}`,sectionId,code:`${prefix}-${String(index+1).padStart(3,'0')}`,name:names[index]||`${names[0]} check ${index+1}`,description:`Assess ${names[index]?.toLowerCase()||'this framework requirement'} against the agreed standard.`,assessmentMethod:index%3===0?'Automated':'Manual',criteria:index===0&&sectionId==='performance'?'Largest Contentful Paint should be ≤ 2.5 seconds.':'The expected condition should be met and supported by current evidence.',responseType:'Pass / Fail',weight:Math.round(100/count),required:index<Math.ceil(count*.75),allowNA:true,guidance:'Review the available evidence, record the result and add a finding when the condition is not met.',evidenceRequirement:index%2===0?'Required':'On failure',severityBehaviour:index===0?'High when failed':'Medium when failed'}))}

export const defaultFrameworkSections:FrameworkSection[]=sectionSeeds.map(([id,prefix,name,weight,count,names])=>({id,code:prefix,name,weight,description:`Assess ${name.toLowerCase()} requirements and expected outcomes.`,guidance:`Complete every required ${name.toLowerCase()} check and attach supporting evidence.`,checks:makeChecks(id,prefix,count,names)}))

export const initialFrameworkState:FrameworkWorkflowState={
  details:{name:'',code:'',auditType:'Website Audit',description:'',owner:'Alex Reed',organisation:'Oak & Pixel',visibility:'Organisation',version:'v1.0',tags:[]},
  sections:defaultFrameworkSections,
  scoring:{model:'Weighted Score',minimum:0,maximum:100,bands:[{id:'excellent',minimum:90,maximum:100,label:'Excellent'},{id:'good',minimum:80,maximum:89,label:'Good'},{id:'improve',minimum:70,maximum:79,label:'Needs Improvement'},{id:'poor',minimum:50,maximum:69,label:'Poor'},{id:'critical',minimum:0,maximum:49,label:'Critical'}],severities:[{id:'critical',name:'Critical',scoreImpact:-20,priority:'P1',sla:'24 hours',colour:'#dc2626'},{id:'high',name:'High',scoreImpact:-10,priority:'P2',sla:'3 days',colour:'#ea580c'},{id:'medium',name:'Medium',scoreImpact:-5,priority:'P3',sla:'14 days',colour:'#d97706'},{id:'low',name:'Low',scoreImpact:-2,priority:'P4',sla:'30 days',colour:'#2563eb'},{id:'info',name:'Informational',scoreImpact:0,priority:'P5',sla:'As planned',colour:'#64748b'}],failureRules:{createFinding:true,classifySeverity:true,capCriticalScore:true},conditionalRules:[{id:'rule-mobile-performance',sourceCheckId:'performance-1',operator:'greater than',value:'2.5',action:'Require evidence',target:'Mobile performance screenshot',enabled:true}]},
  evidence:{policy:'Defined per check',allowedTypes:['Screenshot','Document','File','URL','Report','Data','Video','Image','Notes'],requireReview:true,requireValidation:true,allowExternalUrls:true,allowAutomatedCollection:true,minimumPerFailedCheck:1,retentionPolicy:'Organisation default',overrides:{}},
  governance:{editing:'Owner only',approvalRequired:false,approver:'Thelma Dube',versioning:'Major / Minor',requireChangeNotes:true,auditTrail:true},
}
