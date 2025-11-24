export const ROUTES = {
  HOME: '/',
  RESUME: '/candidate/resume',
  TECH_CHAT: '/candidate/chat',
  //AI_INTERVIEW: '/candidate/interview/:session_id',
  // ДОБАВЛЯЕМ НОВЫЕ РОУТЫ:
  INTERVIEW_HOME: '/candidate/interview/home',       // главная страница интервью
  INTERVIEW_CALL: '/candidate/interview/call/:sessionId',    // страница звонка (можно объединить с AI_INTERVIEW)
  RESULTS: '/candidate/results',                    // страница результатов
  COMPILER: '/candidate/compiler',
}
