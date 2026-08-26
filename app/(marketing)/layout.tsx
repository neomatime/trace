import { PublicFooter } from '@/components/marketing/public-footer'
import { PublicHeader } from '@/components/marketing/public-header'

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-white"><PublicHeader /><main>{children}</main><PublicFooter /></div>
}
