import { IsInt, IsIn } from 'class-validator';

export class VoteQuestionDto {
  @IsInt()
  @IsIn([1, -1])
  value: 1 | -1;
}
