/**
 * In-Process Event Bus
 * 
 * Enables domain event publishing and subscription within a single process.
 * Used for cross-aggregate communication (e.g., when a PRD is generated, emit event for archiving/cleanup).
 * In-memory only; events are lost on process restart. Not a persistent event store.
 * 
 * Future: Can be swapped with persistent event store (Kafka, EventStoreDB) by implementing this interface.
 */

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string; // projectId, userId, etc.
  timestamp: Date;
  data: Record<string, any>;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  subscribe<T extends DomainEvent = DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler<any>);
  }

  async publish<T extends DomainEvent = DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map((h) => h(event)));
  }

  unsubscribe(eventType: string, handler: EventHandler<any>): void {
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