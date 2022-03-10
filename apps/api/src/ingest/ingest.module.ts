import { Module } from '@nestjs/common';
import { EventStoreModule } from '../eventStore/eventStore.module';
import { GithubController } from './github/github.controller';
import { GithubService } from './github/githubService';

@Module({
  imports: [EventStoreModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class IngestModule {}
