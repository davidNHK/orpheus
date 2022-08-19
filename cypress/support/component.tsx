import './commands';
import '../../src/setup.js';

import { mount } from 'cypress/react18';
import type { PropsWithChildren } from 'react';

import { cy, Cypress } from '../../src/test-helpers/test-runner.js';

function TestBed(props: PropsWithChildren) {
  return (
    <main>
      <h1
        className={
          'tw-mb-1 tw-block tw-border-b-2 tw-border-red-400 tw-bg-blue-100 tw-text-center tw-text-9xl' +
          ' tw-font-bold tw-text-gray-600'
        }
      >
        TestBed
      </h1>
      {props.children}
    </main>
  );
}

Cypress.Commands.add('mount', element => mount(<TestBed>{element}</TestBed>));
Cypress.Commands.add('getComponentCanvasRoot', () => {
  return cy.get(`div[data-cy-root]`);
});
