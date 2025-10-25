import axios from 'axios'

class ChatService {
  url = '/api/chat'

  getChat = async () => {
    const response = await axios.get(`${this.url}/`)

    return response.data
  }
}

const chatService = new ChatService
