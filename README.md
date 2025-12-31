# Delegate

[![build](https://github.com/knowledgecode/delegate/actions/workflows/ci.yml/badge.svg)](https://github.com/knowledgecode/delegate/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@knowledgecode/delegate)](https://www.npmjs.com/package/@knowledgecode/delegate)

Event delegation library with support for Web Components.

## Features

- **🎯 Event Delegation**: Efficient event handling with automatic bubbling capture
- **🌐 Web Components Support**: Shadow DOM traversal with `>>` selector syntax
- **⚙️  Passive Listeners**: Support for passive event listeners with `:passive` syntax
- **⚡ Performance Utilities**: Built-in debounce and throttle functions
- **🔗 jQuery-like API**: Familiar method chaining interface for easy adoption
- **💾 Memory Efficient**: WeakMap-based caching prevents memory leaks
- **📦 TypeScript Native**: Full TypeScript support with comprehensive type definitions

## Notice

This library is under active development and may introduce breaking changes frequently.

## Installation

### Via npm

```shell
npm i @knowledgecode/delegate
```

### Via CDN (ES Modules)

For modern browsers with ES modules support, you can import directly from a CDN:

#### jsDelivr

```html
<script type="module">
  import { delegate } from 'https://cdn.jsdelivr.net/npm/@knowledgecode/delegate/+esm';

  delegate(document)
    .on('click', '.button', () => {
      alert('Clicked!');
    });
</script>
```

#### unpkg

```html
<script type="module">
  import { delegate } from 'https://unpkg.com/@knowledgecode/delegate?module';

  delegate(document)
    .on('click', '.button', () => {
      alert('Clicked!');
    });
</script>
```

**Note**: CDN imports work in modern browsers that support ES modules. For older browsers, please use the npm package with a bundler.

## Usage

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document)
  .on('click', '.button', () => {
    alert('Clicked!');
  });
```

## delegate

### `delegate(baseTarget)`

Creates or retrieves a delegate instance for the specified event target.

- baseTarget
  - type: `Window | Document | Element | DocumentFragment`
  - The base event target for delegation. This is the root element where event listeners are registered using event capture.

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

### `nativeEvent`

The native event object.

```typescript
delegate(document)
  .on('mousedown', '#area', evt => {
    if (evt.nativeEvent.pageX < 48 && evt.nativeEvent.pageY < 48) {
      alert('Shoot!');
    }
  });
```

> **Note**: The `originalEvent` property is deprecated. Please use `nativeEvent` instead. The `originalEvent` property is still available for backward compatibility but will be removed in a future version.

### `currentTarget`

The current target of the event (i.e., the element where the event listener is attached).

**Note**: This property represents the same target as the `baseTarget` parameter passed to the `delegate()` function. In event delegation, the `baseTarget` is where the event listener is registered, and during event handling, `evt.currentTarget` refers to that same target.

```typescript
delegate(document)
  .on('click', '.button', evt => {
    // evt.currentTarget is the same as the baseTarget (document)
    if (evt.currentTarget === document) {
      alert('The currentTarget equals to the baseTarget (document).');
    }
  });
```

### `delegateTarget`

The delegate target of the event.

```typescript
delegate(document)
  .on('click', '.button', evt => {
    if (evt.delegateTarget === document.querySelector('.button')) {
      alert('The delegateTarget equals to the button.');
    }
  });
```

### `target`

The original target of the event.

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

The detail data associated with the event.

```typescript
import { delegate } from '@knowledgecode/delegate';

delegate(document)
  .on('click', '.button', evt => {
    const customEvent = new CustomEvent('custom:click', {
      bubbles: true,
      detail: 'Clicked!'
    });
    document.dispatchEvent(customEvent);
  })
  .on('custom:click', evt => {
    alert(evt.detail);  // Clicked!
  });
```

## Utils

### pierce(destination, ev[, data])

Pierces an event through shadow DOM boundaries by dispatching a custom event to the specified destination. This is primarily used within Web Components to propagate events that don't naturally pierce shadow DOM boundaries.

- destination
  - type: `HTMLElement`
  - The target to pierce the event to.
- ev
  - type: `Event | DelegateEvent`
  - The native event or DelegateEvent instance to be pierced.
- data
  - type: `unknown`
  - Optional data to be included in the event detail.

```typescript
import { pierce } from '@knowledgecode/delegate';

// Inside a Web Component
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.shadowRoot.querySelector('input').addEventListener('change', (evt) => {
      // Pierce the change event to the Light DOM
      pierce(this, evt);
    });
  }
}
```

See the [Using with Web Components](#using-with-web-components) section for more detailed examples.

> **Note**: The `dispatch()` function is deprecated. Please use `pierce()` instead. The `dispatch()` function is still available for backward compatibility but will be removed in a future version.

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

import { delegate, pierce } from '@knowledgecode/delegate';

@customElement('my-component')
export class MyComponent extends LitElement {
  connectedCallback () {
    super.connectedCallback();

    delegate(this.renderRoot)
      .on('change', '.check', evt => {
        // Pierce events that don't bubble through shadow DOM boundaries by default
        // This is not needed for events like click that naturally bubble through shadow DOM
        pierce(this, evt);
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
