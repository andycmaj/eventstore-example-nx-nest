import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  CodeReviewOutcome,
  PullRequestResolution,
  PullRequestView,
} from '@testapp/types';

@ObjectType()
export class PendingReviewer {
  @Field()
  userName: string;
}

@ObjectType()
export class CodeReview {
  @Field()
  userName: string;

  @Field(() => String)
  outcome: CodeReviewOutcome;
}

@ObjectType({ description: 'pull request' })
export class PullRequestType implements PullRequestView {
  @Field()
  title: string;

  @Field()
  authorUserName: string;

  @Field()
  url: string;

  @Field(() => Int)
  number: number;

  @Field()
  isResolved: boolean;

  @Field()
  wasApproved: boolean;

  @Field(() => String, { nullable: true })
  resolution?: PullRequestResolution;

  @Field(() => [PendingReviewer])
  pendingReviewers: PendingReviewer[];

  @Field(() => [CodeReview])
  reviews: CodeReview[];

  @Field()
  isMergeable: boolean;
}
