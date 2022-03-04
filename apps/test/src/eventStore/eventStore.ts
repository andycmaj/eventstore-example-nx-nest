import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventStoreDBClient } from '@eventstore/db-client';
import { EventStoreConfig, EVENTSTORE_CONFIG } from './constants';

@Injectable()
export class EventStore {
  client: EventStoreDBClient;

  constructor(@Inject(EVENTSTORE_CONFIG) config: EventStoreConfig) {
    console.log('ES ctor', config.connectionString);
    this.client = EventStoreDBClient.connectionString(config.connectionString);
  }
}
