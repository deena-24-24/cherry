class InterviewService {
  constructor() {
    this.sessions = new Map();
  }

  createSession(session) {
    this.sessions.set(session.id, {
      ...session,
      notes: '',
      history: []
    });
    return session.id;
  }

  saveNotes(sessionId, notes) {
    const session = this.sessions.get(sessionId) || {};
    session.notes = notes;
    this.sessions.set(sessionId, session);
  }

  async processAudioInteraction(sessionId, chunk /* ArrayBuffer | Buffer */, position = 'frontend') {
    // Stub: in real life, transcribe chunk, run LLM, synthesize audio
    const textResponse = `Принял аудио (${(chunk && chunk.byteLength) || (chunk && chunk.length) || 0} байт). Продолжайте.`;
    const audioResponse = null; // could return TTS audio buffer
    const s = this.sessions.get(sessionId);
    if (s) {
      s.history = s.history || [];
      s.history.push({ from: 'ai', text: textResponse, at: new Date().toISOString() });
    }
    return { textResponse, audioResponse };
  }
}

module.exports = { InterviewService };


