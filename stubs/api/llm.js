const { GigaChat, GigaChatEmbeddings } = require('langchain-gigachat');
const { GigaChat: GigaChatClient } = require('gigachat');
const { ChatDeepSeek } = require('@langchain/deepseek');
const { Agent } = require('node:https');
const { Ollama } = require("@langchain/ollama");


const httpsAgent = new Agent({
    rejectUnauthorized: false,
});

const llm = new GigaChat({
    model: 'GigaChat-2-Max',
    temperature: 0.2,
    scope: 'GIGACHAT_API_PERS',
    streaming: true,
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
    provider = 'gigachat'
}) => {
    const llm = llmProviders[provider]
    llm.model = model;
    llm.streaming = streaming;

    return llm;
}

module.exports.gigachat = gigachat
