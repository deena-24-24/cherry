const mockDB = {
  users: [
    {
      _id: 'user_1',
      email: 'candidate@candidate.com',
      password: 'qwerty',
      role: 'candidate',
      firstName: 'Кандидат',
      lastName: 'Кандидатов',
      avatarUrl: 'https://i.pravatar.cc/150?u=user_1',
      companyName: ''
    },
    {
      _id: 'user_2',
      email: 'hr@hr.com',
      password: 'qwerty',
      role: 'hr',
      firstName: 'Отдел',
      lastName: 'Кадров',
      companyName: 'Компания',
      avatarUrl: 'https://i.pravatar.cc/150?img=1'
    },
    {
      _id: 'user_3',
      email: 'hr2@hr.com',
      password: 'qwerty',
      role: 'hr',
      firstName: 'Отдел2',
      lastName: 'Кадров2',
      companyName: 'Компания2',
      avatarUrl: 'https://i.pravatar.cc/150?img=2'
    }
  ],
  resumes: [  ],
  candidates: [
    { userId: 'user_1', firstName: 'Кандидат', lastName: 'Кандидатов'}
  ],
  hrs: [
    { userId: 'user_2', firstName: 'Отдел', lastName: 'Кадров', companyName: 'Компания'},
    { userId: 'user_3', firstName: 'Отдел2', lastName: 'Кадров2', companyName: 'Компания2'}
  ],
  hrConversations: [
    {
      id: 'chat_1',
      candidateId: 'user_1',
      hrId: 'user_2',
      lastMessage: 'Отлично, тогда договорились!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      messages: [
        { id: 'm1', senderId: 'user_2', text: 'Здравствуйте! Увидел ваше резюме, очень впечатлило. Вы сейчас в поиске?' },
        { id: 'm2', senderId: 'user_1', text: 'Добрый день! Да, рассматриваю предложения.' },
        { id: 'm3', senderId: 'user_2', text: 'Отлично, тогда договорились о созвоне!' },
      ]
    },
    {
      id: 'chat_2',
      candidateId: 'user_1',
      hrId: 'user_3',
      lastMessage: 'Жду ваше портфолио',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      messages: [
        { id: 'm4', senderId: 'user_3', text: 'Добрый день. У нас открыта позиция Senior Frontend Developer.' },
        { id: 'm5', senderId: 'user_1', text: 'Здравствуйте. Интересно, вышлю портфолио.' },
      ]
    }
  ],
  sessions: [
    {
      id: 'session_1',
      title: 'Frontend Developer Interview',
      position: 'frontend',
      difficulty: 'middle',
      status: 'active',
      candidateId: 'user_1',
      interviewerId: 'ai_interviewer',
      createdAt: new Date().toISOString(),
      notes: '',
      conversationHistory: []
    }
  ],
  codeExecutions: [],
  aiChats: [
    {
      id: 'msg_ai_1',
      userId: 'user_1', // Привязано к Кандидату (user_1)
      sender: 'user',
      text: 'Привет! Помоги мне подготовиться к собеседованию на позицию Frontend разработчика.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // Вчера
    },
    {
      id: 'msg_ai_2',
      userId: 'user_1',
      sender: 'ai',
      text: 'Здравствуйте! С удовольствием помогу. Уточните, пожалуйста, какой у вас уровень опыта (Junior, Middle, Senior) и есть ли конкретные технологии, которые вы хотели бы повторить (например, React, Vue, TypeScript)?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23.9).toISOString()
    },
    {
      id: 'msg_ai_3',
      userId: 'user_1',
      sender: 'user',
      text: 'Я претендую на Junior React Developer. Меня интересуют вопросы по хукам и жизненному циклу компонентов.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23.8).toISOString()
    },
    {
      id: 'msg_ai_4',
      userId: 'user_1',
      sender: 'ai',
      text: `Отличный выбор! Для позиции **Junior React Developer** тема хуков и жизненного цикла — самая популярная на собеседованиях.

      Вот краткая шпаргалка, которую нужно знать:

      ### 1. Основные хуки
      - **useState** — для управления локальным состоянием.
      - **useEffect** — для побочных эффектов (запросы к API, таймеры). Он заменяет старые методы классов.
      - **useContext** — для получения глобальных данных без прокидывания пропсов.
      
      ### 2. Жизненный цикл через useEffect
      Вместо \`componentDidMount\` и других методов мы используем массив зависимостей:
      
      1. **Монтирование (Mount):**
         \`useEffect(() => { ... }, [])\` — запускается 1 раз.
      2. **Обновление (Update):**
         \`useEffect(() => { ... }, [count])\` — запускается при изменении \`count\`.
      3. **Размонтирование (Unmount):**
         Возвращаем функцию очистки (\`cleanup function\`).
      
      ### Пример кода (частый вопрос):
      *"Как сделать очистку таймера при удалении компонента?"*
      
      \`\`\`javascript
      useEffect(() => {
        const timer = setInterval(() => {
          console.log('Tick');
        }, 1000);
      
        // Функция очистки (аналог componentWillUnmount)
        return () => clearInterval(timer);
      }, []);
      qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq
      \`\`\`
      
      Хотите, я задам вам **тестовый вопрос** по этой теме, чтобы проверить знания?`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23.7).toISOString()
    }
  ],
};

module.exports = {
  mockDB,
}