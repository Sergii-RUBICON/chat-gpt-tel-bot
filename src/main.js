import {session, Telegraf} from "telegraf";
import { message } from "telegraf/filters";
import { code } from 'telegraf/format';
import process from "nodemon";
import config from "config";
import { ogg } from './ogg.js'
import { openAI } from "./openAI.js";

const INITIAL_SESSION = {
    messages: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply(code('Чекаю вашого голосового або текстового повідомленя'))
})

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply(code('Чекаю вашого голосового або текстового повідомленя'))
})


bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Повідомлення отримав, чекаю відповіді від чату...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openAI.transcriptions(mp3Path)
        await ctx.reply(code(`Ваш запит: ${text}`))

        const systemMessage = 'Відповідай українською мовою'
        ctx.session.messages.push(
            {role: openAI.roles.USER, content: text},
            {role: openAI.roles.SYSTEM, content: systemMessage}
        )

        const response = await openAI.chat(ctx.session.messages)

        ctx.session.messages.push(
            {role: openAI.roles.ASSISTANT, content: response.content},
        )

        await ctx.reply(response.content)
    } catch (e) {
        console.log(`Error while voice message`, e.message)
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))