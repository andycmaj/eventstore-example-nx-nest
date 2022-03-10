import { EventData, jsonEvent } from '@eventstore/db-client';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';
import { WebhookEventType } from './webhookEventTypes';
import {
  PullRequestEvent,
  PullRequestOpened,
  PullRequestReviewRequested,
  PullRequestReviewSubmitted,
} from '@testapp/events';

type CreateEventFromWebhookResult =
  | { streamName: string; events: EventData<PullRequestEvent>[] }
  | false;

@Injectable()
export class GithubService {
  verifySignature(payload: string, webhookSig: string): boolean {
    if (!webhookSig) {
      console.error('missing signature');
      return false;
    }

    const hmacAlg = crypto.createHmac('sha1', 'secret');
    const computedSignature = `sha1=${hmacAlg.update(payload).digest('hex')}`;
    const result = crypto.timingSafeEqual(
      Buffer.from(webhookSig),
      Buffer.from(computedSignature),
    );

    if (!result) {
      console.error('invalid signature');
    }

    return result;
  }

  getPullRequestStreamName(url: string) {
    return `pull_request-${url}`;
  }

  createEventFromWebhook(
    deliveryId: string,
    eventType: WebhookEventType,
    webhookBody: Request['body'],
  ): CreateEventFromWebhookResult {
    const { action } = webhookBody;

    if (
      eventType === 'pull_request' &&
      ['opened', 'review_requested'].includes(action)
    ) {
      const {
        number,
        pull_request: { html_url, title },
        sender: { login: authorUserName },
      } = webhookBody;

      if (action === 'opened') {
        return {
          streamName: this.getPullRequestStreamName(html_url),
          events: [
            jsonEvent<PullRequestOpened>({
              id: deliveryId,
              type: 'PullRequestOpened',
              data: {
                authorUserName,
                pullRequestId: number,
                title,
                url: html_url,
              },
            }),
          ],
        };
      } else {
        const {
          pull_request: { requested_reviewers },
        } = webhookBody;
        return {
          streamName: this.getPullRequestStreamName(html_url),
          events: requested_reviewers.map((reviewer) =>
            jsonEvent<PullRequestReviewRequested>({
              id: deliveryId,
              type: 'PullRequestReviewRequested',
              data: {
                authorUserName,
                pullRequestId: number,
                title,
                url: html_url,
                requestedUserName: reviewer.login,
              },
            }),
          ),
        };
      }
    } else if (eventType === 'pull_request_review' && action === 'submitted') {
      const {
        review: {
          id,
          user: { login: reviewerUserName },
          state,
          html_url,
        },
        pull_request: { html_url: pr_url, number },
      } = webhookBody;

      return {
        streamName: this.getPullRequestStreamName(pr_url),
        events: [
          jsonEvent<PullRequestReviewSubmitted>({
            id: deliveryId,
            type: 'PullRequestReviewSubmitted',
            data: {
              reviewId: id,
              reviewerUserName,
              url: html_url,
              pullRequestId: number,
              pullRequestUrl: pr_url,
              outcome: state,
            },
          }),
        ],
      };
    } else {
      return false;
    }
  }
}
