/**
 * In-Process Event Bus
 *
 * Enables domain event publishing and subscription within a single process.
 * Used for cross-aggregate communication (e.g., when a PRD is generated, emit event for archiving/cleanup).
 * In-memory only; events are lost on process restart. Not a persistent event store.
 *
 * Future: Can be swapped with persistent event store (Kafka, EventStoreDB) by implementing this interface.
 */

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string; // projectId, userId, etc.
  timestamp: Date;
  data: { [key: string]: JsonValue };
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map((h) => h(event)));
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
