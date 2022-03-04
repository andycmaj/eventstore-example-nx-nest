import { Module } from '@nestjs/common';
import { EventStoreModule } from '../eventStore/eventStore.module';
import { GithubController } from './github.controller';
import { GithubService } from './githubService';

@Module({
  imports: [EventStoreModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class PullRequestsModule {}
