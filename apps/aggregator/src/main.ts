import { PullRequestModel } from '@testapp/types';
import { EventStoreDBClient } from '@eventstore/db-client';
import { PullRequestEvent } from '@testapp/events';
import { redis, redisPubSub } from '@testapp/pubsub';

const client = EventStoreDBClient.connectionString(
  'esdb://localhost:2113?tls=false',
);

const subscription = client.subscribeToStream<PullRequestEvent>(
  '$ce-pull_request',
  {
    resolveLinkTos: true,
  },
);

const run = async () => {
  for await (const resolvedEvent of subscription) {
    console.log(
      `Received event ${resolvedEvent.event?.revision} : ${resolvedEvent.event?.type}`,
      `From Source stream ${resolvedEvent.event?.streamId}`,
    );

    // load stream
    const streamEvents = client.readStream<PullRequestEvent>(
      resolvedEvent.event?.streamId,
      {
        direction: 'forwards',
        fromRevision: 'start',
      },
    );

    const model = new PullRequestModel();
    await model.project(streamEvents);

    // Update the projected model
    await redis.set(model.url, JSON.stringify(model.state));

    // SUMMARY TOPIC
    await redisPubSub.publish('PR_UPDATED', {
      pullRequestUpdated: model.state,
    });
  }
};

run();
