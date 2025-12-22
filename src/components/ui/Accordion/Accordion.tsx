import React, { useState } from 'react'
import * as styles from './Accordion.module.css'

interface AccordionItem {
  title: string
  description: string
}

export const Accordion: React.FC<{
  title: string
  items: AccordionItem[]
}> = ({ title, items }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles['accordion']}>
      <button
        className={styles['accordionHeader']}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className={styles['icon']}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className={styles['accordionBody']}>
          {items.map((item) => (
            <div key={item.title} className={styles['item']}>
              <div className={styles['itemTitle']}>{item.title}</div>
              <div className={styles['itemDescription']}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
