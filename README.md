# Delegate

[![build](https://github.com/knowledgecode/delegate/actions/workflows/node.js.yml/badge.svg)](https://github.com/knowledgecode/delegate/actions/workflows/node.js.yml)
[![npm](https://img.shields.io/npm/v/@knowledgecode/delegate)](https://www.npmjs.com/package/@knowledgecode/delegate)

This is an event delegation library for the browser. The interface is similar to that of `jQuery`, making it easy to learn.

## Installation

via npm:

```shell
npm i @knowledgecode/delegate
```

## Usage

```javascript
import delegate from '@knowledgecode/delegate';
```

ES Modules:

```html
<script type="module">
  import delegate from '/path/to/esm/delegate.js';

  delegate(document).on('click', '#button', () => {
    alert('Clicked!');
  });
</script>
```

Traditional:

```html
<script src="/path/to/umd/delegate.js"></script>
<script>
  delegate(document).on('click', '#button', () => {
    alert('Clicked!');
  });
</script>
```

## API

### `delegate`

Creates a delegate instance.

* {**Object**} baseEventTarget - A base element that receives events

```javascript
const body = delegate(document.body);
```

```javascript
const container = delegate(document.querySelector('.container'));
```

### `on`

Registers an event listener.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener
* {**Function**} [handler] - An event listener

```javascript
const body = delegate(document.body);

body.on('click', '#button', () => {
  alert('Clicked!');
});

// If the base element itself handles the event:
body.on('click', () => {
  alert('Clicked');
});
```

### `one`

Registers an event listener that is fired only once.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener, which is fired only once.
* {**Function**} [handler] - An event listener, which is fired only once.

```javascript
const container = delegate(document.querySelector('.container'));

container.one('click', '#button', () => {
  alert('Clicked!');
});

// If the base element itself handles the event:
container.one('click', () => {
  alert('Clicked');
});
```

### `off`

Removes registered event listeners.

* {**string**} [eventName] - An event name. If omit it, all the listeners will be removed.
* {**string|Function**} [selector] - A selector to match | An event listener
* {**Function**} [handler] - An event listener. If omit it, all the listeners that are corresponded to the `eventName` will be removed.

```javascript
const handler1 = () => alert('Clicked!');
const handler2 = () => alert('Clicked!');
const handler3 = () => alert('Mouse Over!');

delegate(document)
  .on('click', '#button', handler1)         // No.1
  .on('click', '#button', handler2)         // No.2
  .on('mouseover', '#button', handler3)     // No.3
  .on('click', handler1);                   // No.4

// To remove only event No.1:
delegate(document).off('click', '#button', handler1);

// To remove only event No.4:
delegate(document).off('click', handler1);

// To remove all click events registered to #button (No.1 and No.2):
delegate(document).off('click', '#button');

// To remove all click events (No.1, No.3 and No.4):
delegate(document).off('click');

// To remove all events:
delegate(document).off();
```

### `clear`

Removes all registered event listeners. It is almost the same as `off()`.

```javascript
delegate(document).clear();
```

## Event Object

Listeners receive an event object when an event is fired. This object provides the following methods and properties:

### `Methods`

* `preventDefault()`
* `stopPropagation()`
* `stopImmediatePropagation()`

### `Properties`

* `originalEvent` - a genuine event object when an event is fired
* `currentTarget` - the current element

```javascript
delegate(document)
  .on('click', 'a', evt => {
      evt.preventDefault();
  })
  .on('mousedown', '#area', evt => {
      if (evt.originalEvent.pageX < 48 && evt.originalEvent.pageY < 48) {
        console.log('Shoot!');
      }
  })
  .on('blur', 'input[type="text"]', evt => {
      // evt.currentTarget === this
      console.log(evt.currentTarget.value);
  })
```

## Passive Listener

You can specify a passive listener like this:

```javascript
const listener = evt => {
  // Error (It cannot be prevent this event).
  evt.preventDefault();
};

delegate(document)
  .on('touchstart:passive', '.touch-area', listener);
```

Note that the `touchstart:passive` is clearly distinguished from `touchstart`. If you want to remove this listener, you need to write like this:

```javascript
delegate(document)
  .off('touchstart:passive', '.touch-area', listener);
```

## Method Chaining

This library supports method chaining like `jQuery`.

```javascript
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

## Browser Support

Chrome, Firefox, Safari, Edge

## License

MIT
