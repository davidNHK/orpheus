import App from './App.js';
import { cy, describe, it } from './test-helpers/test-runner.js';

describe('App', () => {
  it('should render without any errors', () => {
    cy.mount(<App />);
    cy.findByTestId('app').should('be.visible');
  });
});
