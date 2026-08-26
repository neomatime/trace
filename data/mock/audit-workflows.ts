import type { AuditTypeName } from '@/types/audit-type'

export type CollectionStatus = 'Complete' | 'In Progress' | 'Not Started' | 'Needs Review'
export interface CollectionAreaMock { area:string; status:CollectionStatus; progress:number; items:string; issues:number; source:string; reviewer:string; updated:string }
export interface WorkflowStepMock { id:string; name:string; owner:string; department:string; system:string; input:string; output:string; type:'Task'|'Approval'|'Decision'|'System'; duration:string; waiting:string; approval:boolean; control?:string; painPoint?:string; evidence:number }

export const auditTemplates: Record<string,string[]> = {
  website:['Website Audit v1.0'],
  brand:['Brand Consistency Audit v1.0'],
  'digital-presence':['Digital Presence Audit v1.0','IT Security Audit v1.0'],
  'operational-flow':['Operational Flow Audit v1.0','Supplier Management Audit v1.0'],
  'customer-experience':[],
  people:[],
  intelligence:[],
}

export const frameworkDetails = [
  {id:'fwk-web-001',name:'HIMARK Web Audit Framework',auditType:'Website Audit',description:'Technical, content, accessibility and experience evaluation.',version:'v1.3',criteria:84,updated:'20 Aug 2026',status:'Active'},
  {id:'fwk-brn-001',name:'HIMARK Brand Consistency Framework',auditType:'Brand Consistency Audit',description:'Brand identity and consistency across managed touchpoints.',version:'v1.1',criteria:62,updated:'18 Aug 2026',status:'Active'},
  {id:'fwk-dig-001',name:'HIMARK Digital Presence Framework',auditType:'Digital Presence Audit',description:'Visibility, channel quality, consistency and reputation.',version:'v1.2',criteria:76,updated:'12 Aug 2026',status:'Active'},
  {id:'fwk-sec-001',name:'Digital Security Posture Extension',auditType:'Digital Presence Audit',description:'Optional security and trust-signal extension.',version:'v1.2',criteria:28,updated:'05 Aug 2026',status:'Active'},
  {id:'fwk-of-001',name:'HIMARK Operational Flow Framework',auditType:'Operational Flow Audit',description:'Process discovery, control, hand-off and efficiency analysis.',version:'v1.3',criteria:71,updated:'22 Aug 2026',status:'Active'},
  {id:'fwk-gov-001',name:'Governance & Compliance Extension',auditType:'Operational Flow Audit',description:'Optional policy, governance and compliance criteria.',version:'v1.0',criteria:34,updated:'11 Aug 2026',status:'Draft'},
  {id:'fwk-hr-001',name:'HR Operations Framework',auditType:'Operational Flow Audit',description:'People-process lifecycle evaluation.',version:'v1.0',criteria:54,updated:'30 Jul 2026',status:'Active'},
  {id:'fwk-fin-001',name:'Finance Operations Framework',auditType:'Operational Flow Audit',description:'P2P, O2C and R2R process review.',version:'v1.0',criteria:68,updated:'15 Jul 2026',status:'Active'},
] as const

export const auditTeam = [
  {id:'u1',name:'Alex Reed',initials:'AR',role:'Admin',email:'alex@oakandpixel.co.za'},
  {id:'u2',name:'Thelma Dube',initials:'TD',role:'Audit Lead',email:'thelma@oakandpixel.co.za'},
  {id:'u3',name:'Maya Khan',initials:'MK',role:'Reviewer',email:'maya@oakandpixel.co.za'},
  {id:'u4',name:'Daniel Mokoena',initials:'DM',role:'Auditor',email:'daniel@oakandpixel.co.za'},
  {id:'u5',name:'Naledi Jacobs',initials:'NJ',role:'Viewer',email:'naledi@oakandpixel.co.za'},
] as const

const sources:Record<string,string[]>={website:['Website Crawl','PageSpeed Insights','Google Lighthouse','Mobile Friendly Test','Security Headers','Manual Review'],brand:['Manual Review','Brand Guidelines','Asset Library','Stakeholder Interview'],digital:['Profile Review','Search Results','Channel Export','Manual Review'],workflow:['Questionnaire','Interview','Process Document','Operational Data','Observation']}
export function createCollectionAreas(typeId:string, areas:readonly string[]):CollectionAreaMock[]{ const sourceKey=typeId==='operational-flow'?'workflow':typeId==='digital-presence'?'digital':typeId; return areas.map((area,index)=>({area,status:index<3?'Complete':index<6?'In Progress':index===6?'Needs Review':'Not Started',progress:index<3?100:index<6?60-index*4:index===6?35:0,items:`${index+2} of ${index+4}`,issues:index%4,source:sources[sourceKey]?.[index%sources[sourceKey].length]??'Manual Review',reviewer:index%2?'Thelma Dube':'Alex Reed',updated:index<7?'20 Aug 2026':'—'})) }

export const workflowSteps:WorkflowStepMock[]=[
  {id:'s1',name:'Submit Purchase Request',owner:'Requestor',department:'Business Unit',system:'SAP',input:'Approved need',output:'Purchase request',type:'Task',duration:'12 min',waiting:'0 min',approval:false,evidence:2},
  {id:'s2',name:'Manager Approval',owner:'Line Manager',department:'Business Unit',system:'Email',input:'Purchase request',output:'Approval decision',type:'Approval',duration:'8 min',waiting:'1.4 days',approval:true,control:'Approval threshold',painPoint:'Email approval causes delays',evidence:3},
  {id:'s3',name:'Source Supplier',owner:'Buyer',department:'Procurement',system:'SAP + Email',input:'Approved request',output:'Supplier selection',type:'Task',duration:'3.2 hrs',waiting:'2.1 days',approval:false,painPoint:'Manual quote comparison',evidence:4},
  {id:'s4',name:'Create Purchase Order',owner:'Buyer',department:'Procurement',system:'SAP',input:'Selected supplier',output:'Purchase order',type:'System',duration:'18 min',waiting:'4 hrs',approval:true,control:'Segregation of duties',evidence:2},
  {id:'s5',name:'Receive & Match Invoice',owner:'AP Clerk',department:'Finance',system:'SAP',input:'Invoice + goods receipt',output:'Matched invoice',type:'Decision',duration:'24 min',waiting:'1.8 days',approval:false,painPoint:'High exception rate',evidence:5},
  {id:'s6',name:'Release Supplier Payment',owner:'Finance Manager',department:'Finance',system:'SAP',input:'Matched invoice',output:'Supplier payment',type:'Approval',duration:'10 min',waiting:'1 day',approval:true,control:'Payment batch approval',evidence:3},
]

export const auditWorkspaceMeta:Record<string,{name:string;type:AuditTypeName;scope:string;status:string}>={
  'TRC-WEB-2026-0042':{name:'Oak & Pixel Website — Aug 2026',type:'Website Audit',scope:'oakandpixel.co.za',status:'Completed'},
  'TRC-BRN-2026-0021':{name:'Oak & Pixel Brand — Aug 2026',type:'Brand Consistency Audit',scope:'Oak & Pixel',status:'Completed'},
  'TRC-DIG-2026-0018':{name:'Oak & Pixel Digital — Q3 2026',type:'Digital Presence Audit',scope:'Oak & Pixel',status:'Completed'},
  'TRC-OF-2026-0012':{name:'Purchase-to-Pay — Reassessment 01',type:'Operational Flow Audit',scope:'HIMARK Procurement',status:'In Progress'},
  'TRC-CX-2026-0001':{name:'Customer Experience — Aug 2026',type:'Customer Experience Audit',scope:'Customer onboarding',status:'Draft'},
  'TRC-PPL-2026-0001':{name:'People Effectiveness — Aug 2026',type:'People Audit',scope:'Corporate workforce',status:'Draft'},
  'TRC-INT-2026-0001':{name:'Commercial Intelligence — Aug 2026',type:'Intelligence Audit',scope:'Customer and market decisions',status:'Draft'},
}
