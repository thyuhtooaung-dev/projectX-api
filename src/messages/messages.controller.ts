import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
} from "@nestjs/common";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MessagesService } from "./messages.service";

@Controller("api/messages")
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post()
	create(@Body() createMessageDto: CreateMessageDto) {
		return this.messagesService.create(createMessageDto);
	}

	@Get("conversation/:conversationId")
	findByConversation(
		@Param("conversationId", ParseIntPipe) conversationId: number,
	) {
		return this.messagesService.findByConversationId(conversationId);
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param("id", ParseIntPipe) id: number) {
		return this.messagesService.remove(id);
	}
}
