import { StreamingRead, ResolvedEvent } from '@eventstore/db-client';
import { PullRequestEvent } from '@testapp/events';
import { interpret } from 'xstate';
import { mergeRequestStateMachine, StateMachineContext } from './stateMachine';

export class PullRequestModel {
  private _state: StateMachineContext;

  async project(eventStream: StreamingRead<ResolvedEvent<PullRequestEvent>>) {
    if (!this._state) {
      // run machine against stream
      const machine = interpret(mergeRequestStateMachine).start();
      for await (const prEvent of eventStream) {
        console.log('sending to state machine', prEvent.event);
        machine.send(prEvent.event);

        console.log('context after send', machine.state.value);
        console.log('state after send', machine.state.context);
      }
      machine.stop();

      this._state = machine.state.context;
    }
  }

  get state(): StateMachineContext {
    if (!this._state) {
      throw new Error('model must be initialized');
    }

    return this._state;
  }

  get url(): string {
    if (!this._state) {
      throw new Error('model must be initialized');
    }

    return this._state.url;
  }
}
