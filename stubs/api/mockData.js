const mockDB = {
  users: [
    {
      _id: 'user_1',
      email: 'candidate@candidate.com',
      password: 'qwerty',
      role: 'candidate',
      firstName: 'Кандидат',
      lastName: 'Кандидатов'
    },
    {
      _id: 'user_2',
      email: 'hr@hr.com',
      password: 'qwerty',
      role: 'hr',
      firstName: 'Отдел',
      lastName: 'Кадров',
      companyName: 'Компания'
    }
  ],
  resumes: [  ],
  candidates: [],
  hrs: [],
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