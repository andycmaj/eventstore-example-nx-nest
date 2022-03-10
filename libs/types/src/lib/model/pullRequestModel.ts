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
        machine.send(prEvent.event);
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
