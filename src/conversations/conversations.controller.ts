import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import type { CreateConversationDto } from "./dto/create-conversation.dto";
import type { UpdateConversationDto } from "./dto/update-conversation.dto";

@Controller("api/conversations")
export class ConversationsController {
	constructor(private readonly conversationsService: ConversationsService) {}

	@Post()
	create(@Body() createConversationDto: CreateConversationDto) {
		return this.conversationsService.create(createConversationDto);
	}

	@Get()
	findAll() {
		return this.conversationsService.findAll();
	}

	@Get(":id")
	findOne(@Param("id", ParseIntPipe) id: number) {
		return this.conversationsService.findOne(id);
	}

	@Patch(":id")
	update(
		@Param("id", ParseIntPipe) id: number,
		@Body() updateConversationDto: UpdateConversationDto,
	) {
		return this.conversationsService.updateTitle(id, updateConversationDto);
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param("id", ParseIntPipe) id: number) {
		return this.conversationsService.remove(id);
	}
}
