import './component.js';

import type { mount } from 'cypress/react18';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getBySel(
        dataTestAttribute: string,
        args?: any,
      ): Chainable<JQuery<HTMLElement>>;
      getBySelLike(
        dataTestPrefixAttribute: string,
        args?: any,
      ): Chainable<JQuery<HTMLElement>>;
      getComponentCanvasRoot(): Chainable<JQuery<HTMLElement>>;
      mount: typeof mount;
    }
  }
}
