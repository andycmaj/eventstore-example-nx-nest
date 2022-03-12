import { StreamingRead, ResolvedEvent } from '@eventstore/db-client';
import { PullRequestEvent } from '@testapp/events';
import { interpret } from 'xstate';
import { mergeRequestStateMachine, StateMachineContext } from './stateMachine';
import { PullRequestView } from '../types';

export class PullRequestModel {
  private _stateMachineExtendedState: StateMachineContext;

  async project(eventStream: StreamingRead<ResolvedEvent<PullRequestEvent>>) {
    if (!this._stateMachineExtendedState) {
      // run machine against stream
      const machine = interpret(mergeRequestStateMachine).start();
      for await (const prEvent of eventStream) {
        console.log('sending to state machine', prEvent.event);
        machine.send(prEvent.event);

        console.log('context after send', machine.state.value);
        console.log('state after send', machine.state.context);
      }
      machine.stop();

      this._stateMachineExtendedState = machine.state.context;
    }
  }

  get state(): StateMachineContext {
    if (!this._stateMachineExtendedState) {
      throw new Error('model must be initialized');
    }

    return this._stateMachineExtendedState;
  }

  get url(): string {
    if (!this._stateMachineExtendedState) {
      throw new Error('model must be initialized');
    }

    return this._stateMachineExtendedState.url;
  }

  /**
   * example of using the write-model (state machine)
   * to build a read-model with presentation-specific fields
   */
  getView(): PullRequestView {
    const allReviewers = Object.keys(this.state.reviewStates).map((key) => ({
      userName: key,
      state: this.state.reviewStates[key].outcomeState,
    }));

    const pendingReviewers = allReviewers
      .filter((reviewer) => reviewer.state === 'requested')
      .map((reviewer) => ({
        userName: reviewer.userName,
      }));

    const urlSegments = this.url.split('/');
    const prNumber = urlSegments[urlSegments.length - 1];

    return {
      ...this.state,
      number: parseInt(prNumber, 10),
      pendingReviewers,
    };
  }
}
