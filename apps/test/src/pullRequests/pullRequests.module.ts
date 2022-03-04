import { Module } from '@nestjs/common';
import { EventStoreModule } from '../eventStore/eventStore.module';
import { EventStore } from '../eventStore/eventStore';
import { GithubController } from './github.controller';
import { GithubService } from './githubService';

@Module({
  imports: [
    EventStoreModule.forRoot({
      connectionString: 'esdb://localhost:2113?tls=false',
    }),
  ],
  controllers: [GithubController],
  providers: [GithubService, EventStore],
})
export class PullRequestsModule {}
