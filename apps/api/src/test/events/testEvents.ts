import { randomUUID } from 'crypto';

export const PullRequestOpened = {
  streamId: 'https://github.com/botany-sanjuans/kayaking/pull/1267',
  eventId: randomUUID(),
  eventType: 'PullRequestOpened',
  data: {
    authorUserName: 'orcas',
    pullRequestId: 1267,
    title: 'Update README.md',
    url: 'https://github.com/botany-sanjuans/kayaking/pull/1267',
  },
};

export const PullRequestReviewRequested = {
  streamId: 'https://github.com/botany-sanjuans/kayaking/pull/1267',
  eventId: randomUUID(),
  eventType: 'PullRequestReviewRequested',
  data: {
    authorUserName: 'orcas',
    pullRequestId: 1267,
    title: 'Update README.md',
    url: 'https://github.com/botany-sanjuans/kayaking/pull/1267',
    requestedUserName: 'shaw',
  },
};

export const PullRequestReviewSubmitted = {
  streamId: 'https://github.com/botany-sanjuans/kayaking/pull/1267',
  eventId: randomUUID(),
  eventType: 'PullRequestReviewSubmitted',
  data: {
    reviewId: 906818955,
    reviewerUserName: 'shaw',
    url: 'https://github.com/botany-sanjuans/kayaking/pull/1265#pullrequestreview-906818955',
    pullRequestId: 1265,
    pullRequestUrl: 'https://github.com/botany-sanjuans/kayaking/pull/1265',
    outcome: 'changes_requested',
  },
};
