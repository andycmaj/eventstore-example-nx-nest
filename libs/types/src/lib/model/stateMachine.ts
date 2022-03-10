import {
  assign,
  BaseActionObject,
  Machine,
  StateMachine,
  StateNodeConfig,
} from 'xstate';
import {
  PullRequestEvent,
  PullRequestOpened,
  PullRequestReviewSubmitted,
} from '@testapp/events';
import { CodeReviewOutcome, PullRequest } from '@testapp/types';
import { DateTime } from 'luxon';

export type CodeReviewState = 'requested' | CodeReviewOutcome;

export interface RequestedReviewerState {
  state: CodeReviewState;
  lastUpdated: DateTime;
  requestCount: number;
}

export type StateMachineContext = PullRequest & {
  reviewStates: {
    [userName: string]: {
      outcomeState: CodeReviewState;
    };
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
          PullRequestOpened: 'Open',
        },
      },
      Open: {
        entry: assign((context, event: PullRequestOpened) => ({
          title: event.data.title,
          url: event.data.url,
          authorUserName: event.data.authorUserName,
          isResolved: false,
          wasApproved: false,
        })),
        on: {
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
                reviewStates: updateCodeReviewStatesOnSubmitted,
                reviews: updateCodeReviewsOnSubmitted,
              }),
            },
          ],
        },
      },
      ReviewedPendingAuthorChanges: {
        on: {
          PullRequestClosed: {
            target: 'Resolved',
            actions: assign({
              resolution: (_, event) => event.data.resolution,
            }),
          },
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
        },
      },
      ApprovedPendingMerge: {
        on: {
          PullRequestClosed: {
            target: 'Resolved',
            actions: assign({
              resolution: (_, event) => event.data.resolution,
            }),
          },
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
