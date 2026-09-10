import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import OpenAI from "openai";
import { ConversationsService } from "../conversations/conversations.service";
import type { Conversation } from "../conversations/entities/conversation.entity";
import { MessagesService } from "../messages/messages.service";

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	private openai: OpenAI;

	private readonly PRIMARY_MODEL =
		"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
	private readonly FALLBACK_MODELS = [
		"nvidia/nemotron-3.5-lightning:free",
		"liquid/lfm-2.5-2.6b:free",
	];

	private readonly MAX_HISTORY_MESSAGE = 20;

	private readonly DEFAULT_SYSTEM_PROMPT =
		`You are PoungMont, a warm, friendly, and helpful AI companion.
      Your vibe and guidelines:
      - Tone: Warm, empathetic, and conversational, like a helpful friend. Speak naturally without sounding stiff, robotic, or overly formal.
      - Substance: Provide accurate, genuinely helpful, and thoughtful answers to make the user's life easier.
      - Formatting: Structure responses cleanly using Markdown (bullet points, bold text, code blocks) so everything is easy to read and scan.
      - Brevity: Keep explanations clear, engaging, and direct—avoid unnecessary fluff while remaining supportive and approachable.`;

	constructor(
		private readonly conversationsService: ConversationsService,
		private readonly messagesService: MessagesService,
		private readonly configService: ConfigService,
	) {
		this.openai = new OpenAI({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
			defaultHeaders: {
				"HTTP-Referer": "http://localhost:3000",
				"X-Title": "NestJS OpenRouter Client",
			},
		});
	}

	async streamMessage(
		prompt: string,
		conversationId: number | undefined,
		res: Response,
		requestedModel?: string,
	): Promise<void> {
		try {
			let conversation: Conversation;

			if (conversationId) {
				try {
					conversation =
						await this.conversationsService.findOne(conversationId);
				} catch {
					res.write(
						`data: ${JSON.stringify({ type: "error", message: "Session not found" })}\n\n`,
					);
					res.end();
					return;
				}
			} else {
				conversation = await this.conversationsService.create();
				conversation.messages = [];
			}

			res.write(
				`data: ${JSON.stringify({
					type: "session",
					conversationId: conversation.id,
				})}\n\n`,
			);

			const rawMessages = conversation.messages || [];
			const recentMessages =
				rawMessages.length > this.MAX_HISTORY_MESSAGE
					? rawMessages.slice(-this.MAX_HISTORY_MESSAGE)
					: rawMessages;

			const messageHistory: {
				role: "system" | "user" | "assistant";
				content: string;
			}[] = [{ role: "system", content: this.DEFAULT_SYSTEM_PROMPT }];

			for (const m of recentMessages) {
				messageHistory.push({
					role: m.role,
					content: m.content,
				});
			}

			messageHistory.push({ role: "user", content: prompt });

			const { stream, modelUsed } = await this.createStreamWithFallback(
				messageHistory,
				requestedModel,
			);

			res.write(
				`data: ${JSON.stringify({ type: "modelUsed", modelUsed })}\n\n`,
			);

			let fullAiReply = "";
			let fullReasoning = "";

			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta as
					| {
							content?: string;
							reasoning?: string;
							reasoning_content?: string;
					  }
					| undefined;

				const reasoningToken =
					delta?.reasoning || delta?.reasoning_content || "";
				if (reasoningToken) {
					fullReasoning += reasoningToken;
					res.write(
						`data: ${JSON.stringify({
							type: "reasoning",
							content: reasoningToken,
						})}\n\n`,
					);
				}

				const contentToken = delta?.content || "";
				if (contentToken) {
					fullAiReply += contentToken;
					res.write(
						`data: ${JSON.stringify({
							type: "token",
							content: contentToken,
						})}\n\n`,
					);
				}
			}

			if (!fullAiReply && fullReasoning) {
				fullAiReply = fullReasoning;
			} else if (!fullAiReply) {
				fullAiReply = "No response generated.";
				res.write(
					`data: ${JSON.stringify({ type: "token", content: fullAiReply })}\n\n`,
				);
			}

			await this.messagesService.createMany([
				{
					conversationId: conversation.id,
					role: "user",
					content: prompt,
				},
				{
					conversationId: conversation.id,
					role: "assistant",
					content: fullAiReply,
					reasoning: fullReasoning || undefined,
				},
			]);

			if (!conversation.title) {
				void this.generateTitle(conversation.id, prompt, fullAiReply);
			}

			res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
		} catch (err: unknown) {
			this.logger.error("Error during OpenRouter streaming:", err);
			const errObj = err as { error?: { message?: string }; message?: string };
			const errorMessage =
				errObj?.error?.message || errObj?.message || "Error from OpenRouter";
			res.write(
				`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`,
			);
		} finally {
			res.end();
		}
	}

	async getAllConversations(): Promise<Conversation[]> {
		return this.conversationsService.findAll();
	}

	async getConversationById(id: number): Promise<Conversation> {
		return this.conversationsService.findOne(id);
	}

	getAvailableModels() {
		return [
			{
				id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
				name: "Nemotron 3 Nano Omni (Free Reasoning)",
				description: "High quality reasoning & general conversational model",
			},
			{
				id: "nvidia/nemotron-3.5-lightning:free",
				name: "Nemotron 3.5 Lightning (Free)",
				description: "Ultra-fast lightweight reasoning model",
			},
			{
				id: "liquid/lfm-2.5-2.6b:free",
				name: "Liquid LFM 2.5 (Free)",
				description: "Efficient hybrid architecture model",
			},
		];
	}

	private async createStreamWithFallback(
		messages: { role: "system" | "user" | "assistant"; content: string }[],
		requestedModel?: string,
	) {
		const candidateModels = requestedModel
			? [requestedModel, this.PRIMARY_MODEL, ...this.FALLBACK_MODELS]
			: [this.PRIMARY_MODEL, ...this.FALLBACK_MODELS];

		for (const model of candidateModels) {
			try {
				const stream = await this.openai.chat.completions.create({
					model,
					messages,
					stream: true,
				});

				return { stream, modelUsed: model };
			} catch (error) {
				this.logger.warn(
					`Model ${model} failed, switching to next fallback... ${error}`,
				);
			}
		}

		throw new Error("All primary and fallback models failed.");
	}

	private async generateTitle(
		conversationId: number,
		prompt: string,
		reply: string,
	): Promise<void> {
		try {
			const response = await this.openai.chat.completions.create({
				model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",

				messages: [
					{
						role: "system",
						content:
							"Generate a concise 3-5 word title for this conversation. Return ONLY the title text with no quotes, punctuation, or preamble.",
					},
					{
						role: "user",
						content: `User prompt: ${prompt}\nAssistant response: ${reply.slice(0, 200)}`,
					},
				],
				max_tokens: 15,
			});

			const title = response.choices[0]?.message?.content
				?.trim()
				?.replace(/^["']|["']$/g, "");

			if (title) {
				await this.conversationsService.updateTitle(conversationId, { title });
			}
		} catch {
			const fallbackTitle =
				prompt.length > 35 ? `${prompt.slice(0, 32)}...` : prompt;
			await this.conversationsService
				.updateTitle(conversationId, { title: fallbackTitle })
				.catch(() => {});
		}
	}
}
