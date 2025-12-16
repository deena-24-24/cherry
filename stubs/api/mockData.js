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
      phone: '+7-999-000-00-00',
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
  resumes: [
    {
      id: 'resume_1',
      userId: 'user_1',
      title: 'Frontend Developer',
      position: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'Redux'],
      experience: [
        { title: 'Frontend Dev', company: 'Web Studio', period: '2020 - 2023', description: 'React development' }
      ],
      education: [],
      about: 'Experienced frontend dev',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'resume_2',
      userId: 'user_1',
      title: 'Fullstack Developer',
      position: 'Fullstack Developer',
      skills: ['Node.js', 'React', 'MongoDB'],
      experience: [
        { title: 'Fullstack Dev', company: 'Freelance', period: '2018 - 2020', description: 'Full cycle dev' }
      ],
      education: [],
      about: 'Love backend too',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  candidates: [],
  hrs: [
    { userId: 'user_2', firstName: 'Анна', lastName: 'Петрова', companyName: 'Tech Corp' }
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
  ],
  sessions: [
    {
      id: 'session_1',
      title: 'Frontend Interview #1',
      position: 'Frontend Developer',
      difficulty: 'middle',
      status: 'completed',
      candidateId: 'user_1',
      interviewerId: 'ai_interviewer',
      createdAt: new Date(Date.now() - 10000000).toISOString(),
      completedAt: new Date().toISOString(),
      finalReport: {
        overall_assessment: {
          final_score: 7.5
        }
      }
    },
    {
      id: 'session_2',
      title: 'Frontend Interview #2',
      position: 'Frontend Developer',
      difficulty: 'senior',
      status: 'completed',
      candidateId: 'user_1',
      interviewerId: 'ai_interviewer',
      createdAt: new Date(Date.now() - 5000000).toISOString(),
      completedAt: new Date().toISOString(),
      finalReport: {
        overall_assessment: {
          final_score: 8.2
        }
      }
    },
    {
      id: 'session_3',
      title: 'Fullstack Interview',
      position: 'Fullstack Developer',
      difficulty: 'middle',
      status: 'completed',
      candidateId: 'user_1',
      interviewerId: 'ai_interviewer',
      createdAt: new Date(Date.now() - 2000000).toISOString(),
      completedAt: new Date().toISOString(),
      finalReport: {
        overall_assessment: {
          final_score: 6.8
        }
      }
    }
  ],
  codeExecutions: [],
  aiChats: []
};

module.exports = {
  mockDB,
}