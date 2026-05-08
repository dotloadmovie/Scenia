export class Event {
  static readonly ENTER_FRAME: string = "enterFrame";

  type: string;
  deltaTime: f32;
  target: EventDispatcher | null = null;
  currentTarget: EventDispatcher | null = null;

  constructor(type: string, deltaTime: f32 = 0) {
    this.type = type;
    this.deltaTime = deltaTime;
  }
}

export type EventListener = (event: Event) => void;

class ListenerEntry {
  type: string;
  listener: EventListener;

  constructor(type: string, listener: EventListener) {
    this.type = type;
    this.listener = listener;
  }
}

export class EventDispatcher {
  private listeners: Array<ListenerEntry> = new Array<ListenerEntry>();

  addEventListener(type: string, listener: EventListener): void {
    this.listeners.push(new ListenerEntry(type, listener));
  }

  removeEventListener(type: string, listener: EventListener): void {
    for (let i = this.listeners.length - 1; i >= 0; i--) {
      let entry = this.listeners[i];
      if (entry.type == type && entry.listener == listener) {
        this.listeners.splice(i, 1);
      }
    }
  }

  dispatchEvent(event: Event): void {
    if (event.target == null) {
      event.target = this;
    }
    event.currentTarget = this;

    let snapshot = this.listeners.slice(0);
    for (let i = 0; i < snapshot.length; i++) {
      let entry = snapshot[i];
      if (entry.type == event.type) {
        entry.listener(event);
      }
    }
  }
}
