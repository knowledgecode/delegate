export interface DetailObject {
  nativeEvent: Event;
  target: EventTarget | null;
  data: unknown;
}

/**
 * Type guard to check if the detail is a DetailObject.
 * @param detail - The detail to check.
 * @returns True if the detail is a DetailObject, false otherwise.
 */
export const isDetailObject = (detail: unknown): detail is DetailObject => {
  return typeof detail === 'object' && detail !== null && 'nativeEvent' in detail && 'target' in detail;
};

export class DelegateEvent<T extends Event = Event> {
  /**
   * @deprecated Use `nativeEvent` instead.
   */
  public readonly originalEvent: T;

  /**
   * The native event object.
   */
  public readonly nativeEvent: T;

  /**
   * The current target of the event.
   */
  public readonly currentTarget: EventTarget | null;

  /**
   * The delegate target of the event.
   */
  public readonly delegateTarget: EventTarget | null;

  /**
   * The original target of the event.
   */
  public readonly target: EventTarget | null;

  /**
   * The detail data associated with the event.
   */
  public readonly detail: unknown;

  private _stop: boolean;

  private _abort: boolean;

  /**
   * Creates a new DelegateEvent instance.
   * @param ev - The event object that was triggered
   * @param delegateTarget - The delegate target associated with the event.
   */
  constructor (ev: T, delegateTarget: EventTarget | null) {
    if (ev instanceof CustomEvent && isDetailObject(ev.detail)) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      this.originalEvent = this.nativeEvent = ev.detail.nativeEvent as T;
      this.target = ev.detail.target;
      this.detail = ev.detail.data;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      this.originalEvent = this.nativeEvent = ev;
      this.target = ev.composedPath()[0] ?? ev.target;
      if (ev instanceof CustomEvent) {
        this.detail = ev.detail;
      }
    }
    this.currentTarget = ev.currentTarget;
    this.delegateTarget = delegateTarget;
    this._stop = !ev.bubbles;
    this._abort = false;
  }

  /**
   * Prevents the default action of the event.
   */
  preventDefault () {
    this.nativeEvent.preventDefault();
  }

  /**
   * Stops the propagation of the event.
   */
  stopPropagation () {
    this._stop = true;
  }

  /**
   * Stops the propagation of the event and prevents any further listeners from being called.
   */
  stopImmediatePropagation () {
    this._abort = this._stop = true;
  }

  get stop () {
    return this._stop;
  }

  get abort () {
    return this._abort;
  }
}
