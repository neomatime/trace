import { FinalCta, SectionHeading, marketingContainer } from '@/components/marketing/marketing-ui'
import { PricingView } from '@/components/marketing/pricing-view'

export default function PricingPage(){return <><section className={`${marketingContainer} py-16 lg:py-20`}><SectionHeading as="h1" eyebrow="Pricing" title={'Simple pricing.\nSerious audit capability.'} description="Choose the standard plan that fits your firm. Clear capability, sensible limits and room to grow."/><PricingView/></section><FinalCta title="Start your audit transformation today" description="Join consulting firms using TRACE to deliver consistent, high-quality audits that drive real improvement for their clients."/></>}
