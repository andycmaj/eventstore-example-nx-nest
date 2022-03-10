import { CodeReviewOutcome, PullRequestResolution } from '@testapp/types';
import { JSONEventType } from '@eventstore/db-client';

interface PullRequestCommonFields extends Record<string, any> {
  pullRequestId: number;
  title: string;
  url: string;
  authorUserName: string;
}
export type PullRequestOpened = JSONEventType<
  'PullRequestOpened',
  PullRequestCommonFields
>;

export type PullRequestReviewSubmitted = JSONEventType<
  'PullRequestReviewSubmitted',
  {
    reviewId: number;
    pullRequestId: number;
    url: string;
    pullRequestUrl: string;
    outcome: CodeReviewOutcome;
    reviewerUserName: string;
  }
>;

export type PullRequestClosed = JSONEventType<
  'PullRequestClosed',
  PullRequestCommonFields & {
    resolution: PullRequestResolution;
  }
>;

export type PullRequestEvent =
  | PullRequestOpened
  | PullRequestReviewSubmitted
  | PullRequestClosed;
