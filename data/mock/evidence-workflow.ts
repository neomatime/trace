export const evidenceOrganisations=[{id:'oak-pixel',name:'Oak & Pixel'},{id:'himark',name:'HIMARK'}]
export const evidenceAudits=[
 {id:'TRC-WEB-2026-0042',organisationId:'oak-pixel',name:'Oak & Pixel Website — Aug 2026',type:'Website Audit',typeId:'website'},
 {id:'TRC-BRN-2026-0021',organisationId:'oak-pixel',name:'Oak & Pixel Brand — Aug 2026',type:'Brand Consistency Audit',typeId:'brand'},
 {id:'TRC-DIG-2026-0018',organisationId:'oak-pixel',name:'Oak & Pixel Digital — Q3 2026',type:'Digital Presence Audit',typeId:'digital-presence'},
 {id:'TRC-OF-2026-0012',organisationId:'himark',name:'Purchase-to-Pay — Reassessment 01',type:'Operational Flow Audit',typeId:'operational-flow'},
]
export const evidenceAssessments=[{id:'baseline',name:'Baseline'},{id:'r01',name:'Reassessment 01'},{id:'r02',name:'Reassessment 02'}]
export const evidenceFindings=[{id:'f-lcp',auditId:'TRC-WEB-2026-0042',name:'Slow LCP (2.9s)'},{id:'f-logo',auditId:'TRC-BRN-2026-0021',name:'Inconsistent logo clear space'},{id:'f-search',auditId:'TRC-DIG-2026-0018',name:'Low branded search visibility'},{id:'f-approval',auditId:'TRC-OF-2026-0012',name:'Email approval creates delays'}]
export const evidenceRecommendations=[{id:'r-images',auditId:'TRC-WEB-2026-0042',name:'Optimise images and implement lazy loading'},{id:'r-brand',auditId:'TRC-BRN-2026-0021',name:'Create a governed brand asset library'},{id:'r-listings',auditId:'TRC-DIG-2026-0018',name:'Standardise priority digital listings'},{id:'r-workflow',auditId:'TRC-OF-2026-0012',name:'Automate approval routing'}]
export const evidenceWorkflowSteps=[{id:'s2',auditId:'TRC-OF-2026-0012',name:'Manager Approval'},{id:'s3',auditId:'TRC-OF-2026-0012',name:'Source Supplier'},{id:'s5',auditId:'TRC-OF-2026-0012',name:'Receive & Match Invoice'}]
export const availableIntegrations=['ATLAS','HIVE','UNISON']
