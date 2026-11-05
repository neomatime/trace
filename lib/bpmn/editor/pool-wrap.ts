import type { ModdleElement } from 'bpmn-moddle'

/**
 * Semantic half of "wrap the diagram in a pool": a process-only diagram
 * (plane drawn for a `bpmn:Process`) becomes a collaboration diagram. The
 * participant itself is added by the canvas and written by the semantic sync.
 * Pure (moddle objects only), so it runs under node; the editor's
 * `trace.root.swap` command calls these from execute / revert.
 */

function planeOf(definitions: ModdleElement): ModdleElement {
  const plane = ((definitions.diagrams ?? []) as ModdleElement[])[0]?.plane
  if (!plane) throw new Error('The BPMN definitions have no diagram plane')
  return plane
}

/** Draw the plane for `collaboration` and list it first among the root elements. */
export function applyRootSwap(definitions: ModdleElement, collaboration: ModdleElement): void {
  const others = ((definitions.rootElements ?? []) as ModdleElement[]).filter((e) => e !== collaboration)
  definitions.rootElements = [collaboration, ...others]
  collaboration.$parent = definitions
  planeOf(definitions).bpmnElement = collaboration
}

/** Undo `applyRootSwap`: the plane shows `process` again and the collaboration is gone. */
export function revertRootSwap(definitions: ModdleElement, collaboration: ModdleElement, process: ModdleElement): void {
  definitions.rootElements = ((definitions.rootElements ?? []) as ModdleElement[]).filter((e) => e !== collaboration)
  planeOf(definitions).bpmnElement = process
}
