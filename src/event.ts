interface CustomEventDetail {
  originalEvent: Event;
  target: EventTarget | null;
  data: unknown;
}

export const isCustomEventDetail = (detail: unknown): detail is CustomEventDetail => {
  return typeof detail === 'object' && detail !== null && 'originalEvent' in detail && 'target' in detail;
};

export class DelegateEvent {
  public readonly originalEvent: Event;

  public readonly currentTarget: EventTarget | null;

  public readonly delegateTarget: EventTarget | null;

  public readonly target: EventTarget | null;

  public readonly detail: unknown;

  private _stop: boolean;

  private _abort: boolean;

  /**
   * Creates a new DelegateEvent instance.
   * @param evt - The original event that was triggered.
   * @param target - The target element that the event was delegated to.
   */
  constructor (evt: Event, target: EventTarget | null) {
    if (evt instanceof CustomEvent && isCustomEventDetail(evt.detail)) {
      this.originalEvent = evt.detail.originalEvent;
      this.target = evt.detail.target;
      this.detail = evt.detail.data;
    } else {
      this.originalEvent = evt;
      this.target = evt.composedPath()[0];
      if (evt instanceof CustomEvent) {
        this.detail = evt.detail;
      }
    }
    this.currentTarget = evt.currentTarget;
    this.delegateTarget = target;
    this._stop = !evt.bubbles;
    this._abort = false;
  }

  /**
   * Prevents the default action of the event.
   */
  preventDefault () {
    this.originalEvent.preventDefault();
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
