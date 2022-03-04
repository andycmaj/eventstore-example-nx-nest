import { Module } from '@nestjs/common';
import { PullRequestsModule } from '../pullRequests/pullRequests.module';

export class Log {
  debug = console.log;
  info = console.log;
  error = console.log;
}

@Module({
  imports: [PullRequestsModule],
})
export class AppModule {}
