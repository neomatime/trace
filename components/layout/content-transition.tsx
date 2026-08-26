'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'

export function ContentTransition({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
