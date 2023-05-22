import { Configuration, OpenAIApi} from "openai";
import { createReadStream } from 'fs';
import config from "config";

class OpenAI {

    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    }

    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey
        })
        this.openai = new OpenAIApi(configuration)
    }

    async chat(messages) {
        console.log(messages)
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: messages
            })
            return response.data.choices[0].message
        } catch (e) {
            console.log(`Error while text to GPT chat`, e.message)
        }
    }

    async transcriptions(filePath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filePath),
                'whisper-1'
            )
            return response.data.text
        } catch (e) {
            console.log(`Error while transcription text`, e.message)
        }
    }
}


export const openAI = new OpenAI(config.get('OPENAI_KEY'))