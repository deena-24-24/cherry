const { GigaChat, GigaChatEmbeddings } = require('langchain-gigachat');
const { GigaChat: GigaChatClient } = require('gigachat');
const { ChatDeepSeek } = require('@langchain/deepseek');
const { Agent } = require('node:https');
const { Ollama } = require("@langchain/ollama");

// ЯВНО .env файл
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
console.log('🔧 Loading LLM configuration from .env...');
console.log('GIGA_AUTH present:', !!process.env.GIGA_AUTH);

const httpsAgent = new Agent({
    rejectUnauthorized: false,
});

const llm = new GigaChat({
    model: 'GigaChat-2-Max',
    temperature: 0.7,
    scope: 'GIGACHAT_API_PERS',
    streaming: false,
    credentials: process.env.GIGA_AUTH,
    httpsAgent,
});

const gigachat = new GigaChatClient({
    scope: 'GIGACHAT_API_PERS',
    credentials: process.env.GIGA_AUTH,
    httpsAgent,
    model: 'GigaChat-2-Max',
})

const deepSeekEndpoint = "https://models.github.ai/inference"
const token = process.env["GITHUB_TOKEN"]
process.env["DEEPSEEK_API_KEY"] = token

const llm2 = new ChatDeepSeek({
    model: "deepseek/DeepSeek-V3-0324",
    temperature: 0,
    streaming: false,
    configuration: {
        baseURL: deepSeekEndpoint,
    }
});

llm2.defaultModel = "deepseek/DeepSeek-V3-0324"

const ollamallm = new Ollama({
    model: "qwen2.5:72b",
    temperature: 0,
    maxRetries: 2,
});

ollamallm.defaultModel = 'qwen2.5:72b'

const llmProviders = {
    deepseek: llm2,
    gigachat: llm,
    ollama: ollamallm
}

module.exports.getModel = ({
    model = 'GigaChat-2-Max',
    streaming = true,
    provider = 'gigachat',
    sessionId = null,  // Для кэширования контекста через X-Session-ID
    temperature = null  // Для установки temperature
}) => {
    // Для GigaChat создаем новый экземпляр с заголовками, если нужен sessionId
    if (provider === 'gigachat' && sessionId) {
        // Создаем новый экземпляр GigaChat с заголовком X-Session-ID для кэширования контекста
        // Это позволяет GigaChat кэшировать контекст диалога и снизить расходы
        // Примечание: langchain-gigachat может не поддерживать headers напрямую,
        // но мы создаем отдельный экземпляр для каждой сессии
        const gigachatInstance = new GigaChat({
            model: model,
            temperature: temperature !== null ? temperature : 0.7,
            scope: 'GIGACHAT_API_PERS',
            streaming: streaming,
            credentials: process.env.GIGA_AUTH,
            httpsAgent: httpsAgent,
        });
        
        // Пытаемся установить заголовок через свойство, если поддерживается
        // Если langchain-gigachat поддерживает headers, они будут использованы
        try {
            if (gigachatInstance.client && gigachatInstance.client.defaultHeaders) {
                gigachatInstance.client.defaultHeaders['X-Session-ID'] = sessionId;
            } else if (gigachatInstance.headers) {
                gigachatInstance.headers = gigachatInstance.headers || {};
                gigachatInstance.headers['X-Session-ID'] = sessionId;
            }
        } catch (e) {
            // Если не удалось установить заголовок, продолжаем без него
            console.warn(`⚠️ Could not set X-Session-ID header: ${e.message}`);
        }
        
        console.log(`💾 GigaChat: Using session cache for sessionId: ${sessionId}`);
        return gigachatInstance;
    }

    // Для остальных случаев используем базовый экземпляр
    const llm = llmProviders[provider];
    llm.model = model;
    llm.streaming = streaming;
    if (temperature !== null) {
        llm.temperature = temperature;
    }

    return llm;
}

module.exports.gigachat = gigachat
