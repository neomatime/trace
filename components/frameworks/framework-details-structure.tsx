'use client'

import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import type { FrameworkSection, FrameworkWorkflowState } from '@/types/framework'
import { ActionButtons, DragHandle, SelectField, StepHeading, TextAreaField, TextField } from './framework-workflow-shared'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'

export type UpdateFramework=(update:(current:FrameworkWorkflowState)=>FrameworkWorkflowState)=>void

export function FrameworkDetailsStep({state,update,errors}:{state:FrameworkWorkflowState;update:UpdateFramework;errors:Record<string,string>}) {
  const details=state.details
  const set=(key:keyof typeof details,value:string|string[])=>update(current=>({...current,details:{...current.details,[key]:value}}))
  return <div>
    <StepHeading step={1} title="Framework Details" description="Define the purpose and classification of this framework."/>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      <TextField label="Framework Name" required value={details.name} onChange={v=>set('name',v)} placeholder="HIMARK Web Audit Framework" error={errors.name}/>
      <TextField label="Framework Code" required value={details.code} onChange={v=>set('code',v.toUpperCase())} placeholder="FWK-WEB-001" error={errors.code}/>
      <SelectField label="Audit Type" required value={details.auditType} onChange={v=>set('auditType',v)} options={[...AUDIT_TYPE_NAMES,'Custom Audit']}/>
      <SelectField label="Framework Owner" required value={details.owner} onChange={v=>set('owner',v)} options={['Alex Reed','Thelma Dube','Jordan Naidoo']}/>
      <TextAreaField label="Description" required value={details.description} onChange={v=>set('description',v)} placeholder="Comprehensive framework for assessing website performance, accessibility, SEO, content quality and user experience."/>
      {errors.description&&<p className="-mt-3 text-[10px] text-destructive sm:col-span-2">{errors.description}</p>}
      <SelectField label="Organisation" required value={details.organisation} onChange={v=>set('organisation',v)} options={['Oak & Pixel','HIMARK','Northwind Co']}/>
      <SelectField label="Framework Visibility" required value={details.visibility} onChange={v=>set('visibility',v)} options={['Private','Organisation','Shared']}/>
      <TextField label="Version" value={details.version} onChange={v=>set('version',v)} placeholder="v1.0"/>
      <label className="text-xs font-semibold sm:col-span-2">Tags <span className="font-normal text-muted-foreground">(Optional)</span><div className="mt-2 rounded-md border border-border p-2"><div className="flex flex-wrap gap-1">{details.tags.map(tag=><button key={tag} onClick={()=>set('tags',details.tags.filter(x=>x!==tag))} className="rounded-full bg-brand-muted px-2.5 py-1 text-[9px] font-semibold text-brand">{tag} ×</button>)}</div><input aria-label="Framework tags" placeholder="Type a tag and press Enter" className="mt-1 h-7 w-full px-1 text-[10px] font-normal outline-none" onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value.trim()){e.preventDefault();set('tags',[...details.tags,e.currentTarget.value.trim()]);e.currentTarget.value=''}}}/></div></label>
    </div>
  </div>
}

const blankSection:FrameworkSection={id:'',code:'',name:'',description:'',weight:0,guidance:'',checks:[]}

export function FrameworkStructureStep({state,update}:{state:FrameworkWorkflowState;update:UpdateFramework}) {
  const [editor,setEditor]=useState<FrameworkSection|null>(null)
  const [dragged,setDragged]=useState<string|null>(null)
  const total=state.sections.reduce((sum,item)=>sum+item.weight,0)
  const save=(section:FrameworkSection)=>{update(current=>{const exists=current.sections.some(x=>x.id===section.id);return {...current,sections:exists?current.sections.map(x=>x.id===section.id?section:x):[...current.sections,{...section,id:`section-${Date.now()}`} ]}});setEditor(null)}
  const duplicate=(section:FrameworkSection)=>update(current=>({...current,sections:[...current.sections,{...section,id:`${section.id}-copy-${Date.now()}`,name:`${section.name} Copy`,checks:section.checks.map(x=>({...x,id:`${x.id}-copy-${Date.now()}`}))}]}))
  const remove=(id:string)=>update(current=>({...current,sections:current.sections.filter(x=>x.id!==id)}))
  const drop=(targetId:string)=>{if(!dragged||dragged===targetId)return;update(current=>{const list=[...current.sections];const from=list.findIndex(x=>x.id===dragged);const to=list.findIndex(x=>x.id===targetId);const [item]=list.splice(from,1);list.splice(to,0,item);return {...current,sections:list}});setDragged(null)}
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><StepHeading step={2} title="Framework Structure" description="Organise the framework into the sections that will be assessed."/><button onClick={()=>setEditor({...blankSection})} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5"/> Add Section</button></div>
    <div className="mt-6 space-y-2">{state.sections.map((section,index)=><Card draggable onDragStart={()=>setDragged(section.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(section.id)} key={section.id} className="flex items-center gap-3 p-4 transition hover:border-foreground/20"><DragHandle/><span className="text-xs font-semibold text-brand">{String(index+1).padStart(2,'0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-semibold">{section.name}</h3><span className="rounded bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">{section.code}</span></div><p className="mt-1 truncate text-[10px] text-muted-foreground">{section.description}</p></div><div className="hidden gap-6 text-right text-[10px] sm:flex"><span><b className="block text-xs text-foreground">{section.checks.length}</b>Checks</span><span><b className="block text-xs text-foreground">{section.weight}%</b>Weight</span></div><ActionButtons onEdit={()=>setEditor({...section})} onDuplicate={()=>duplicate(section)} onDelete={()=>remove(section.id)}/></Card>)}</div>
    <div className={`mt-5 flex items-center justify-between rounded-lg border p-4 ${total===100?'border-success/25 bg-success-muted/30':'border-warning/30 bg-warning-muted'}`}><div className="flex items-center gap-2">{total!==100&&<AlertTriangle className="size-4 text-warning"/>}<span className="text-xs font-semibold">Total Framework Weight</span></div><strong className={total===100?'text-success':'text-warning'}>{total}%</strong></div>
    {editor&&<SectionEditor key={editor.id||'new'} section={editor} onClose={()=>setEditor(null)} onSave={save}/>} 
  </div>
}

function SectionEditor({section,onClose,onSave}:{section:FrameworkSection;onClose:()=>void;onSave:(section:FrameworkSection)=>void}) {
  const [draft,setDraft]=useState(section)
  const set=(key:keyof FrameworkSection,value:string|number)=>setDraft(current=>({...current,[key]:value}))
  return <Dialog open title={section.id?'Edit Section':'Add Section'} description="Define a high-level assessment area." onClose={onClose} className="max-w-2xl"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Section Name" required value={draft.name} onChange={v=>set('name',v)}/><TextField label="Section Code" value={draft.code} onChange={v=>set('code',v.toUpperCase())}/><TextAreaField label="Description" value={draft.description} onChange={v=>set('description',v)}/><TextField label="Section Weight" type="number" value={draft.weight} onChange={v=>set('weight',Number(v))}/><TextAreaField label="Instructions / Guidance" value={draft.guidance} onChange={v=>set('guidance',v)}/></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-border px-4 py-2.5 text-xs font-semibold">Cancel</button><button disabled={!draft.name} onClick={()=>onSave(draft)} className="rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40">Save Section</button></div></Dialog>
}
