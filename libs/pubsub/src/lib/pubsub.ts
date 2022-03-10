import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as Redis from 'ioredis';

export const redisOptions = {
  host: 'localhost',
  port: 6380,
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

export const redis = new Redis(redisOptions);

export const redisPubSub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});
