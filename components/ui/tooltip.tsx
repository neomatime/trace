'use client'

import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type TriggerProps = {
  ref?: React.Ref<Element>
  onMouseEnter?: React.MouseEventHandler<Element>
  onMouseLeave?: React.MouseEventHandler<Element>
  onFocus?: React.FocusEventHandler<Element>
  onBlur?: React.FocusEventHandler<Element>
  onClick?: React.MouseEventHandler<Element>
  'aria-describedby'?: string
}

export function Tooltip({ content, children, delay = 320, className }: { content: React.ReactNode; children: React.ReactElement; delay?: number; className?: string }) {
  const id = useId()
  const triggerRef = useRef<Element | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const [open,setOpen]=useState(false)
  const [position,setPosition]=useState({top:0,left:0})
  const original=children.props as TriggerProps

  useEffect(()=>()=>{if(timerRef.current)window.clearTimeout(timerRef.current)},[])
  const show=(immediate=false)=>{if(timerRef.current)window.clearTimeout(timerRef.current);if(immediate)setOpen(true);else timerRef.current=window.setTimeout(()=>setOpen(true),delay)}
  const hide=()=>{if(timerRef.current)window.clearTimeout(timerRef.current);setOpen(false)}
  const place=()=>{
    const trigger=triggerRef.current
    if(!trigger)return
    const rect=trigger.getBoundingClientRect();const tooltip=tooltipRef.current
    const width=tooltip?.offsetWidth??220;const height=tooltip?.offsetHeight??40;const gap=8
    const above=rect.top>=height+gap+8
    setPosition({top:above?rect.top-height-gap:rect.bottom+gap,left:Math.max(8,Math.min(rect.left+rect.width/2-width/2,window.innerWidth-width-8))})
  }
  useLayoutEffect(()=>{if(!open)return;place();const update=()=>place();window.addEventListener('resize',update);window.addEventListener('scroll',update,true);return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true)}},[open])

  // The composed trigger ref is assigned by React after render; it is never read while rendering.
  // eslint-disable-next-line react-hooks/refs
  const trigger=cloneElement(children as React.ReactElement<TriggerProps>,{
    ref:(node:Element|null)=>{triggerRef.current=node},
    'aria-describedby':open?id:original['aria-describedby'],
    onMouseEnter:(event:React.MouseEvent<Element>)=>{original.onMouseEnter?.(event);show()},
    onMouseLeave:(event:React.MouseEvent<Element>)=>{original.onMouseLeave?.(event);hide()},
    onFocus:(event:React.FocusEvent<Element>)=>{original.onFocus?.(event);show(true)},
    onBlur:(event:React.FocusEvent<Element>)=>{original.onBlur?.(event);hide()},
    onClick:(event:React.MouseEvent<Element>)=>{original.onClick?.(event);if(window.matchMedia('(hover: none)').matches)setOpen(value=>!value)},
  })

  return <>{trigger}{typeof document!=='undefined'&&open&&createPortal(<div ref={tooltipRef} id={id} role="tooltip" style={position} className={cn('pointer-events-none fixed z-[200] max-w-64 rounded-md bg-slate-950 px-2.5 py-1.5 text-[10px] font-medium leading-4 text-white shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95',className)}>{content}</div>,document.body)}</>
}

export function InfoTooltip({ content, label='More information' }: { content: React.ReactNode; label?: string }) {
  return <Tooltip content={content}><button type="button" aria-label={label} className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Info className="size-3"/></button></Tooltip>
}
