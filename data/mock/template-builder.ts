import type { TemplateWorkflowState } from '@/types/template'

export const initialTemplateState:TemplateWorkflowState={
  details:{name:'',code:'',auditType:'Website Audit',description:'',owner:'Alex Reed',organisation:'Oak & Pixel',visibility:'Organisation',status:'Draft',tags:[]},
  frameworkId:'fwk-web-001',
  configuration:{auditNamePattern:'{Organisation} Website Audit — {Month} {Year}',priority:'Medium',dueDateOffset:14,assessmentType:'Baseline',autoCreateBaseline:true,defaultStatus:'Draft',allowOverrides:true},
  scope:{values:{crawlDepth:3,maximumPages:250,includeSubdomains:false,followExternalLinks:false,mobileAudit:true,desktopAudit:true,authenticationRequired:false,includedPaths:[],excludedPaths:[]},allowOverride:true},
  team:[{id:'lead',participationRole:'Audit Lead',defaultUser:'',placeholderRole:'Unassigned'},{id:'auditor',participationRole:'Auditor / Consultant',defaultUser:'',placeholderRole:'Unassigned'},{id:'reviewer',participationRole:'Reviewer',defaultUser:'',placeholderRole:'Unassigned'},{id:'technical',participationRole:'Technical Owner',defaultUser:'',placeholderRole:'Organisation stakeholder'}],
  evidence:{policy:'Framework default',allowedTypes:['Screenshot','File','Report','Document','Data','URL','Image','Video','Observation','Other'],reviewRequired:true,defaultStatus:'Needs Review',defaultPriority:'Medium',allowOverride:true},
  governance:{editing:'Owner only',allowDuplicate:true,approvalRequired:false,approver:'Thelma Dube',version:'v1.0',versioning:'Major / Minor',changeNotesRequired:true,auditTrail:true},
}

export const roleLabels:Record<string,string[]>={
  'Website Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Technical Owner','Content Owner'],
  'Brand Consistency Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Brand Owner','Marketing Stakeholder'],
  'Digital Presence Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Channel Owner','Marketing Stakeholder'],
  'Operational Flow Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Process Owner','Subject Matter Expert','Participant'],
  'Customer Experience Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Experience Owner','Journey Owner','Service Owner'],
  'People Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','People Owner','Business Leader','Employee Representative'],
  'Intelligence Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer','Information Owner','Data Steward','Decision Maker'],
  'Custom Audit':['Audit Lead','Auditor / Consultant','Reviewer','Contributor','Viewer'],
}

export function scopeValuesFor(auditType:string):Record<string,string|string[]|number|boolean>{
  if(auditType==='Brand Consistency Audit')return {touchpoints:['Logo','Brand Guidelines','Colour System','Typography','Messaging','Website','Social Media'],markets:[],locations:[],businessUnits:[]}
  if(auditType==='Digital Presence Audit')return {channels:['Website','Google Business Profile','Google Search','LinkedIn','Instagram'],geographicMarket:'South Africa',competitorCount:3,keywordCount:25,targetAudience:''}
  if(auditType==='Operational Flow Audit')return {departments:[],roles:[],systems:[],inputs:[],outputs:[],controls:[],dependencies:[],locations:[],collectionRequirements:['Process Map','SOP','Interviews','Operational Data','System Screenshots','Observations','Policies','Controls']}
  if(auditType==='Customer Experience Audit')return {touchpoints:['Website','Email','Support'],journeyStages:[],customerSegments:[],channels:[],locations:[],scopeNotes:''}
  if(auditType==='People Audit')return {peoplePractices:['Recruitment','Onboarding','Performance'],departments:[],workforceGroups:[],locations:[],systems:[],scopeNotes:''}
  if(auditType==='Intelligence Audit')return {informationSources:['Operational Systems','Customer Data','Market Research'],decisionUseCases:[],systems:[],stakeholders:[],outputs:[],scopeNotes:''}
  if(auditType==='Custom Audit')return {scopeNotes:'',includedAreas:[]}
  return {crawlDepth:3,maximumPages:250,includeSubdomains:false,followExternalLinks:false,mobileAudit:true,desktopAudit:true,authenticationRequired:false,includedPaths:[],excludedPaths:[]}
}
