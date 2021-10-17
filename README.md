# Delegate

This is an event delegation library for the browser. As the interfaces it has are similar to jQuery's, you will be able to learn them easily.

## Installation

via npm:

```shell
npm install knowledgecode@delegate --save
```

## Bundle

| File            | Build                |
|:----------------|:---------------------|
| esm/delegate.js | ES Modules, minified |
| delegate.js     | ES2015               |
| delegate.min.js | ES2015, minified     |
| es5/delegate.js | ES5, minified        |

## Usage

ES Modules:

```html
<script type="module">
  import delegate from './esm/delegate.js';

  delegate(document).on('click', '#button', () => {
    alert('Clicked!');
  });
</script>
```

ES2015:

```html
<script src="./delegate.min.js"></script>
<script>
  delegate(document).on('click', '#button', () => {
    alert('Clicked!');
  });
</script>
```

ES5:

```html
<script src="./es5/delegate.js"></script>
<script>
  delegate(document).on('click', '#button', function () {
    alert('Clicked!');
  });
</script>
```

## API

### delegate

Creates a delegate instance.

* {**Object**} baseEventTarget - A base element that receives events

```javascript
const body = delegate(document.body);

const container = delegate(document.querySelector('.container'));
```

### on

Registers an event listener.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener
* {**Function**} [handler] - An event listener

```javascript
const body = delegate(document.body);

body.on('click', '#button', () => {
  alert('Clicked!');
});

// If a base element itself should process an event:
body.on('click', () => {
  alert('Clicked');
});
```

### one

Registers an event listener that is fired only once.

* {**string**} eventName - An event name
* {**string|Function**} selector - A selector to match | An event listener, which is fired only once.
* {**Function**} [handler] - An event listener, which is fired only once.

```javascript
const container = delegate(document.querySelector('.container'));

container.one('click', '#button', () => {
  alert('Clicked!');
});
```

### off

Removes registered event listeners.

* {**string**} [eventName] - An event name. If omit it, all the listeners will be removed.
* {**string|Function**} [selector] - A selector to match | An event listener
* {**Function**} [handler] - An event listener. If omit it, all the listeners that are corresponded to the `eventName` will be removed.

```javascript
const handler = () => alert('Clicked!');

delegate(document).on('click', '#button', handler);

// If remove the specific listener:
delegate(document).off('click', '#button', handler);

// If remove all the listeners corresponded to the selector:
delegate(document).off('click', '#button');

// If remove all the listeners corresponded to the eventName:
delegate(document).off('click');

// If the all the listeners:
delegate(document).off();
```

### clear

Removes all the listeners and clean up. Although this method is similar to `off()`, in this case the instance is no longer able to reuse.

```javascript
delegate(document).clear();
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

## Browser Support

Chrome, Firefox, Safari, Edge, IE11

## License

MIT
