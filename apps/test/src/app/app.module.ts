import { Module } from '@nestjs/common';
import { PullRequestsModule } from '../pullRequests/pullRequests.module';
import { EventStoreModule } from '../eventStore/eventStore.module';

export class Log {
  debug = console.log;
  info = console.log;
  error = console.log;
}

@Module({
  imports: [
    EventStoreModule.forRoot({
      connectionString: 'esdb://localhost:2113?tls=false',
    }),
    PullRequestsModule,
  ],
})
export class AppModule {}
