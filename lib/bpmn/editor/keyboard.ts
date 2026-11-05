import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type Keyboard from 'diagram-js/lib/features/keyboard/Keyboard.js'
import { isCmd, isKey } from 'diagram-js/lib/features/keyboard/KeyboardUtil.js'

/** Above diagram-js's default bindings (priority 500), so Ctrl/Cmd+0 means "fit". */
const PRIORITY = 1500

/**
 * TRACE shortcut tweaks on top of diagram-js's keyboard bindings, which
 * already give Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y redo,
 * Ctrl/Cmd +/- zoom and Delete/Backspace remove. Ctrl/Cmd+0 fits the whole
 * diagram instead of resetting to 100%.
 */
export default class TraceKeyboardBindings {
  static $inject = ['keyboard', 'canvas', 'elementRegistry']

  constructor(keyboard: Keyboard, canvas: Canvas, registry: ElementRegistry) {
    keyboard.addListener(PRIORITY, (context: { keyEvent: KeyboardEvent }) => {
      const event = context.keyEvent
      if (!isCmd(event) || !isKey(['0'], event)) return
      if (registry.getAll().length > 1) canvas.zoom('fit-viewport', 'auto' as never)
      return true
    })
  }
}
