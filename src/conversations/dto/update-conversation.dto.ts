import { IsNotEmpty, IsString } from "class-validator";

export class UpdateConversationDto {
	@IsNotEmpty()
	@IsString()
	title: string;
}
