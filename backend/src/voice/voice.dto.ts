import { IsString, MinLength } from 'class-validator';

export class ParseVoiceCommandDto {
  @IsString()
  @MinLength(1)
  transcription: string;
}

export interface VoiceCommandResult {
  action: string;
  type: 'text' | 'list';
  title: string;
  content?: string;
  items?: string[];
  color?: string;
  category?: string;
  confidence: 'high' | 'medium' | 'low';
}
