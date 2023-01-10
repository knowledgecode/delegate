declare class DelegateEvent {
    constructor(evt: Event, target: EventTarget);
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
    originalEvent: Event;
    currentTarget: EventTarget;
}

declare class Delegate {
    constructor(baseEventTarget: EventTarget);
    on(eventName: string, selector: string, handler: (evt: DelegateEvent) => void): Delegate;
    on(eventName: string, handler: (evt: DelegateEvent) => void): Delegate;
    one(eventName: string, selector: string, handler: (evt: DelegateEvent) => void): Delegate;
    one(eventName: string, handler: (evt: DelegateEvent) => void): Delegate;
    off(eventName: string, selector: string, handler: (evt: DelegateEvent) => void): Delegate;
    off(eventName: string, handler: (evt: DelegateEvent) => void): Delegate;
    off(eventName: string, selector: string): Delegate;
    off(eventName: string): Delegate;
    off(): Delegate;
    clear(): void
}

export default function delegate(baseEventTarget: EventTarget): Delegate;
