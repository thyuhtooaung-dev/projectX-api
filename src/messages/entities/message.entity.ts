import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Conversation } from "./../../conversations/entities/conversation.entity";

@Entity("messages")
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	conversationId: number;

	@ManyToOne(
		() => Conversation,
		(conversation) => conversation.messages,
		{
			onDelete: "CASCADE",
		},
	)
	conversation: Conversation;

	@Column({ type: "varchar", length: 20 })
	role: "system" | "user" | "assistant";

	@Column({ type: "text" })
	content: string;

	@Column({ type: "text", nullable: true })
	reasoning?: string;

	@CreateDateColumn()
	createdAt: Date;
}
