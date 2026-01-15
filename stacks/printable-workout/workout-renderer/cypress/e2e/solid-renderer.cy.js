describe('Solid renderer workout parity', () => {
  beforeEach(() => {
    cy.visit('/index.html');
  });

  it('renders set tables with defaults and summary pills', () => {
    cy.visit('/index.html');
    cy.get('#solid-render-root').within(() => {
      cy.get('.set-table').first().within(() => {
        cy.get('tbody tr').should('have.length.at.least', 1);
      });
      cy.contains('.exercise-card', 'Rubber Finger Lever Holds').as('firstExercise');
      cy.get('@firstExercise').find('input.set-done').first().check({ force: true });
      cy.get('@firstExercise').find('[data-cy="exercise-summary"]').should('contain.text', 'Done 1/');
      cy.get('@firstExercise').find('input.set-done').check({ force: true });
      cy.get('@firstExercise').find('[data-cy="exercise-summary"]').should('contain.text', 'Completed');
    });
  });

  it('rolls up workout and subsection summaries when sets are completed', () => {
    cy.get('#solid-render-root').within(() => {
      cy.contains('summary', 'Forearms').as('forearmsSummary');
      cy.contains('summary', 'Hands (Combo)').as('handsSub');

      cy.get('@handsSub')
        .next()
        .within(() => {
          cy.get('input.set-done').each(($cb) => cy.wrap($cb).check({ force: true }));
        });

      cy.get('@handsSub').find('[data-cy="subsection-summary"]').should('contain.text', 'Completed');
      cy.get('@forearmsSummary').within(() => {
        cy.get('[data-cy="workout-summary"]').should('contain.text', 'Done');
      });
    });
  });
});
