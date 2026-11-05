/**
 * A stable small number per object, used to key React subtrees by the identity
 * of an editor instance (element ids repeat across the As-Is and To-Be editors,
 * so an id alone must never decide whether a panel keeps its local drafts).
 */
const keys = new WeakMap<object, number>()
let next = 0

export function identityKey(subject: object): number {
  let key = keys.get(subject)
  if (key === undefined) {
    next += 1
    key = next
    keys.set(subject, key)
  }
  return key
}
