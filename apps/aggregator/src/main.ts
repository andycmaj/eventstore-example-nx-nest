import { interpret } from 'xstate';
import { EventStoreDBClient } from '@eventstore/db-client';
import { mergeRequestStateMachine } from './pullRequestWriteModel/stateMachine';
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

    // run machine against stream
    const machine = interpret(mergeRequestStateMachine).start();
    for await (const prEvent of streamEvents) {
      // console.log(
      //   'STATE MACHINE EXECUTE',
      //   prEvent.event.type,
      //   prEvent.event.data,
      //   '=========',
      // );
      machine.send(prEvent.event);
    }
    machine.stop();

    // console.log(
    //   'CURRENT STATE AFTER EVENT',
    //   JSON.stringify(
    //     {
    //       state: machine.state.value,
    //       context: machine.state.context,
    //     },
    //     null,
    //     2,
    //   ),
    // );

    redis.set(machine.state.context.url, JSON.stringify(machine.state.context));

    // SUMMARY TOPIC
    redisPubSub.publish('PR_UPDATED', {
      pullRequestUpdated: machine.state.context,
    });
  }
};

run();
