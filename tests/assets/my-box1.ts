import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import './my-box2.ts';

@customElement('my-box1')
export class MyBox extends LitElement {
  protected async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();

    await this.shadowRoot?.querySelector<LitElement>('my-box2')?.updateComplete;
    return result;
  }

  render () {
    return html`
      <div>
        <input type="checkbox" class="check1">
        <button>my-box2</button>
        <my-box2></my-box2>
      </div>
    `;
  }
}
