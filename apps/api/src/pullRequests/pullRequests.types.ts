import { Field, ObjectType } from "@nestjs/graphql";
import { CodeReviewOutcome, PullRequest, PullRequestResolution } from "@testapp/types";

@ObjectType()
export class CodeReview {
  @Field()
  userName: string;

  @Field(() => String)
  outcome: CodeReviewOutcome;
}

@ObjectType({ description: 'pull request' })
export class PullRequestType implements PullRequest {
  @Field()
  title: string;

  @Field()
  authorUserName: string;

  @Field()
  url: string;

  @Field()
  isResolved: boolean;

  @Field()
  wasApproved: boolean;

  @Field(() => String, { nullable: true })
  resolution?: PullRequestResolution;

  @Field(() => [CodeReview])
  reviews: CodeReview[];
}
