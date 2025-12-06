/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for WebGPU canvas to be ready
       * @example cy.waitForWebGPU()
       */
      waitForWebGPU(): Chainable<void>;
      
      /**
       * Custom command to stub WebGPU for testing
       * @example cy.stubWebGPU()
       */
      stubWebGPU(): Chainable<void>;
      
      /**
       * Custom command to skip audio/TTS during tests
       * @example cy.disableAudio()
       */
      disableAudio(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('waitForWebGPU', () => {
  cy.get('canvas', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('stubWebGPU', () => {
  cy.window().then((win) => {
    // Stub WebGPU if not available or for faster testing
    const nav = win.navigator as any;
    if (!nav.gpu) {
      nav.gpu = {
        requestAdapter: cy.stub().resolves({
          requestDevice: cy.stub().resolves({})
        })
      };
    }
  });
});

Cypress.Commands.add('disableAudio', () => {
  cy.window().then((win) => {
    // Stub speech synthesis to prevent audio during tests
    if (win.speechSynthesis) {
      cy.stub(win.speechSynthesis, 'speak');
      cy.stub(win.speechSynthesis, 'cancel');
    }
  });
});

export {};
