'use client'

import { ErrorState } from '@/components/ui/data-states'

export default function DashboardError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <ErrorState title="Unable to load TRACE" description="The page encountered an unexpected problem. Your saved audit data has not been changed." onRetry={reset}/>} 
