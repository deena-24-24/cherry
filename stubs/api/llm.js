const { GigaChat } = require('langchain-gigachat');
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

// Инициализация GigaChat (опционально)
let llm = null;
let gigachat = null;
if (process.env.GIGA_AUTH) {
    try {
        llm = new GigaChat({
            model: 'GigaChat-2-Max',
            temperature: 0.7,
            scope: 'GIGACHAT_API_PERS',
            streaming: false,
            credentials: process.env.GIGA_AUTH,
            httpsAgent,
        });

        gigachat = new GigaChatClient({
            scope: 'GIGACHAT_API_PERS',
            credentials: process.env.GIGA_AUTH,
            httpsAgent,
            model: 'GigaChat-2-Max',
        });
        console.log('✅ GigaChat initialized');
    } catch (error) {
        console.warn('⚠️ Failed to initialize GigaChat:', error.message);
    }
} else {
    console.warn('⚠️ GIGA_AUTH not found. GigaChat provider will be unavailable.');
}

// Инициализация DeepSeek (опционально)
let llm2 = null;
const deepSeekEndpoint = "https://models.github.ai/inference";
const token = process.env["GITHUB_TOKEN"];
if (token) {
    try {
        process.env["DEEPSEEK_API_KEY"] = token;
        llm2 = new ChatDeepSeek({
            model: "deepseek/DeepSeek-V3-0324",
            temperature: 0,
            streaming: false,
            configuration: {
                baseURL: deepSeekEndpoint,
            }
        });
        llm2.defaultModel = "deepseek/DeepSeek-V3-0324";
        console.log('✅ DeepSeek initialized');
    } catch (error) {
        console.warn('⚠️ Failed to initialize DeepSeek:', error.message);
    }
} else {
    console.warn('⚠️ GITHUB_TOKEN not found. DeepSeek provider will be unavailable.');
}

// Инициализация Ollama (всегда доступен, если установлен локально)
let ollamallm = null;
try {
    ollamallm = new Ollama({
        model: "qwen2.5:72b",
        temperature: 0,
        maxRetries: 2,
    });
    ollamallm.defaultModel = 'qwen2.5:72b';
    console.log('✅ Ollama initialized');
} catch (error) {
    console.warn('⚠️ Failed to initialize Ollama:', error.message);
    console.warn('   Make sure Ollama is running locally if you want to use it.');
}

// Создаем объект провайдеров только с доступными моделями
const llmProviders = {};
if (llm2) llmProviders.deepseek = llm2;
if (llm) llmProviders.gigachat = llm;
if (ollamallm) llmProviders.ollama = ollamallm;

console.log(`📦 Available LLM providers: ${Object.keys(llmProviders).join(', ') || 'none'}`);

module.exports.getModel = ({
    model = 'GigaChat-2-Max',
    streaming = true,
    provider = 'gigachat',
    sessionId = null,  // Для кэширования контекста через X-Session-ID
    temperature = null  // Для установки temperature
}) => {
<<<<<<< HEAD
    const availableProviders = Object.keys(llmProviders);
    
    // Если запрошенный провайдер недоступен, используем первый доступный
    if (!llmProviders[provider]) {
        if (availableProviders.length === 0) {
            throw new Error('No LLM providers available. Please configure at least one provider (GIGA_AUTH, GITHUB_TOKEN, or Ollama).');
        }
        const fallbackProvider = availableProviders[0];
        console.warn(`⚠️ Provider '${provider}' not available. Using '${fallbackProvider}' instead.`);
        provider = fallbackProvider;
    }
    
    const llm = llmProviders[provider];
    if (llm.model !== undefined) {
        llm.model = model;
    }
    if (llm.streaming !== undefined) {
        llm.streaming = streaming;
=======
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
>>>>>>> dev
    }

    return llm;
}

module.exports.gigachat = gigachat;
module.exports.llmProviders = llmProviders;
