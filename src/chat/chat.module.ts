import { Module } from "@nestjs/common";
import { ConversationsModule } from "../conversations/conversations.module";
import { MessagesModule } from "../messages/messages.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
	imports: [ConversationsModule, MessagesModule],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}
