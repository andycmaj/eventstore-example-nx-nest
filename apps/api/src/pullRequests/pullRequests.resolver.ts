import {
  Field,
  ObjectType,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import {
  CodeReviewOutcome,
  PullRequest,
  PullRequestResolution,
} from '@testapp/types';
import { redis, redisPubSub } from '@testapp/pubsub';

@ObjectType()
export class CodeReview {
  @Field()
  userName: string;

  @Field(() => String)
  outcome: CodeReviewOutcome;
}

@ObjectType({ description: 'pull request' })
export class PullRequestModel implements PullRequest {
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

@Resolver(() => PullRequestModel)
export class PullRequestsResolver {
  @Query(() => [PullRequestModel])
  async getAllPullRequests(): Promise<PullRequestModel[]> {
    const keys = await redis.keys('*');
    console.log('keys', keys);
    const values = await redis.mget(keys.filter((k) => k !== ''));
    console.log('values', JSON.stringify(values, null, 2));
    return values.map((v) => JSON.parse(v)) as any;
  }

  @Subscription(() => PullRequestModel, {
    name: 'pullRequestUpdated',
  })
  pullRequestUpdated() {
    return redisPubSub.asyncIterator('PR_UPDATED');
  }
}
