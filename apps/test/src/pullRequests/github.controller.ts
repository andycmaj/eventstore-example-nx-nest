import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { RawBodyRequest } from '../main';
import { GithubService } from './githubService';
import { EventStore } from '../eventStore/eventStore';
import { jsonEvent } from '@eventstore/db-client';

@Controller()
export class GithubController {
  constructor(
    private readonly appService: GithubService,
    private readonly eventStore: EventStore,
  ) {}

  @Post('github')
  @HttpCode(202)
  async github(
    @Req() request: RawBodyRequest,
  ): Promise<{ statusCode: number; body: string }> {
    const webhookSig = request.headers['x-hub-signature'] as string;
    const githubEventName = request.headers['x-github-event'] as string;
    const deliveryId = request.headers['x-github-delivery'] as string;
    const verified = this.appService.verifySignature(
      request.rawBody,
      webhookSig,
    );

    if (!verified) {
      return { statusCode: 400, body: 'Invalid signature' };
    }

    const {
      pull_request: { url, title },
    } = request.body;

    const event = jsonEvent({
      type: 'PullRequestOpened',
      data: {
        title,
        url,
      },
    });

    const pr = this.eventStore.client.appendToStream(url, event);

    return { statusCode: 202, body: 'accepted' };
  }
}
