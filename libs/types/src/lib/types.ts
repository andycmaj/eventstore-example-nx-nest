export type PullRequestResolution = 'Merged' | 'Closed';

export type CodeReviewOutcome =
  | 'approved'
  | 'discussion_started'
  | 'changes_requested';

export interface PullRequest {
  authorUserName: string;
  title: string;
  url: string;
  isResolved: boolean;
  wasApproved: boolean;
  resolution?: PullRequestResolution;
  reviews: {
    userName: string;
    outcome: CodeReviewOutcome;
  }[];
}
