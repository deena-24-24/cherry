import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as styles from './PositionSelectPopup.module.css'

export type InterviewPosition = 'frontend' | 'backend' | 'fullstack'

interface PositionSelectPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (position: InterviewPosition) => void
}

const positions: Array<{ value: InterviewPosition; label: string; icon: string; description: string }> = [
  {
    value: 'frontend',
    label: 'Frontend',
    icon: '🎨',
    description: 'React, Vue, Angular, JavaScript/TypeScript'
  },
  {
    value: 'backend',
    label: 'Backend',
    icon: '⚙️',
    description: 'API, базы данных, микросервисы'
  },
  {
    value: 'fullstack',
    label: 'Fullstack',
    icon: '🚀',
    description: 'Полный стек разработки'
  }
]

export const PositionSelectPopup: React.FC<PositionSelectPopupProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null

  const handleSelect = (position: InterviewPosition) => {
    onSelect(position)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles['position-popup-overlay']}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles['position-popup']}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <button
            className={styles['position-popup-close']}
            onClick={onClose}
          >
            &times;
          </button>

          <div className={styles['position-popup-header']}>
            <h2>Выберите направление собеседования</h2>
            <p>Выберите специализацию, по которой хотите пройти интервью</p>
          </div>

          <div className={styles['position-options']}>
            {positions.map((position) => (
              <button
                key={position.value}
                className={styles['position-option']}
                onClick={() => handleSelect(position.value)}
              >
                <div className={styles['position-icon']}>{position.icon}</div>
                <div className={styles['position-content']}>
                  <h3>{position.label}</h3>
                  <p>{position.description}</p>
                </div>
                <div className={styles['position-arrow']}>→</div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

