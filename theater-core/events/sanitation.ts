import { EnrichedEvent } from "../events/types";

export function sanitizeEvents(events: EnrichedEvent[]): EnrichedEvent[] {
  return events.map(event => {
    return {
      ...event,
    };
  });
}