const mockDB = {
  candidates: [
    {
      _id: 'user_1',
      email: 'candidate@candidate.com',
      password: 'qwerty',
      role: 'candidate',
      firstName: 'Кандидат',
      lastName: 'Кандидатов'
    }
  ],
  hr: [
    {  _id: 'user_2',
      email: 'hr@hr.com',
      password: 'qwerty',
      role: 'hr',
      firstName: 'Отдел',
      lastName: 'Кадров',
      companyName: 'Компания'
    }
  ],
  companies: [
    { id: 1, name: "Компания", logo: "/logos/techcorp.svg" }
  ],
  messages: [],
  interviews: []
};

module.exports = {
  mockDB,
}