import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as Redis from 'ioredis';

const options = {
  host: 'localhost',
  port: 6380,
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

export const redis = new Redis(options);

// const prReviver = (key, value) => {
//   if (typeof value === 'string' && value.startsWith('https://github.com')) {
//     const serialized = await redis.get(value);
//     return JSON.parse(serialized);
//   }

//   return value;
// };

export const redisPubSub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
  // reviver: prReviver,
});
