import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventStoreConfig, EVENTSTORE_CONFIG } from './constants';
import { EventStore } from './eventStore';

@Global()
@Module({})
export class EventStoreModule {
  static forRoot(config: EventStoreConfig): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENTSTORE_CONFIG,
          useValue: config,
        },
        EventStore,
      ],
      exports: [EventStore],
    };
  }
}
