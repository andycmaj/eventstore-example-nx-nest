import { Module } from '@nestjs/common';
import { PullRequestsResolver } from './pullRequests.resolver';

@Module({
  imports: [],
  providers: [PullRequestsResolver],
})
export class PullRequestsModule {}
