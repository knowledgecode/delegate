# Delegate

[![build](https://github.com/knowledgecode/delegate/actions/workflows/ci.yml/badge.svg)](https://github.com/knowledgecode/delegate/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@knowledgecode/delegate)](https://www.npmjs.com/package/@knowledgecode/delegate)

An event delegation library with support for Web Components.

## Notice

This library is under active development and may introduce breaking changes frequently.

## Installation

```shell
npm i @knowledgecode/delegate
```

## Usage

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document)
  .on('click', '.button', () => {
    alert('Clicked!');
  });
```

## delegate

### `delegate(baseEventTarget)`

Creates or retrieves a delegate instance for the specified event target.

- baseEventTarget
  - type: `EventTarget`
  - The base event target to attach event listeners to

```typescript
import { delegate } from '@knowledgecode/delegate';

const doc1 = delegate(document);
const doc2 = delegate(document);

// Instances created from the same EventTarget are identical unless the previous instance is destroyed
if (doc1 === doc2) {
  alert('doc1 and doc2 are the same instance');
}
```

### `on(eventName, selector, handler)`

Adds an event listener to the specified event with optional selector for delegation.

- eventName
  - type: `string`
  - Name of the event to listen for
- selector
  - type: `string`
  - CSS selector for delegation
- handler
  - type: `DelegateEventListener`
  - Event handler function to be executed

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document.body)
  .on('click', '#button', () => {
    alert('The button is clicked!');
  });

// Omit the selector when the base event target itself handles the event:
delegate(document.body)
  .on('click', () => {
    alert('The body is clicked');
  });
```

#### DelegateEventListener

`DelegateEventListener` is a function that takes a `DelegateEvent` as an argument. Details about `DelegateEvent` are described later.

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document.body)
  .on('click', '#button', evt => {
    evt.preventDefault();
  });
```

### `one(eventName, selector, handler)`

Adds a one-time event listener that will be automatically removed after execution.

- eventName
  - type: `string`
  - Name of the event to listen for
- selector
  - type: `string`
  - CSS selector for delegation
- handler
  - type: `DelegateEventListener`
  - Event handler function to be executed once

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document.querySelector('.container'))
  .one('click', '#button', () => {
    alert('The button is clicked!');
  });

// Omit the selector when the base event target itself handles the event:
delegate(document.querySelector('.container'))
  .one('click', () => {
    alert('The container is clicked');
  });
```

### `off([eventName[, selector[, handler]]])`

Removes event listeners based on the specified parameters.

- eventName
  - type: `string`
  - Name of the event to remove
- selector
  - type: `string`
  - CSS selector for delegation
- handler
  - type: `DelegateEventListener`
  - Event handler function to remove

```typescript
import { delegate } from '@knowledgecode/delegate';

const handler1 = () => alert('Clicked!');
const handler2 = () => alert('Clicked!');
const handler3 = () => alert('Mouse Over!');

delegate(document.body)
  .on('click', '#button', handler1)         // event 1
  .on('click', '#button', handler2)         // event 2
  .on('mouseover', '#button', handler3)     // event 3
  .on('click', handler1);                   // event 4

// To remove only event 1:
delegate(document.body).off('click', '#button', handler1);

// To remove only event 4:
delegate(document.body).off('click', handler1);

// To remove all click events registered to #button (event 1 and 2):
delegate(document.body).off('click', '#button');

// To remove all click events (event 1, 2 and 4):
delegate(document.body).off('click');

// To remove all events:
delegate(document.body).off();
```

### `clear()`

Clears all event listeners and removes the delegator from cache. The difference from `off()` is that it also removes the cached delegate instance from the library's internal storage.

```typescript
import { delegate } from '@knowledgecode/delegate';

const handler1 = () => alert('Clicked!');
const handler2 = () => alert('Clicked!');
const handler3 = () => alert('Mouse Over!');

const body = delegate(document.body);

body
  .on('click', '#button', handler1)
  .on('click', '#button', handler2)
  .on('mouseover', '#button', handler3)
  .on('click', handler1);

// Completely removes including the delegate instance
body.clear();

const body2 = delegate(document.body);

if (body !== body2) {
  alert('body and body2 are different instances');
}
```

## DelegateEvent

`DelegateEvent` is the event object passed to event handlers.

### `preventDefault()`

Prevents the default action of the event.

```typescript
delegate(document)
  .on('click', 'input[type="submit"]', evt => {
    // Prevents submission
    evt.preventDefault();
  });
```

### `stopPropagation()`

Stops the propagation of the event.

```typescript
delegate(document)
  .on('click', '.button > .label', evt => {
    evt.stopPropagation();
  })
  .on('click', '.button', evt => {
    // This event handler will not be called
  });
```

### `stopImmediatePropagation()`

Stops the propagation of the event and prevents any further listeners from being called. Event handlers for the same element are called in the order they were registered. If `stopImmediatePropagation` is executed in an earlier event handler, subsequent event handlers will not be called.

```typescript
delegate(document)
  .on('click', '.item', evt => {
    evt.stopImmediatePropagation();
  })
  .on('click', '.item', evt => {
    // This event handler will not be called
  });
```

### `originalEvent`

The `Event` object of the triggered event.

```typescript
delegate(document)
  .on('mousedown', '#area', evt => {
    if (evt.originalEvent.pageX < 48 && evt.originalEvent.pageY < 48) {
      alert('Shoot!');
    }
  });
```

### `currentTarget`

The `EventTarget` that received the event.

```typescript
delegate(document)
  .on('click', '.button', evt => {
    if (evt.currentTarget === document) {
      alert('The currentTarget equals to the document.');
    }
  });
```

### `delegateTarget`

The `EventTarget` to which the event was delegated.

```typescript
delegate(document)
  .on('click', '.button', evt => {
    if (evt.delegateTarget === document.querySelector('.button')) {
      alert('The delegateTarget equals to the button.');
    }
  });
```

### `target`

The `EventTarget` where the event actually occurred.

```typescript
delegate(document)
  .on('click', '.button', evt => {
    if (evt.target !== document.querySelector('.button')) {
      alert('The target does not equal to the button.');
    }
  })
  .on('click', '.button > .label', evt => {
    if (evt.target === document.querySelector('.button > .label')) {
      alert('The target equals to the button\'s label.');
    }
  });
```

### `detail`

Receives the arbitrary object set when dispatching events using `dispatch()` described below.

```typescript
import { delegate, dispatch } from '@knowledgecode/delegate';

delegate(document)
  .on('click', '.button', evt => {
    evt.stopPropagation();
    dispatch(document, 'custom:click', evt, 'Clicked!');
  })
  .on('custom:click', evt => {
    alert(evt.detail);  // Clicked!
  });
```

## dispatch

### `dispatch(destination, eventName, event[, data])`

Dispatches a custom event to the specified destination.

- destination
  - type: `EventTarget`
  - The target to dispatch the event to.
- eventName
  - type: `string`
  - The name of the event to be dispatched.
- event
  - type: `Event | DelegateEvent`
  - The original event or DelegateEvent instance that triggered the dispatch.
- data
  - type: `unknown`
  - Optional data to be included in the event detail.

```typescript
import { delegate, dispatch } from '@knowledgecode/delegate';

delegate(document)
  .on('click', '.button', evt => {
    evt.stopPropagation();
    dispatch(document, 'custom:click', evt, 'Clicked!');
  })
  .on('custom:click', evt => {
    alert(evt.detail);  // Clicked!
  });
```

## Utils

### debounce(handler, delay)

Debounce function to limit the rate at which a function can fire.

- handler
  - type: `EventListener | DelegateEventListener`
  - The function to be debounced, typically an EventListener or DelegateEventListener.
- delay
  - type: `number`
  - The time in milliseconds to wait before executing the function after the last call.

```typescript
import { delegate, debounce, DelegateEvent } from '@knowledgecode/delegate';

delegate(window)
  .on('resize', debounce((evt: DelegateEvent) => {
    // Process 300ms after the last resize event occurred
    console.log((evt.target as Window).innerWidth);
  }, 300));
```

### throttle(handler, interval)

Throttle function to limit the execution of a function to once every specified interval.

- handler
  - type: `EventListener | DelegateEventListener`
  - The function to be throttled, typically an EventListener or DelegateEventListener.
- interval
  - type: `number`
  - The time in milliseconds to wait before allowing the function to be called again.

```typescript
import { delegate, throttle, DelegateEvent } from '@knowledgecode/delegate';

delegate(window)
  .on('scroll', throttle((evt: DelegateEvent) => {
    // Throttle scroll events and process every 100ms
    console.log((evt.target as Window).scrollY);
  }, 100));
```

## Using with Web Components

This library can also be used with Web Components. Here's an example using it within a Web Component created with `Lit`:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { delegate, dispatch } from '@knowledgecode/delegate';

@customElement('my-component')
export class MyComponent extends LitElement {
  connectedCallback () {
    super.connectedCallback();

    delegate(this.renderRoot)
      .on('change', '.check', evt => {
        // Propagate events that don't pierce Shadow DOM boundaries by default
        // This is not needed for events like click that pierce Shadow DOM boundaries by default
        dispatch(this, evt.originalEvent.type, evt);
      })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Release delegate events
    delegate(this.renderRoot).clear();
  }

  render () {
    return html`
      <input type="checkbox" class="check">
    `;
  }
}
```

Events propagated from Web Components can be received on the Light DOM side:

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document)
  .on('change', 'my-component >> .check', () => {
    console.log('This is a change event propagated from the checkbox inside my-component');
  })
  .on('change', '.check', () => {
    console.log('This is a change event propagated from a checkbox');
  });
```

`>>` is a custom selector that represents Shadow DOM boundaries. Since CSS selectors cannot normally pierce Shadow DOM boundaries, specifying `my-component .check` would not receive events. While this library allows you to receive events by simply specifying `.check`, when multiple `.check` elements exist, you can narrow down the event source by specifying `my-component >> .check`, which is convenient.

The `>>` selector also supports nested Web Components:

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document)
  .on('change', 'div other-component >> my-component >> .check', () => {
    console.log('This is a change event propagated from the checkbox in my-component inside other-component under div');
  });
```

## Passive Listener

You can define passive event handlers by adding `:passive` to the `eventName`:

```typescript
delegate(document)
  .on('touchstart:passive', '.touch-area', evt => {
    // Error (passive event handlers cannot prevent this event)
    evt.preventDefault();
  });
```

`touchstart:passive` is clearly distinguished from `touchstart`. When removing this event handler with `off()`, you must specify `touchstart:passive` rather than `touchstart` for the `eventName`.

## Method Chaining

This library supports method chaining:

```typescript
delegate(document)
  .on('mousedown', '#button', () => {
    alert('Mouse down!');
  })
  .on('mouseover', '#button', () => {
    alert('Mouse over!');
  })
  .on('mouseup', '#button', () => {
    alert('Mouse up!');
  });
```
