import * as RedisCtor from 'ioredis';
import { Module } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PullRequestsResolver } from './pullRequests.resolver';
import { redisOptions } from '@testapp/pubsub';

@Module({
  imports: [],
  providers: [
    {
      provide: 'REDIS_CONFIG',
      useValue: redisOptions,
    },
    {
      inject: ['REDIS_CONFIG'],
      provide: RedisPubSub,
      useFactory: (options) => {
        return new RedisPubSub({
          publisher: new RedisCtor(options),
          subscriber: new RedisCtor(options),
        });
      },
    },
    {
      inject: ['REDIS_CONFIG'],
      provide: 'REDIS',
      useFactory: (options) => {
        return new RedisCtor(options);
      },
    },
    PullRequestsResolver,
  ],
})
export class PullRequestsModule {}
