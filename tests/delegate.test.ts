import { describe, it, expect } from 'vitest';
import { delegate } from '../src/index.ts';

describe('delegate', () => {
  it('should handle click events with selector', async () => {
    const result = new Promise(resolve => {
      delegate(document).on('click', '.div1', evt => {
        resolve(evt.originalEvent.type);
      });
    });

    document.querySelector<HTMLElement>('.div1')?.click();

    expect(await result).toBe('click');
  });

  it('should handle click events without selector', async () => {
    const result = new Promise(resolve => {
      delegate(document.body).on('click', evt => {
        resolve(evt.originalEvent.type);
      });
    });

    document.body.click();

    expect(await result).toBe('click');
  });

  it('should handle iframe load events', async () => {
    const result = new Promise(resolve => {
      const iframe = document.createElement('iframe');

      delegate(iframe).on('load', evt => {
        resolve(evt.originalEvent.type);
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

  it('should handle preventDefault correctly', async () => {
    const result = { counter: 0 };
    const handler1 = evt => {
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
    const handler1 = (evt) => {
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
    const handler1 = (evt) => {
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
});
