import React, { useState } from 'react'
import { FaqItem } from '../ui/FaqItem/FaqItem'
import './FaqSection.css'
export const FaqSection: React.FC = () => {

  const faqData = [
    {
      q: 'В чём суть ИИ-собеседований? ',
      a: 'Наша AI-система проводит мок-собеседование, анализирует ответы пользователя и формирует отчет. ' +
        'Итоговая оценка после прохождения добавляется в профиль кандидата, а также видна HR-специалистам при просмотре резюме. '
    },
    {
      q: 'Можно ли пройти собеседование снова?',
      a: 'В бесплатной версии собеседование можно пройти только 5 раз, с подпиской - количество попыток не ограничено.'
    },
    {
      q: 'Что платформа может предложить компаниям?',
      a: 'При регистрации HR-специалисты могут просматривать резюме пользователей-кандидатов и связываться с ними в чате на нашем сайте напрямую.'
    },
    {
      q: 'Как сервис может помочь в трудоустройстве?',
      a: 'Для соискателей - это отличный инструмент тренировки софт- и хард-скиллов, а также возможность попасть на реальное собеседование. ' +
        'Для HR - место, где можно найти сотрудников, которые стремятся к совершенствованию навыков и не боятся применять новые технологии.'
    }
  ]

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="faqContainer">
      <div className='faqTitle'>Часто задаваемые вопросы</div>
    <div className="faqSection">
      {faqData.map((item, index) => (
        <FaqItem
          key={index}
          question={item.q}
          answer={item.a}
          isOpen={openFaqIndex === index}
          onToggle={() => handleFaqToggle(index)}
        />
      ))}
    </div>
    </div>
  )
}