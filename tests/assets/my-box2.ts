import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { delegate, dispatch } from '../../src/index.ts';

@customElement('my-box2')
export class MyBox extends LitElement {
  connectedCallback () {
    super.connectedCallback();

    delegate(this.renderRoot)
      .on('change', '.check2', evt => {
        dispatch(this, evt.originalEvent.type, evt);
      })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    delegate(this.renderRoot).clear();
  }

  render () {
    return html`
      <div>
        <input type="checkbox" class="check2">
        <button>my-box2</button>
      </div>
    `;
  }
}
