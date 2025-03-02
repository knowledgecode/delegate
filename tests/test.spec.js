import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/');
});

test('on 1', async ({ page }) => {
  const result = page.evaluate(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');

    return new Promise(resolve => {
      delegate(document).on('click', '.div1', evt => {
        resolve(evt.originalEvent.type);
      });
    });
  });

  await page.locator('.div1').click();
  expect(await result).toBe('click');
});

test('on 2', async ({ page }) => {
  const result = page.evaluate(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');

    return new Promise(resolve => {
      delegate(document).on('click', evt => {
        resolve(evt.originalEvent.type);
      });
    });
  });

  await page.locator('body').click();
  expect(await result).toBe('click');
});

test('on 3', async ({ page }) => {
  const result = page.evaluate(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');

    return new Promise(resolve => {
      const iframe = document.createElement('iframe');

      delegate(iframe).on('load', evt => {
        resolve(evt.originalEvent.type);
      });
      iframe.src = '/tests/';
      document.body.appendChild(iframe);
    });
  });

  expect(await result).toBe('load');
});

test('one', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };

    delegate(document).one('click', '.div1', () => {
      result.counter++;
    });
    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(1);
});

test('off 1', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', '.div1', handler1);

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(2);
});

test('off 2', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', '.div1');

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(1);
});

test('off 3', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2)
      .on('click', handler1)
      .off('click', handler1);

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(2);
});

test('off 4', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', handler2)
      .off('click');

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(0);
});

test('off 5', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = () => result.counter++;
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', handler2)
      .off();

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(0);
});

test('preventDefault', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = evt => {
      evt.preventDefault();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', 'input[type="checkbox"]', handler1)
      .on('change', 'input[type="checkbox"]', handler2);

    return Promise.resolve(result);
  });

  await page.locator('input[type="checkbox"]').click();
  expect(await handle.evaluate(result => result.counter)).toBe(1);
});

test('stopPropagation', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = evt => {
      evt.stopPropagation();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div2', handler2);

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(1);
});

test('stopImmediatePropagation', async ({ page }) => {
  const handle = await page.evaluateHandle(async () => {
    const { default: delegate } = await import('../dist/esm/delegate.js');
    const result = { counter: 0 };
    const handler1 = evt => {
      evt.stopImmediatePropagation();
      result.counter++;
    };
    const handler2 = () => result.counter++;

    delegate(document)
      .on('click', '.div1', handler1)
      .on('click', '.div1', handler2);

    return Promise.resolve(result);
  });

  await page.locator('.div1').click();
  expect(await handle.evaluate(result => result.counter)).toBe(1);
});
