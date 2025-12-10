const mockDB = {
  users: [
    {
      _id: 'user_1',
      email: 'candidate@candidate.com',
      password: 'qwerty',
      role: 'candidate',
      firstName: 'Кандидат',
      lastName: 'Кандидатов',
      avatarUrl: 'https://i.pravatar.cc/150?u=user_1'
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
  candidates: [],
  hrs: [],
  hrConversations: [
    {
      id: 'hr-chat-1',
      candidateId: 'user_1',
      hrId: 'user_2',
      lastMessage: 'Отлично, тогда договорились!',
      timestamp: '10:45',
      messages: [
        { id: 'msg1', sender: 'hr', text: 'Здравствуйте! Увидел ваше резюме, очень впечатлило. Вы сейчас в поиске?' },
        { id: 'msg2', sender: 'user', text: 'Добрый день! Да, рассматриваю предложения.' },
        { id: 'msg3', sender: 'hr', text: 'Отлично, тогда договорились!' },
      ]
    },
    {
      id: 'hr-chat-2',
      candidateId: 'user_1',
      hrId: 'user_3',
      lastMessage: 'Да, конечно, сейчас отправлю.',
      timestamp: 'Вчера',
      messages: [
        { id: 'msg4', sender: 'hr', text: 'Добрый день. У нас открыта позиция Senior Frontend Developer. Могли бы выслать портфолио?' },
        { id: 'msg5', sender: 'user', text: 'Да, конечно, сейчас отправлю.' },
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
  codeExecutions: []
};

module.exports = {
  mockDB,
}