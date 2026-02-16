import { Controller, Post, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { ParseVoiceCommandDto, VoiceCommandResult } from './voice.dto';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('parse')
  async parseCommand(
    @Body() dto: ParseVoiceCommandDto,
  ): Promise<VoiceCommandResult> {
    return this.voiceService.parseCommand(dto.transcription);
  }
}
