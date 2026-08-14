import { IsInt, Min } from 'class-validator';

export class ReorderListingImageDto {
  @IsInt()
  @Min(0)
  position!: number;
}
