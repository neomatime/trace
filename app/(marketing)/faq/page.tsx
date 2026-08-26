import { FaqExplorer } from '@/components/marketing/faq-explorer'
import { FinalCta, SectionHeading, marketingContainer } from '@/components/marketing/marketing-ui'

export default function FaqPage(){return <><section className={`${marketingContainer} py-16 lg:py-20`}><SectionHeading as="h1" eyebrow="FAQ" title={'Frequently asked questions.\nClear answers.'} description="Everything you need to know about TRACE, our pricing, features and how it works."/><FaqExplorer/></section><FinalCta title="Ready to streamline your audit process?" description="Join consulting firms using TRACE to deliver consistent, high-quality audits that drive real improvement."/></>}
