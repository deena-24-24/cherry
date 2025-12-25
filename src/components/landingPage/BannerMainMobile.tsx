import { Accordion } from '../ui/Accordion/Accordion'
import React from 'react'
import * as styles from './BannerMainMobile.module.css'

const candidateItems = [
  {
    title: 'ИИ-собеседование',
    description: 'Оттачивайте навыки прохождения технического интервью с ИИ-ассистентом, ' +
      'а также изучайте интересующее Вас в чате с ИИ'
  },
  {
    title: 'Резюме',
    description: 'Расскажите о себе и своих навыках в резюме, которое увидят HR-специалисты из реальных компаний'
  },
  {
    title: 'Предложения о найме',
    description: 'Поддерживайте связь с HR-менеджерами, заинтересованными в вашей кандидатуре, прямо на платформе'
  }
]

const hrItems = [
  {
    title: 'Просмотр кандидатов',
    description: 'Поиск и фильтрация кандидатов по навыкам и уровню'
  },
  {
    title: 'Связь с кандидатами',
    description: 'Пишите подходящим кандидатам на нашей платформе'
  }
]

export const BannerMainMobile: React.FC = () => {
  return (
    <div className={styles['mobileBanner']}>
      <Accordion
        title='"Я готовлюсь к собеседованию"'
        items={candidateItems}
      />

      <Accordion
        title='"Я хочу найти новых сотрудников"'
        items={hrItems}
      />
    </div>
  )
}
