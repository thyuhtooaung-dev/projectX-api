import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ChatStreamDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsNumber()
  conversationId?: number;

  @IsOptional()
  @IsString()
  model?: string;
}
