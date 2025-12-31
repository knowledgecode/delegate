import { describe, it, expect, vi } from 'vitest';
import { delegate, DelegateEvent, debounce, throttle, pierce } from '@/index.ts';

describe('delegate', () => {
  it('should handle click events with selector', async () => {
    const result = new Promise(resolve => {
      delegate(document).on('click', '.div1', evt => {
        resolve(evt.nativeEvent.type);
      });
    });

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(await result).toBe('click');
  });

  it('should handle click events without selector', async () => {
    const result = new Promise(resolve => {
      delegate(document.body).on('click', evt => {
        resolve(evt.nativeEvent.type);
      });
    });

    document.body.click();

    expect(await result).toBe('click');
  });

  it('should handle iframe load events', async () => {
    const result = new Promise(resolve => {
      const iframe = document.createElement('iframe');

      delegate(iframe).on('load', evt => {
        resolve(evt.nativeEvent.type);
      });
      iframe.src = 'data:text/html,<html><body>test</body></html>';
      document.body.appendChild(iframe);
    });

    expect(await result).toBe('load');
  });

  it('should execute one-time event listener only once', () => {
    const result = { counter: 0 };
    const div1 = document.querySelector<HTMLElement>('.div1');

    delegate(document).one('click', '.div1', () => {
      result.counter++;
    });
    div1?.click();
    div1?.click();

    expect(result.counter).toBe(1);
  });

  it('should remove specific event handler with off', () => {
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document.body)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', '.div1', handler1);

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(2);
  });

  it('should remove all handlers for selector with off', () => {
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document.body)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', '.div1');

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(1);
  });

  it('should remove specific handler without selector with off', () => {
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document.body)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', handler1);

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(2);
  });

  it('should remove all handlers for event type with off', () => {
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document.body)
      .on('click', '.div1', handler1)
      .on('click', handler2)
      .off('click');

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(0);
  });

  it('should remove all handlers with off', () => {
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document.body)
      .on('click', '.div1', handler1)
      .on('click', handler2)
      .off();

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(0);
  });

  it('should handle preventDefault correctly', () => {
    const result = { counter: 0 };
    const handler1 = (evt: DelegateEvent) => {
      evt.preventDefault();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', 'input[type="checkbox"]', handler1)
      .on('change', 'input[type="checkbox"]', handler2);

    document.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();

    expect(result.counter).toBe(1);
  });

  it('should handle stopPropagation correctly', () => {
    const result = { counter: 0 };
    const handler1 = (evt: DelegateEvent) => {
      evt.stopPropagation();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div2', handler2);

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(1);
  });

  it('should handle stopImmediatePropagation correctly', () => {
    const result = { counter: 0 };
    const handler1 = (evt: DelegateEvent) => {
      evt.stopImmediatePropagation();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2);

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(result.counter).toBe(1);
  });

  it('should catch events that occur inside web components', () => {
    const result = { counter: 0 };
    const handler = () => result.counter++;

    delegate(document)
      .on('click', '.box1 >> button', handler)
      .on('click', '.box1 >> my-box2 >> button', handler)
      .on('click', '.box2 >> button', handler);

    document.querySelector<HTMLElement>('.box1')
      ?.shadowRoot?.querySelector<HTMLElement>('my-box2')
      ?.shadowRoot?.querySelector<HTMLButtonElement>('button')?.click();

    expect(result.counter).toBe(2);
  });

  it('should catch events dispatched from inside web components', () => {
    const result = { counter: 0 };
    const handler = () => result.counter++;

    delegate(document)
      .on('change', '.box1 >> input[type="checkbox"]', handler)
      .on('change', '.box1 >> my-box2 >> input[type="checkbox"]', handler)
      .on('change', '.box2 >> input[type="checkbox"]', handler);

    document.querySelector<HTMLElement>('.box1')
      ?.shadowRoot?.querySelector<HTMLElement>('my-box2')
      ?.shadowRoot?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();

    expect(result.counter).toBe(2);
  });

  it('should handle passive event listeners', () => {
    const result = { counter: 0 };
    const handler = () => result.counter++;

    delegate(document).on('touchstart:passive', '.div1', handler);

    const touchEvent = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
    document.querySelector<HTMLElement>('.div1')?.dispatchEvent(touchEvent);

    expect(result.counter).toBe(1);
  });

  it('should throw TypeError for invalid baseTarget', () => {
    expect(() => {
      // @ts-expect-error Testing invalid input
      delegate(null);
    }).toThrow(TypeError);

    expect(() => {
      // @ts-expect-error Testing invalid input
      delegate({});
    }).toThrow(TypeError);
  });

  it('should throw SyntaxError for invalid selector in on()', () => {
    expect(() => {
      delegate(document).on('click', '>>>invalid', () => {
        // Empty handler for testing
      });
    }).toThrow(SyntaxError);
  });

  it('should throw SyntaxError for invalid selector in off()', () => {
    expect(() => {
      delegate(document).off('click', '>>>invalid');
    }).toThrow(SyntaxError);
  });

  it('should reuse cached delegate instance', () => {
    const delegator1 = delegate(document);
    const delegator2 = delegate(document);

    expect(delegator1).toBe(delegator2);
  });

  it('should clear all event listeners and remove from cache', () => {
    const result = { counter: 0 };
    const handler = () => result.counter++;

    const delegator1 = delegate(document.body);
    delegator1.on('click', '.div1', handler);
    delegator1.clear();

    // After clear, a new delegator should be created
    const delegator2 = delegate(document.body);
    expect(delegator1).not.toBe(delegator2);

    // Event handlers should not fire after clear
    document.querySelector<HTMLElement>('.div1')?.click();
    expect(result.counter).toBe(0);
  });

  it('should expose originalEvent property (deprecated)', async () => {
    const result = new Promise(resolve => {
      delegate(document).on('click', '.div1', evt => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        resolve(evt.originalEvent.type);
      });
    });

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(await result).toBe('click');
  });

  it('should expose stop and abort getters', async () => {
    const result = new Promise<{ stop: boolean; abort: boolean }>(resolve => {
      delegate(document).on('click', '.div1', evt => {
        evt.stopPropagation();
        resolve({ stop: evt.stop, abort: evt.abort });
      });
    });

    document.querySelector<HTMLElement>('.div1')?.click();

    const { stop, abort } = await result;
    expect(stop).toBe(true);
    expect(abort).toBe(false);
  });

  it('should set abort flag on stopImmediatePropagation', async () => {
    const result = new Promise<{ stop: boolean; abort: boolean }>(resolve => {
      delegate(document).on('click', '.div1', evt => {
        evt.stopImmediatePropagation();
        resolve({ stop: evt.stop, abort: evt.abort });
      });
    });

    document.querySelector<HTMLElement>('.div1')?.click();

    const { stop, abort } = await result;
    expect(stop).toBe(true);
    expect(abort).toBe(true);
  });

  it('should handle CustomEvent with detail', async () => {
    const testData = { message: 'test data' };
    const result = new Promise(resolve => {
      delegate(document).on('custom-event', '.div1', evt => {
        resolve(evt.detail);
      });
    });

    const customEvent = new CustomEvent('custom-event', {
      bubbles: true,
      detail: testData
    });
    document.querySelector<HTMLElement>('.div1')?.dispatchEvent(customEvent);

    expect(await result).toEqual(testData);
  });
});

describe('pierce', () => {
  it('should pierce event through shadow DOM boundary', async () => {
    const testData = { pierced: true };
    const box1 = document.querySelector<HTMLElement>('.box1');

    if (!box1) {
      throw new Error('Element not available');
    }

    const result = new Promise<unknown>(resolve => {
      box1.addEventListener('click', (evt) => {
        if (evt instanceof CustomEvent) {
          resolve((evt.detail as { data: unknown }).data);
        }
      });
    });

    const clickEvent = new MouseEvent('click', { bubbles: true });
    pierce(box1, clickEvent, testData);

    expect(await result).toEqual(testData);
  });

  it('should preserve event type when piercing', async () => {
    const box1 = document.querySelector<HTMLElement>('.box1');

    if (!box1) {
      throw new Error('Element not available');
    }

    const result = new Promise<string>(resolve => {
      box1.addEventListener('mousedown', (evt) => {
        resolve(evt.type);
      });
    });

    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    pierce(box1, mouseEvent);

    expect(await result).toBe('mousedown');
  });

  it('should extract event type from DelegateEvent', () => {
    const box1 = document.querySelector<HTMLElement>('.box1');

    if (!box1) {
      throw new Error('Element not available');
    }

    let eventType = '';
    box1.addEventListener('test-event', (evt) => {
      eventType = evt.type;
    });

    const nativeEvent = new MouseEvent('test-event', { bubbles: true });
    const delegateEvent = new DelegateEvent(nativeEvent, box1);

    pierce(box1, delegateEvent);

    expect(eventType).toBe('test-event');
  });
});

describe('debounce', () => {
  it('should debounce function calls', () => {
    vi.useFakeTimers();
    const result = { counter: 0, lastValue: '' };
    const handler = debounce((ev: Event) => {
      result.counter++;
      result.lastValue = ev.type;
    }, 100);

    const event1 = new Event('input');
    const event2 = new Event('input');
    const event3 = new Event('input');

    handler(event1);
    handler(event2);
    handler(event3);

    // Should not execute immediately
    expect(result.counter).toBe(0);

    // Fast forward time
    vi.advanceTimersByTime(100);

    // Should execute only once with the last event
    expect(result.counter).toBe(1);
    expect(result.lastValue).toBe('input');

    vi.useRealTimers();
  });

  it('should reset debounce timer on subsequent calls', () => {
    vi.useFakeTimers();
    const result = { counter: 0 };
    const handler = debounce(() => {
      result.counter++;
    }, 100);

    const event = new Event('input');

    handler(event);
    vi.advanceTimersByTime(50);
    handler(event);
    vi.advanceTimersByTime(50);
    handler(event);
    vi.advanceTimersByTime(50);

    // Should not execute yet
    expect(result.counter).toBe(0);

    vi.advanceTimersByTime(50);

    // Should execute once
    expect(result.counter).toBe(1);

    vi.useRealTimers();
  });

  it('should preserve this context in debounced function', () => {
    vi.useFakeTimers();
    const context = { value: 42, result: 0 };
    const handler = debounce(function (this: typeof context) {
      this.result = this.value;
    }, 100);

    const event = new Event('test');
    handler.call(context, event);

    vi.advanceTimersByTime(100);

    expect(context.result).toBe(42);

    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should throttle function calls', () => {
    vi.useFakeTimers();
    const result = { counter: 0 };
    const handler = throttle(() => {
      result.counter++;
    }, 100);

    const event = new Event('scroll');

    handler(event);
    expect(result.counter).toBe(1);

    handler(event);
    handler(event);
    expect(result.counter).toBe(1);

    vi.advanceTimersByTime(100);
    handler(event);
    expect(result.counter).toBe(2);

    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    vi.useFakeTimers();
    const result = { counter: 0, firstCallTime: 0 };
    const handler = throttle(() => {
      result.counter++;
      result.firstCallTime = Date.now();
    }, 100);

    const event = new Event('resize');
    const startTime = Date.now();

    handler(event);

    expect(result.counter).toBe(1);
    expect(result.firstCallTime).toBe(startTime);

    vi.useRealTimers();
  });

  it('should preserve this context in throttled function', () => {
    vi.useFakeTimers();
    const context = { value: 99, result: 0 };
    const handler = throttle(function (this: typeof context) {
      this.result = this.value;
    }, 100);

    const event = new Event('test');
    handler.call(context, event);

    expect(context.result).toBe(99);

    vi.useRealTimers();
  });

  it('should allow execution after interval passes', () => {
    vi.useFakeTimers();
    const result = { counter: 0 };
    const handler = throttle(() => {
      result.counter++;
    }, 100);

    const event = new Event('mousemove');

    handler(event);
    expect(result.counter).toBe(1);

    vi.advanceTimersByTime(50);
    handler(event);
    expect(result.counter).toBe(1);

    vi.advanceTimersByTime(50);
    handler(event);
    expect(result.counter).toBe(2);

    vi.advanceTimersByTime(100);
    handler(event);
    expect(result.counter).toBe(3);

    vi.useRealTimers();
  });
});
