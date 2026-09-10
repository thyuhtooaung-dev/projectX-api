import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { CreateConversationDto } from "./dto/create-conversation.dto";
import type { UpdateConversationDto } from "./dto/update-conversation.dto";
import { Conversation } from "./entities/conversation.entity";

@Injectable()
export class ConversationsService {
	constructor(
		@InjectRepository(Conversation)
		private readonly conversationRepo: Repository<Conversation>,
	) {}

	async create(dto?: CreateConversationDto): Promise<Conversation> {
		const conversation = this.conversationRepo.create({
			title: dto?.title,
		});
		return this.conversationRepo.save(conversation);
	}

	async findAll(): Promise<Conversation[]> {
		return this.conversationRepo.find({
			order: { id: "DESC" },
		});
	}

	async findOne(id: number): Promise<Conversation> {
		const conversation = await this.conversationRepo.findOne({
			where: { id },
			relations: { messages: true },
			order: { messages: { createdAt: "ASC" } },
		});

		if (!conversation) {
			throw new NotFoundException(`Conversation #${id} not found`);
		}

		return conversation;
	}

	async updateTitle(
		id: number,
		dto: UpdateConversationDto,
	): Promise<Conversation> {
		const conversation = await this.findOne(id);
		conversation.title = dto.title;
		return this.conversationRepo.save(conversation);
	}

	async remove(id: number): Promise<void> {
		const conversation = await this.findOne(id);
		await this.conversationRepo.remove(conversation);
	}
}
