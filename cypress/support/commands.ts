/// <reference types="cypress" />

import '@testing-library/cypress/add-commands';

import { cy, Cypress } from '../../src/test-helpers/test-runner.js';

Cypress.Commands.add('getBySel', selector => {
  return cy.get(`[data-testid=${selector}]`);
});

Cypress.Commands.add('getBySelLike', selector => {
  return cy.get(`[data-testid*=${selector}]`);
});
