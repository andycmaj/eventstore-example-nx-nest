import {
  assign,
  BaseActionObject,
  Machine,
  StateMachine,
  StateNodeConfig,
  TransitionsConfig,
} from 'xstate';
import {
  PullRequestEvent,
  PullRequestOpened,
  PullRequestReviewRequested,
  PullRequestReviewSubmitted,
} from '@testapp/events';
import { CodeReviewOutcome, PullRequestView } from '@testapp/types';
import { DateTime } from 'luxon';

export type CodeReviewState = 'requested' | CodeReviewOutcome;

export interface RequestedReviewerState {
  state: CodeReviewState;
  lastUpdated: DateTime;
  requestCount: number;
}

export interface ReviewInstanceState {
  outcomeState: CodeReviewState;
}

// using the state machine context to maintain the
// fields needed for the view
export type StateMachineContext = Omit<
  PullRequestView,
  'number' | 'pendingReviewers'
> & {
  reviewStates: {
    [userName: string]: ReviewInstanceState;
  };
};

// The events that the machine handles
type StateEvent = PullRequestEvent;

type States =
  | 'Init'
  | 'Open'
  | 'ReviewedPendingAuthorChanges'
  | 'ApprovedPendingMerge'
  | 'Resolved';

interface StateSchema {
  states: {
    [key in States]: StateNodeConfig<
      StateMachineContext,
      any,
      PullRequestEvent,
      BaseActionObject
    >;
  };
}

const updateCodeReviewStatesOnSubmitted: (
  context: StateMachineContext,
  event: PullRequestReviewSubmitted,
) => StateMachineContext['reviewStates'] = (context, event) => ({
  ...context.reviewStates,
  [event.data.reviewerUserName]: {
    outcomeState: event.data.outcome,
  },
});

const updateCodeReviewsOnSubmitted: (
  context: StateMachineContext,
  event: PullRequestReviewSubmitted,
) => StateMachineContext['reviews'] = (context, event) => [
  ...context.reviews,
  {
    userName: event.data.reviewerUserName,
    outcome: event.data.outcome,
  },
];

const assignRequestedReviewersOnOpenedOrRequested: (
  context: StateMachineContext,
  event: PullRequestOpened | PullRequestReviewRequested,
) => StateMachineContext['reviewStates'] = (context, event) => {
  console.log('     ===== in action', event);
  return {
    ...context.reviewStates,
    ...(event.data.requestedUserName && {
      [event.data.requestedUserName]: {
        outcomeState: 'requested',
      },
    }),
  };
};
const onPullRequestReviewSubmitted: TransitionsConfig<
  StateMachineContext,
  PullRequestEvent
> = {
  PullRequestReviewSubmitted: [
    {
      target: 'ApprovedPendingMerge',
      cond: 'noOutstandingRejections',
      actions: assign({
        wasApproved: (_, __) => true,
        reviewStates: updateCodeReviewStatesOnSubmitted,
        reviews: updateCodeReviewsOnSubmitted,
      }),
    },
    {
      target: 'ReviewedPendingAuthorChanges',
      cond: 'anyOutstandingRejections',
      actions: assign({
        wasApproved: (_, __) => false,
        reviewStates: updateCodeReviewStatesOnSubmitted,
        reviews: updateCodeReviewsOnSubmitted,
      }),
    },
  ],
};

const onPullRequestClosed: TransitionsConfig<
  StateMachineContext,
  PullRequestEvent
> = {
  PullRequestClosed: {
    target: 'Resolved',
    actions: assign({
      resolution: (_, event) => event.data.resolution,
    }),
  },
};

export const mergeRequestStateMachine: StateMachine<
  StateMachineContext,
  StateSchema,
  StateEvent
> = Machine<StateMachineContext, StateSchema, StateEvent>(
  {
    id: 'MergeRequestState',
    initial: 'Init',
    context: {
      url: null,
      authorUserName: null,
      isResolved: false,
      reviews: [],
      reviewStates: {},
      wasApproved: false,
      title: null,
      resolution: null,
    },
    states: {
      Init: {
        on: {
          // order of these events is not guaranteed
          // for github hooks
          PullRequestOpened: 'Open',
          PullRequestReviewRequested: 'Open',
        },
      },
      Open: {
        entry: [
          assign(
            (_, event: PullRequestOpened | PullRequestReviewRequested) => ({
              title: event.data.title,
              url: event.data.url,
              authorUserName: event.data.authorUserName,
              isResolved: false,
              wasApproved: false,
            }),
          ),
          assign({
            reviewStates: assignRequestedReviewersOnOpenedOrRequested,
          }),
        ],
        on: {
          // order of these events is not guaranteed for github hooks.
          // in this case, we use an "external self-transition"...
          // so that we re-run entry logic to backfill any missing fields
          // see https://xstate.js.org/docs/guides/transitions.html#self-transitions
          PullRequestOpened: 'Open',
          PullRequestReviewRequested: 'Open',
          ...onPullRequestReviewSubmitted,
        },
      },
      ReviewedPendingAuthorChanges: {
        on: {
          ...onPullRequestClosed,
          ...onPullRequestReviewSubmitted,
        },
      },
      ApprovedPendingMerge: {
        on: {
          ...onPullRequestClosed,
          ...onPullRequestReviewSubmitted,
        },
      },
      Resolved: {
        type: 'final',
      },
    },
  },
  {
    guards: {
      anyOutstandingRejections: (
        context,
        event: PullRequestReviewSubmitted,
      ) => {
        const reviewStates = updateCodeReviewStatesOnSubmitted(context, event);
        return Object.values(reviewStates)
          .map(({ outcomeState }) => outcomeState)
          .includes('changes_requested');
      },
      noOutstandingRejections: (context, event: PullRequestReviewSubmitted) => {
        const reviewStates = updateCodeReviewStatesOnSubmitted(context, event);
        return !Object.values(reviewStates)
          .map(({ outcomeState }) => outcomeState)
          .includes('changes_requested');
      },
    },
  },
);
