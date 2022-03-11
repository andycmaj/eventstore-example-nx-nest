export type PullRequestResolution = 'Merged' | 'Closed';

export type CodeReviewOutcome =
  | 'approved'
  | 'discussion_started'
  | 'changes_requested';

/**
 * read-side model for UI presentation
 */
export interface PullRequestView {
  authorUserName: string;
  title: string;
  url: string;
  number: number;
  isResolved: boolean;
  wasApproved: boolean;
  resolution?: PullRequestResolution;
  pendingReviewers: {
    userName: string;
  }[];
  reviews: {
    userName: string;
    outcome: CodeReviewOutcome;
  }[];
}
