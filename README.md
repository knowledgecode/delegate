# Delegate

This is an event delegation library for the browser. Interfaces are similar to jQuery.

## Installation

via npm:

```shell
npm install knowledgecode@delegate --save
```

## Usage

ES Modules:

```javascript
import delegate from './dist/delegate.es.min.js';

delegate(document).on('click', '#button', () => {
  alert('Clicked!');
});
```

traditional:

```javascript
<script src="./dist/delegate.min.js"></script>
<script>
  delegate(document).on('click', '#button', function {
    alert('Clicked!');
  });
</script>
```

## API

### delegate

Create a delegate instance.

* {**Object**} baseEventTarget - A base element that receives events

```javascript
const body = delegate(document.body);

const container = delegate(document.querySelector('.container'));
```

### on

Register an event listener.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener
* {**Function**} [handler] - An event listener

```javascript
delegate(document).on('click', '#button', () => {
  alert('Clicked!');
});

// If a base element itself should process an event:
delegate(document).on('DOMContentLoaded', () => {
  alert('Content Loaded!');
});
```

### one

Register an event listener that is fired only once.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener, which is fired only once.
* {**Function**} [handler] - An event listener, which is fired only once.

```javascript
delegate(document).one('click', '#button', () => {
  alert('Clicked!');
});
```

### off

Remove registered event listeners.

* {**string**} [eventName] - An event name. If omit it, all the listeners will be removed.
* {**string|Function**} [selector] - A selector to match | An event listener
* {**Function**} [handler] - An event listener. If omit it, all the listeners that are related to the `eventName` will be removed.

```javascript
const handler = () => alert('Clicked!');

delegate(document).on('click', '#button', handler);

// If remove the specific listener:
delegate(document).off('click', '#button', handler);

// If remove all the listeners related to the selector:
delegate(document).off('click', '#button');

// If remove all the listeners related to the eventName:
delegate(document).off('click');

// If the all the listeners:
delegate(document).off();
```

### clear

Remove all the listeners and clean up. Although this method is similar to `off()`, in this case the instance is no longer able to reuse.

```javascript
delegate(document).clear();
```

## Method Chaining

This library supports method chaining like jQuery.

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

## Event Object

A listener receives an event object. This object provides the following methods and properties:

* `preventDefault()`
* `stopPropagation()`
* `stopImmediatePropagation()`
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

## Browser Support

Chrome, Firefox, Safari, Edge, IE9+

## License

MIT
