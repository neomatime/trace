import { AUDIT_TYPE_NAMES } from '@/config/audit-types'

export const PUBLIC_NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Reports', href: '/reports' },
  { label: 'FAQ', href: '/faq' },
] as const

export const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 'R3,990', audience: 'For small consulting teams.', clients: 'Up to 3 active client organisations', shortClients: 'Up to 3 clients', popular: false,
    benefits: ['Core audit workflows', 'Evidence management', 'Frameworks & templates', 'History & exports', 'Standard support'],
  },
  {
    id: 'professional', name: 'Professional', price: 'R11,990', audience: 'For growing boutique firms.', clients: 'Up to 10 active client organisations', shortClients: 'Up to 10 clients', popular: true,
    benefits: ['Everything in Starter', 'More users', 'More audits', 'More storage', 'Reassessments & reporting', 'Priority email support'],
  },
  {
    id: 'business', name: 'Business', price: 'R24,990', audience: 'For established consulting firms.', clients: 'Up to 25 active client organisations', shortClients: 'Up to 25 clients', popular: false,
    benefits: ['Everything in Professional', 'Highest standard limits', 'More scale', 'Advanced reporting', 'Priority support'],
  },
] as const

export const AUDIT_TYPE_LABELS = AUDIT_TYPE_NAMES

export type FaqCategory = 'Getting Started' | 'Plans & Pricing' | 'Features' | 'Audits' | 'Reports' | 'Data & Security' | 'Account & Billing'

export const FAQ_ITEMS: readonly { category: FaqCategory; question: string; answer: string }[] = [
  { category: 'Getting Started', question: 'What is TRACE?', answer: 'TRACE is an audit management system built for consulting firms. It brings structured audits, evidence, findings, recommendations, actions and reassessments into one consistent workspace.' },
  { category: 'Getting Started', question: 'Who is TRACE for?', answer: 'TRACE is designed for consulting firms, internal audit teams and assessment professionals who need a repeatable way to deliver and measure high-quality audits.' },
  { category: 'Plans & Pricing', question: 'How many client organisations can I manage?', answer: 'Starter supports up to 3 active client organisations, Professional up to 10, and Business up to 25. These limits apply to each customer plan.' },
  { category: 'Audits', question: 'What types of audits can I run in TRACE?', answer: `TRACE supports ${AUDIT_TYPE_NAMES.join(', ')}.` },
  { category: 'Features', question: 'Can I create my own frameworks and templates?', answer: 'Yes. TRACE is designed to let your firm standardise proven methodologies with reusable frameworks and templates.' },
  { category: 'Features', question: 'How does the reassessment feature work?', answer: 'A reassessment compares a new result with its baseline, making score movement, resolved issues and remaining priorities clear over time.' },
  { category: 'Reports', question: 'What reports can I generate?', answer: 'TRACE report experiences cover executive summaries, scores, trends, findings, recommendations, evidence and comparison views.' },
  { category: 'Reports', question: 'Can I export reports?', answer: 'Export experiences are designed for PDF, PowerPoint and Excel. Availability can vary by plan and workspace configuration.' },
  { category: 'Data & Security', question: 'Is TRACE cloud-based?', answer: 'TRACE is designed as a modern web application so authorised teams can work from a central, controlled workspace.' },
  { category: 'Data & Security', question: 'How secure is my data?', answer: 'TRACE is designed around authenticated access, role-based permissions and attributable activity. Final hosting and security controls depend on the production deployment.' },
  { category: 'Account & Billing', question: 'Can I invite team members?', answer: 'Team and user management is part of the TRACE product experience, with roles for administrators, audit leads, auditors, reviewers and viewers.' },
  { category: 'Features', question: 'Does TRACE integrate with other tools?', answer: 'Integration surfaces are part of the product roadmap. The current public experience does not promise a specific third-party integration.' },
  { category: 'Plans & Pricing', question: 'Can I change or cancel my plan later?', answer: 'Plan management is intended to be flexible. Commercial terms will be confirmed before billing is activated.' },
  { category: 'Plans & Pricing', question: 'What happens if I exceed my limits?', answer: 'Your team can move to the next standard plan when it needs more active client organisations or higher operating limits.' },
  { category: 'Plans & Pricing', question: 'Is there a long-term contract?', answer: 'Monthly and annual options are presented for planning purposes. Final commercial terms will be confirmed before billing is activated.' },
  { category: 'Account & Billing', question: 'Do you offer refunds?', answer: 'Refund and cancellation terms will be included in the final commercial terms before paid subscriptions are enabled.' },
  { category: 'Getting Started', question: 'How do I get started?', answer: 'Choose a plan, create your account and configure your first organisation. This preview demonstrates the intended journey without creating a real account.' },
  { category: 'Getting Started', question: 'Can I get a demo?', answer: 'Yes. Use the contact option to request a guided walkthrough of the TRACE product experience.' },
]

export const FOOTER_GROUPS = [
  { title: 'Product', links: PUBLIC_NAV.filter((item) => item.label !== 'FAQ') },
  { title: 'Resources', links: [{ label: 'Templates', href: '/templates' }, { label: 'Help Center', href: '/faq' }, { label: 'FAQ', href: '/faq' }, { label: 'Blog', href: '/#insights' }] },
  { title: 'Company', links: [{ label: 'About TRACE', href: '/#about' }, { label: 'Contact', href: 'mailto:hello@trace.co.za' }, { label: 'Privacy Policy', href: '/faq' }, { label: 'Terms of Service', href: '/faq' }] },
] as const
