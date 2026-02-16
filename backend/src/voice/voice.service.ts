import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { VoiceCommandResult } from './voice.dto';

@Injectable()
export class VoiceService {
  private groq: Groq;

  constructor(private configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async parseCommand(transcription: string): Promise<VoiceCommandResult> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a voice command parser for a note-taking app. Parse the user's spoken command into a structured JSON object.

Rules:
- action: Always "CREATE" for now
- type: "list" if the user mentions a list, checklist, or multiple items. "text" otherwise.
- title: A concise title for the note. Capitalize properly.
- content: For "text" type notes, the main body text. Omit for lists.
- items: For "list" type notes, an array of individual item strings. Omit for text notes.
- color: If the user mentions any color, return the color name they said as a simple lowercase word (e.g. "red", "yellow", "green", "blue", "purple", "brown", "orange", "pink", "teal", "cyan"). Omit if no color mentioned.
- category: If the user mentions a category (e.g. "work", "personal", "shopping"), return the category name as a lowercase string. Omit if no category mentioned.
- confidence: "high" if the intent is very clear, "medium" if somewhat ambiguous, "low" if very unclear.

Respond ONLY with valid JSON, no markdown or extra text.

Examples:
Input: "create a grocery list with eggs milk and bread"
Output: {"action":"CREATE","type":"list","title":"Grocery List","items":["Eggs","Milk","Bread"],"confidence":"high"}

Input: "write a note about the meeting tomorrow at 3pm to discuss the project timeline"
Output: {"action":"CREATE","type":"text","title":"Meeting Tomorrow","content":"Meeting tomorrow at 3pm to discuss the project timeline.","confidence":"high"}

Input: "create a green shopping list with apples bananas and oranges in the personal category"
Output: {"action":"CREATE","type":"list","title":"Shopping List","items":["Apples","Bananas","Oranges"],"color":"green","category":"personal","confidence":"high"}

Input: "make a blue note about fixing the login bug for work"
Output: {"action":"CREATE","type":"text","title":"Fix Login Bug","content":"Fix the login bug.","color":"blue","category":"work","confidence":"high"}`,
          },
          {
            role: 'user',
            content: transcription,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from Groq');
      }

      const parsed = JSON.parse(responseText) as VoiceCommandResult;
      return parsed;
    } catch (error) {
      console.error('Voice command parsing error:', error);
      return {
        action: 'CREATE',
        type: 'text',
        title: 'Voice Note',
        content: transcription,
        confidence: 'low',
      };
    }
  }
}
