export const ROUTES = {
  HOME: '/',
  CHAT: '/candidate/chat',
  // Candidate routes
  RESUME: '/candidate/resume',
  AI_CHAT: '/candidate/ai_chat',
  INTERVIEW_HOME: '/candidate/interview/home',       // главная страница интервью
  INTERVIEW_CALL: '/candidate/interview/call/:sessionId',    // страница звонка (можно объединить с AI_INTERVIEW)
  RESULTS: '/candidate/results',                    // страница результатов
  // HR routes
  HR_PROFILE: '/hr/profile',
  HR_CANDIDATES: '/hr/candidates',
}
