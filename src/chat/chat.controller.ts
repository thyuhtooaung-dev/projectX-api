import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatStreamDto } from './dto/chat-stream.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  async chat(@Body() dto: ChatStreamDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await this.chatService.streamMessage(
      dto.prompt,
      dto.conversationId,
      res,
      dto.model,
    );
  }

  @Get('models')
  getModels() {
    return this.chatService.getAvailableModels();
  }

  // Backward compatibility endpoints for existing clients
  @Get('conversations')
  async getConversations() {
    return this.chatService.getAllConversations();
  }

  @Get('conversations/:id')
  async getConversation(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getConversationById(id);
  }
}
