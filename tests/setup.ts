import { beforeEach, afterEach } from 'vitest';
import './assets/my-box1';
import './assets/my-box2';
import type { LitElement } from 'lit';

import { delegate } from '../src/index.ts';

// Setup DOM structure for tests
beforeEach(async () => {
  // Clear existing content
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }

  // Insert new DOM structure
  document.body.insertAdjacentHTML('beforeend', `
    <div class="div2">
      <div class="div1">
        <input type="checkbox">
        <my-box1 class="box1"></my-box1>
        <my-box2 class="box2"></my-box2>
      </div>
    </div>
  `);

  await Promise.all([
    document.querySelector<LitElement>('my-box1')?.updateComplete,
    document.querySelector<LitElement>('my-box2')?.updateComplete
  ]);
});

afterEach(() => {
  delegate(document).clear();
});
