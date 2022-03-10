import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { EventStoreModule } from '../eventStore/eventStore.module';
import { PullRequestsModule } from '../pullRequests/pullRequests.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'generated/schema.gql'),
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (
            connectionParams /*from apollo client connectionPrams*/,
          ) => {
            return {};
          },
        },
      },
    }),
    IngestModule,
    PullRequestsModule,
  ],
})
export class AppModule {}
