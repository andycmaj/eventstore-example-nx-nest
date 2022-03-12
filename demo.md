## High-level talk about what EventSourcing is/isn't

https://andycmaj.notion.site/Event-Sourcing-Notes-d8b7c0eef12240b295e163930a759b76

## DEMO

- simple PR flow with UI updates.
- talk through sequence diagram with CodeTour to the side
- delete read model cache and re-run projector app to show re-populate
  - do this with UI running

## Code/Architecture Discussion

### xState as Projector

- xState for Read-model projection impl
  - short-lived, stateless state machines.
  - idempotent execution of machines
  - always use readStream to replay events to machine
  - what about side effects?

### Scaling

- partitioning vs Entity Streams
- using Kafka to scale horizontally while maintaining stateless read-models/aggregators
