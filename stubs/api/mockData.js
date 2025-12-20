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
          final_score: 7.5,
          level: "Middle",
          recommendation: "hire",
          strengths: [
            "Отличное знание React и хуков",
            "Опыт работы с TypeScript",
            "Хорошее понимание компонентного подхода"
          ],
          improvements: [
            "Нужно углубить знания в Redux Toolkit",
            "Улучшить навыки тестирования компонентов",
            "Работа над оптимизацией производительности"
          ]
        },
        technical_skills: {
          topics_covered: ["React", "TypeScript", "JavaScript", "CSS", "HTML5", "Webpack"],
          strong_areas: ["React Hooks", "Component Architecture", "TypeScript типизация"],
          weak_areas: ["Redux", "Unit Testing", "Performance Optimization"]
        },
        behavioral_analysis: {
          communication_skills: {
            score: 8,
            feedback: "Хорошо структурирует мысли, но иногда говорит слишком быстро"
          },
          problem_solving: {
            score: 7,
            feedback: "Логически мыслит, но можно улучшить подход к сложным задачам"
          }
        },
        interview_analytics: {
          total_questions: 15,
          topics_covered_count: 6,
          average_response_quality: 7.5,
          total_duration: "45 минут"
        },
        detailed_feedback: "Кандидат демонстрирует хорошие знания в области фронтенд-разработки. Особенно силен в React и TypeScript. Показывает понимание современных подходов к разработке. Рекомендуется обратить внимание на управление состоянием приложений (Redux) и тестирование компонентов. В целом подходит на позицию Middle Frontend Developer.",
        next_steps: [
          "Пройти техническое собеседование с тимлидом",
          "Выполнить тестовое задание по React",
          "Встреча с командой разработки"
        ]
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
          final_score: 8.2,
          level: "Senior",
          recommendation: "strong_hire",
          strengths: [
            "Глубокое понимание React 18 и новых фич",
            "Опыт оптимизации производительности крупных приложений",
            "Знание архитектурных паттернов"
          ],
          improvements: [
            "Расширить знания в Server Components",
            "Углубиться в WebAssembly для фронтенда",
            "Менторство для junior-разработчиков"
          ]
        },
        technical_skills: {
          topics_covered: [
            "React 18",
            "Next.js",
            "TypeScript Advanced",
            "Performance Optimization",
            "Web Vitals",
            "Micro-frontends"
          ],
          strong_areas: [
            "React Performance",
            "Architecture Design",
            "Code Splitting",
            "State Management"
          ],
          weak_areas: [
            "WebAssembly",
            "GraphQL Client-side",
            "PWA Advanced Features"
          ]
        },
        behavioral_analysis: {
          communication_skills: {
            score: 9,
            feedback: "Отличные коммуникативные навыки, умеет объяснять сложные концепции простыми словами"
          },
          problem_solving: {
            score: 8,
            feedback: "Системный подход к решению проблем, учитывает долгосрочные последствия решений"
          }
        },
        interview_analytics: {
          total_questions: 20,
          topics_covered_count: 8,
          average_response_quality: 8.2,
          total_duration: "60 минут"
        },
        detailed_feedback: "Кандидат демонстрирует уровень Senior Frontend Developer. Имеет глубокие знания современных технологий, понимает принципы оптимизации производительности и архитектуры крупных приложений. Показал опыт работы с сложными проектами и командами. Отлично справился с системными вопросами. Рекомендуется на позицию Senior Frontend Developer.",
        next_steps: [
          "Собеседование с архитектором",
          "Обсуждение ожиданий по зарплате",
          "Встреча с CTO",
          "Оформление оффера"
        ]
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
          final_score: 6.8,
          level: "Middle",
          recommendation: "maybe_hire",
          strengths: [
            "Сбалансированные знания frontend и backend",
            "Опыт работы с полным циклом разработки",
            "Понимание принципов REST API"
          ],
          improvements: [
            "Углубить знания в базах данных",
            "Изучить Docker и CI/CD",
            "Улучшить знания в системном дизайне"
          ]
        },
        technical_skills: {
          topics_covered: [
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "REST API",
            "Authentication",
            "Basic DevOps"
          ],
          strong_areas: [
            "API Development",
            "Frontend-Backend Integration",
            "Full Cycle Development"
          ],
          weak_areas: [
            "Database Optimization",
            "Docker & Containers",
            "System Architecture",
            "Testing (Backend)"
          ]
        },
        behavioral_analysis: {
          communication_skills: {
            score: 7,
            feedback: "Хорошо объясняет технические решения, но иногда теряется в деталях"
          },
          problem_solving: {
            score: 6,
            feedback: "Решает проблемы последовательно, но не всегда учитывает масштабируемость решений"
          }
        },
        interview_analytics: {
          total_questions: 18,
          topics_covered_count: 7,
          average_response_quality: 6.8,
          total_duration: "50 минут"
        },
        detailed_feedback: "Кандидат показывает потенциал как Fullstack Developer, но требует дополнительного развития в области backend и инфраструктуры. Frontend знания на хорошем уровне, backend требует углубления, особенно в вопросах баз данных и DevOps. Подходит на позицию Middle Fullstack Developer с фокусом на дальнейшее обучение.",
        next_steps: [
          "Дополнительное собеседование по backend",
          "Практическое задание по созданию REST API",
          "Обсуждение плана развития",
          "Технический скрининг с backend-тимлидом"
        ]
      }
    }
  ],
  codeExecutions: [],
  aiChats: []
};

module.exports = {
  mockDB,
}