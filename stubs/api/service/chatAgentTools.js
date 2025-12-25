const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

// --- ИНСТРУМЕНТ ПОИСКА: TAVILY
const { TavilySearchResults } = require("@langchain/community/tools/tavily_search");

// Создаем инструмент
const webSearchTool = new TavilySearchResults({
  maxResults: 3, // Ограничиваем кол-во результатов для скорости
});

// --- ХЕЛПЕРЫ ДЛЯ HEADHUNTER ---
const HH_API_URL = "https://api.hh.ru/vacancies";
const USER_AGENT = "CareerUpApp/1.0 (test@test.com)";

/**
 * Функция поиска вакансий через HH API
 */
async function fetchHHVacancies(text, areaName = "") {
  try {
    const query = areaName ? `${text} ${areaName}` : text;
    const response = await axios.get(HH_API_URL, {
      headers: { "User-Agent": USER_AGENT },
      params: {
        text: query,
        per_page: 5, // Топ-5 для экономии токенов
        currency: "RUR",
        order_by: "publication_time"
      },
    });
    return response.data.items || [];
  } catch (error) {
    console.error("HH API Error:", error.message);
    return [];
  }
}

// --- ИНСТРУМЕНТ 1: ПОИСК ВАКАНСИЙ (HH) ---
const vacancySearchTool = new DynamicStructuredTool({
  name: "search_vacancies",
  description: "Используй для поиска актуальных вакансий на HeadHunter. Возвращает список реальных предложений.",
  schema: z.object({
    query: z.string().describe("Название вакансии (например, 'Frontend React')"),
    location: z.string().optional().describe("Город (например, 'Москва')"),
  }),
  func: async ({ query, location }) => {
    const items = await fetchHHVacancies(query, location);
    if (!items || !items.length) return "Вакансий не найдено.";

    const formatted = items.map(item => {
      const salary = item.salary
        ? `${item.salary.from || ''}-${item.salary.to || ''} ${item.salary.currency}`
        : "Зарплата не указана";
      const employer = item.employer ? item.employer.name : "Компания";
      return `- [${item.name}](${item.alternate_url}) в **${employer}**: ${salary}`;
    }).join("\n");

    return `Найдено на HeadHunter:\n${formatted}`;
  },
});

// --- ИНСТРУМЕНТ 2: АНАЛИЗ ЗАРПЛАТ ---
const salaryAnalyzerTool = new DynamicStructuredTool({
  name: "get_market_salary",
  description: "Анализирует рынок зарплат на основе вакансий HeadHunter. Используй для оценки вилки.",
  schema: z.object({
    role: z.string().describe("Позиция"),
    experienceLevel: z.string().optional().describe("Уровень (Junior, Middle, Senior)"),
  }),
  func: async ({ role, experienceLevel }) => {
    const searchText = experienceLevel ? `${experienceLevel} ${role}` : role;

    const items = await fetchHHVacancies(searchText);

    const salaries = items
      .filter(item => item.salary && item.salary.currency === 'RUR')
      .map(item => {
        const { from, to } = item.salary;
        if (from && to) return (from + to) / 2;
        return from || to;
      })
      .filter(val => val && val > 0);

    if (!salaries.length) {
      return "Нет данных о зарплатах в последних вакансиях. Попробуйте поискать в интернете.";
    }

    const sum = salaries.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / salaries.length);
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);

    return `Статистика по ${salaries.length} вакансиям с HH:\nСредняя: ${avg.toLocaleString()} RUB\nДиапазон: ${min.toLocaleString()} - ${max.toLocaleString()} RUB`;
  },
});

// --- ИНСТРУМЕНТ 3: ПОИСК КОДА (GITHUB) ---
const githubSearchTool = new DynamicStructuredTool({
  name: "search_github_repos",
  description: "Поиск репозиториев, библиотек и примеров кода на GitHub. Используй, когда пользователь ищет инструменты или примеры реализации.",
  schema: z.object({
    query: z.string().describe("Технология или название библиотеки (например, 'react datepicker' или 'clean architecture nodejs')"),
    language: z.string().optional().describe("Язык программирования (например, 'javascript', 'python')"),
  }),
  func: async ({ query, language }) => {
    try {
      let q = query;
      if (language) q += ` language:${language}`;

      const response = await axios.get("https://api.github.com/search/repositories", {
        params: { q, sort: "stars", order: "desc", per_page: 3 }
      });

      if (!response.data.items.length) return "На GitHub ничего не найдено.";

      const repos = response.data.items.map(repo =>
        `- [${repo.full_name}](${repo.html_url}) (⭐ ${repo.stargazers_count}): ${repo.description || "Нет описания"}`
      ).join("\n");

      return `Популярные репозитории на GitHub:\n${repos}`;
    } catch (error) {
      console.error("GitHub API Error", error.message);
      return "Ошибка поиска на GitHub.";
    }
  },
});

// --- ИНСТРУМЕНТ 4: АНАЛИЗ КОМПАНИИ (TAVILY WRAPPER) ---
const companyResearchTool = new DynamicStructuredTool({
  name: "analyze_company",
  description: "Поиск информации о компании-работодателе: отзывы сотрудников, используемый стек технологий, последние новости. Не используй для поиска вакансий.",
  schema: z.object({
    companyName: z.string().describe("Название компании"),
    infoType: z.enum(["reviews", "stack", "general"]).describe("Что искать: 'reviews' (отзывы), 'stack' (технологии) или 'general' (общее)"),
  }),
  func: async ({ companyName, infoType }) => {
    let searchQuery;
    if (infoType === "reviews") searchQuery = `отзывы сотрудников о работе в компании ${companyName} habr dreamjob`;
    else if (infoType === "stack") searchQuery = `какой стек технологий использует компания ${companyName} habr`;
    else searchQuery = `новости и информация о компании ${companyName} IT`;

    try {
      const result = await webSearchTool.invoke({ input: searchQuery });
      return JSON.stringify(result);
    } catch (e) {
      return "Не удалось найти информацию о компании.";
    }
  },
});

// --- ИНСТРУМЕНТ 5: ВОПРОСЫ С СОБЕСЕДОВАНИЙ ---
const interviewQuestionsTool = new DynamicStructuredTool({
  name: "get_interview_questions",
  description: "Поиск реальных вопросов с собеседований по конкретной технологии или в конкретную компанию.",
  schema: z.object({
    topic: z.string().describe("Технология (React, Java) или Компания (Yandex, Sber)"),
  }),
  func: async ({ topic }) => {
    const searchQuery = `популярные вопросы с собеседований ${topic} 2024 2025 с ответами`;
    try {
      const result = await webSearchTool.invoke({ input: searchQuery });
      return JSON.stringify(result);
    } catch (e) {
      return "Не удалось найти вопросы.";
    }
  },
});

// --- ИНСТРУМЕНТ 6: ПОИСК В ИНТЕРНЕТЕ (Tavily) ---
const generalSearchTool = new DynamicStructuredTool({
  name: "general_search",
  description: "ОБЩИЙ поиск в интернете. Используй ТОЛЬКО если другие инструменты (вакансии, гитхаб, вопросы на собеседованиях) не подходят, но нужна актуальная информация (документация, тренды).",
  schema: z.object({
    term: z.string().describe("Запрос"),
  }),
  func: async ({ term }) => {
    return await webSearchTool.invoke({ input: term });
  },
});

module.exports = {
  tools: [
    vacancySearchTool,
    salaryAnalyzerTool,
    githubSearchTool,
    companyResearchTool,
    interviewQuestionsTool,
    generalSearchTool,
  ]
};