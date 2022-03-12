import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { RawBodyRequest } from '../../types';
import { GithubService } from './githubService';
import { EventStore } from '../../eventStore/eventStore';
import { WebhookEventType } from './webhookEventTypes';

@Controller()
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly eventStore: EventStore,
  ) {}

  @Post('github')
  @HttpCode(202)
  async github(
    @Req() request: RawBodyRequest,
  ): Promise<{ statusCode: number; body: string }> {
    const webhookSig = request.headers['x-hub-signature'] as string;
    const webhookEventType = request.headers['x-github-event'] as string;
    const webhookDeliveryId = request.headers['x-github-delivery'] as string;
    const verified = this.githubService.verifySignature(
      request.rawBody,
      webhookSig,
    );

    if (!verified) {
      return { statusCode: 400, body: 'Invalid signature' };
    }

    if (
      ![
        'pull_request',
        'pull_request_review',
        'pull_request_review_comment',
      ].includes(webhookEventType)
    ) {
      return { statusCode: 204, body: 'event ignored' };
    }

    const result = this.githubService.createEventFromWebhook(
      webhookDeliveryId,
      webhookEventType as WebhookEventType,
      request.body,
    );

    if (result === false) {
      return { statusCode: 204, body: 'event ignored' };
    }

    try {
      const { streamName, events } = result;

      // TODO: write model execute here

      await this.eventStore.client.appendToStream(streamName, events, {
        // if we expect this to be the first event in any PR stream
        // expectedRevision: NO_STREAM,
      });

      return {
        statusCode: 202,
        body: JSON.stringify({
          events: events.map(({ id, data }) => ({ id, data })),
        }),
      };
    } catch (e) {
      console.error(e);
      return { statusCode: 400, body: e };
    }
  }
}
