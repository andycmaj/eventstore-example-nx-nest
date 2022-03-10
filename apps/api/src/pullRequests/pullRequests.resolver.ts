import { Inject } from '@nestjs/common';
import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Redis } from 'ioredis';
import { PullRequestType } from './pullRequests.types';

@Resolver(() => PullRequestType)
export class PullRequestsResolver {
  constructor(
    private readonly pubSub: RedisPubSub,
    @Inject('REDIS') private readonly modelCache: Redis,
  ) {}

  @Query(() => [PullRequestType])
  async getAllPullRequests(): Promise<PullRequestType[]> {
    const keys = await this.modelCache.keys('*');
    const values = await this.modelCache.mget(keys.filter((k) => k !== ''));
    return values.map((v) => JSON.parse(v)) as PullRequestType[];
  }

  @Subscription(() => PullRequestType, {
    name: 'pullRequestUpdated',
  })
  pullRequestUpdated() {
    return this.pubSub.asyncIterator('PR_UPDATED');
  }
}
