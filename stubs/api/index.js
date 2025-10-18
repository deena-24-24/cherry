require('dotenv').config()
const { detectImage } = require("gigachat");
const { Router } = require('express')
const { z } = require('zod')
const { RunnableSequence } = require("@langchain/core/runnables");
const { JsonOutputParser, StructuredOutputParser } = require("@langchain/core/output_parsers");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const path = require('node:path')

const { getModel, gigachat } = require('./llm')

const router = Router()

const timer = (time = 300) => (req, res, next) => setTimeout(next, time);

router.use(timer());

const slideDataSchema = z.object({
    title: z.string().describe("Название товара"),
    description: z.string().describe("Описание товара. Около 100 слов"),
    price: z.number().describe("Цена товара"),
    rating: z.number().describe("Рейтинг товара от 0 до 5"),
    comments: z.array(z.object({
        name: z.string().describe("Имя комментатора"),
        text: z.string().describe("Текст комментария"),
        rating: z.number().describe("Оценка комментария от 0 до 5"),
    })).describe("Комментарии к товару. Положительные и отрицательные. Минимум 3 комментария"),
    imagePrompt: z.string().describe('Промт для генерации изображения. Перечисли объекты которые необходимо нарисовать через запятую настройки камеры и окружение. Если изображение рисоваать не требуется напиши "no image"'),
})

const zodSchema = z.object({
  catalogName: z.string().describe("Название каталога на латинице не более 12 символов"),
  imagesStyle: z.string().describe("Укажи стиль изображения и цветовую гамму"),
  cards: z.array(slideDataSchema).describe('Список карточек'),
});

const instructionsCreator = StructuredOutputParser.fromZodSchema(zodSchema);

const chain = RunnableSequence.from([
  ChatPromptTemplate.fromTemplate(
    `Создай каталог товаров.
    Пользователь описал каталог так: {question}
    Язык каталога {lang}
    Количествво карточек: {count} шт.
    {format_instructions}
    
    Текущая дата ${new Date().toLocaleDateString()}`
  ),
  getModel('GigaChat-2-Pro'),
  new JsonOutputParser(),
]);

const main = async ({
    title,
    count,
    lang
}) => {
    const stream = await chain.stream({
      question: title,
      count,
      lang,
      format_instructions: instructionsCreator.getFormatInstructions(),
    });
    
    return stream;
}

router.get('/generate', async (req, res) => {
  const { title, count, lang } = req.query

  const stream = await main({
    title,
    lang,
    count: parseInt(count),
  })

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache'
  });

  for await (const s of stream) {
    res.write(`data: ${JSON.stringify(s)}\n\n`);
  }

  res.write(`event: end\ndata: { "done": true }\n\n`);
  res.end();
})

router.post('/generate-image', async (req, res) => {
  const { imagePrompt, imagesStyle } = req.body

  const chatResponse = await gigachat.chat({
    messages: [
      {
        role: 'user',
        content: `Создай изображение по запросу ${imagePrompt} в стиле ${imagesStyle}`
      }
    ],
    function_call: 'auto'
  })

  const detectedImage = detectImage(chatResponse.choices[0]?.message.content ?? '');
  if (!detectedImage || !detectedImage.uuid) {
    console.log('Image not found')
    console.log(chatResponse.choices[0]?.message)
    return {}
  }

  const image = await gigachat.getImage(detectedImage.uuid);

  const fs = await import('node:fs')
  fs.writeFileSync(path.resolve(__dirname, '..', `images/${detectedImage.uuid}.png`), Uint8Array.from(Array.from(image.content) .map(
    (letter) => letter.charCodeAt(0)
  )))

  res.send({
    uuid: detectedImage.uuid
  })
})

router.get('/card-image/:uuid', async (req, res) => {
  const { uuid } = req.params

  res.sendFile(path.resolve(__dirname, '..', `images/${uuid}.png`))
})

module.exports = router;
