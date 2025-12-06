/// <reference types="cypress" />

/**
 * E2E Tests for Summary Modal User Story
 * - UI-4: Meta UI Summary
 */

describe('Summary Modal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.disableAudio();
  });

  const startAndCompleteWorkout = () => {
    cy.visit('/library');
    cy.get('[data-testid="workout-card"]').first().click();
    cy.contains('Start Guided Coaching').click();
    cy.get('[data-testid="start-button"]').click();
    
    // Skip through all steps to complete workout
    cy.get('[data-testid="skip-button"]').then(($btn) => {
      // Click skip multiple times to reach end
      for (let i = 0; i < 15; i++) {
        cy.wrap($btn).click({ force: true });
        cy.wait(300);
      }
    });
  };

  describe('UI-4: Meta UI Summary', () => {
    it('should display summary modal when workout completes', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-modal"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should show total time completed', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-total-time"]')
        .should('be.visible')
        .and('not.be.empty');
    });

    it('should show total reps completed', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-total-reps"]')
        .should('be.visible')
        .and('match', /\d+/);
    });

    it('should show total sets completed', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-total-sets"]')
        .should('be.visible')
        .and('match', /\d+/);
    });

    it('should show XP earned', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-xp"]')
        .should('be.visible')
        .and('contain', 'XP');
    });

    it('should show estimated calories burned', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-calories"]')
        .should('be.visible')
        .and('match', /\d+.*cal/i);
    });

    it('should display achievements if earned', () => {
      startAndCompleteWorkout();
      
      // Achievements section should exist
      cy.get('[data-testid="summary-achievements"]').should('exist');
      
      // May or may not have achievements depending on workout
      cy.get('[data-testid="summary-achievements"]').then(($achievements) => {
        if ($achievements.find('[data-testid="achievement-badge"]').length > 0) {
          cy.get('[data-testid="achievement-badge"]').should('be.visible');
        }
      });
    });

    it('should have Save button', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-save-button"]')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should have Favorite button', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-favorite-button"]')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should have Share button', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-share-button"]')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should have Start Cooldown option', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-cooldown-button"]')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should save workout when Save button is clicked', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-save-button"]').click();
      
      // Should show confirmation or update UI
      cy.get('[data-testid="save-confirmation"]', { timeout: 3000 })
        .should('be.visible');
    });

    it('should add workout to favorites when Favorite button is clicked', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-favorite-button"]').click();
      
      // Button should update to show favorited state
      cy.get('[data-testid="summary-favorite-button"]')
        .should('have.class', 'favorited');
    });

    it('should toggle favorite status when clicked again', () => {
      startAndCompleteWorkout();
      
      // Favorite it
      cy.get('[data-testid="summary-favorite-button"]').click();
      cy.get('[data-testid="summary-favorite-button"]')
        .should('have.class', 'favorited');
      
      // Un-favorite it
      cy.get('[data-testid="summary-favorite-button"]').click();
      cy.get('[data-testid="summary-favorite-button"]')
        .should('not.have.class', 'favorited');
    });

    it('should launch cooldown flow when Start Cooldown is clicked', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-cooldown-button"]').click();
      
      // Should navigate to cooldown or close modal and start cooldown
      cy.get('[data-testid="cooldown-active"]', { timeout: 5000 })
        .should('exist');
    });

    it('should close modal when close button is clicked', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-close-button"]').click();
      
      cy.get('[data-testid="summary-modal"]').should('not.exist');
    });

    it('should navigate to home when Done button is clicked', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-done-button"]').click();
      
      // Should navigate back to home
      cy.url().should('not.include', '/session');
      cy.url().should('match', /\/$|\/home/);
    });

    it('should display workout name in summary', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-workout-name"]')
        .should('be.visible')
        .and('not.be.empty');
    });

    it('should show breakdown of exercises completed', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-exercises-list"]')
        .should('be.visible');
      
      cy.get('[data-testid="summary-exercise-item"]')
        .should('have.length.greaterThan', 0);
    });

    it('should calculate and display completion percentage', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-completion"]')
        .should('be.visible')
        .and('match', /\d+%/);
    });

    it('should persist workout data to localStorage or backend', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-save-button"]').click();
      
      // Check localStorage for saved workout
      cy.window().then((win) => {
        const workoutHistory = win.localStorage.getItem('workout-history');
        expect(workoutHistory).to.exist;
      });
    });

    it('should show personal records if achieved', () => {
      startAndCompleteWorkout();
      
      // PR section should exist
      cy.get('[data-testid="summary-personal-records"]').should('exist');
      
      // May show PRs if any were achieved
      cy.get('[data-testid="summary-personal-records"]').then(($pr) => {
        if ($pr.find('[data-testid="pr-badge"]').length > 0) {
          cy.get('[data-testid="pr-badge"]').should('be.visible');
        }
      });
    });
  });

  describe('Summary Modal - Share Functionality', () => {
    beforeEach(() => {
      startAndCompleteWorkout();
    });

    it('should open share dialog when Share button is clicked', () => {
      cy.get('[data-testid="summary-share-button"]').click();
      
      // Share dialog or native share should be triggered
      cy.get('[data-testid="share-dialog"]').should('be.visible');
    });

    it('should support copying summary to clipboard', () => {
      cy.get('[data-testid="summary-share-button"]').click();
      
      cy.get('[data-testid="copy-to-clipboard"]').click();
      
      // Verify clipboard interaction
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          expect(text).to.include('workout');
        });
      });
    });
  });

  describe('Summary Modal - Animation and Presentation', () => {
    it('should animate in smoothly when displayed', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-modal"]')
        .should('have.class', 'animate-in');
    });

    it('should show congratulatory message', () => {
      startAndCompleteWorkout();
      
      cy.get('[data-testid="summary-message"]')
        .should('be.visible')
        .and('match', /complete|done|great|congratulations/i);
    });
  });
});
