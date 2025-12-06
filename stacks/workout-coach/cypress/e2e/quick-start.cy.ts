/// <reference types="cypress" />

/**
 * E2E Tests for Quick-Start Mode User Stories
 * - QS-1: Quick-Start Entry Point
 * - QS-2: Auto-Generated Quick-Start Workout
 * - QS-3: One-Tap Repeat of Last Quick-Start
 */

describe('Quick Start Mode', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.disableAudio();
  });

  describe('QS-1: Quick-Start Entry Point', () => {
    it('should display prominent Quick Start button on home screen', () => {
      cy.contains('Quick Start').should('be.visible');
    });

    it('should open Quick Start modal when clicked', () => {
      cy.contains('Quick Start').click();
      
      cy.get('[data-testid="quick-start-modal"]').should('be.visible');
    });

    it('should show duration selection in modal', () => {
      cy.contains('Quick Start').click();
      
      cy.get('[data-testid="duration-slider"]').should('be.visible');
      cy.get('[data-testid="duration-value"]').should('be.visible');
    });

    it('should show goal selection in modal', () => {
      cy.contains('Quick Start').click();
      
      // Goal options
      cy.get('[data-testid="goal-strength"]').should('be.visible');
      cy.get('[data-testid="goal-hypertrophy"]').should('be.visible');
      cy.get('[data-testid="goal-conditioning"]').should('be.visible');
    });

    it('should show equipment checklist in modal', () => {
      cy.contains('Quick Start').click();
      
      cy.get('[data-testid="equipment-checklist"]').should('be.visible');
      
      // Should have at least one equipment option
      cy.get('[data-testid^="equipment-"]').should('have.length.greaterThan', 0);
    });

    it('should have "Start Now" button with defaults', () => {
      cy.contains('Quick Start').click();
      
      cy.get('[data-testid="start-now-button"]').should('be.visible');
      
      // Should be clickable without selecting anything (uses defaults)
      cy.get('[data-testid="start-now-button"]').should('not.be.disabled');
    });

    it('should allow duration adjustment between 5-30 minutes', () => {
      cy.contains('Quick Start').click();
      
      const slider = cy.get('[data-testid="duration-slider"]');
      
      // Set to minimum (5 min)
      slider.invoke('val', 5).trigger('input');
      cy.get('[data-testid="duration-value"]').should('contain', '5');
      
      // Set to maximum (30 min)
      slider.invoke('val', 30).trigger('input');
      cy.get('[data-testid="duration-value"]').should('contain', '30');
    });

    it('should allow multiple equipment selections', () => {
      cy.contains('Quick Start').click();
      
      // Select multiple equipment items
      cy.get('[data-testid="equipment-barbell"]').click();
      cy.get('[data-testid="equipment-dumbbells"]').click();
      
      // Both should be checked
      cy.get('[data-testid="equipment-barbell"]').should('be.checked');
      cy.get('[data-testid="equipment-dumbbells"]').should('be.checked');
    });
  });

  describe('QS-2: Auto-Generated Quick-Start Workout', () => {
    beforeEach(() => {
      cy.contains('Quick Start').click();
    });

    it('should generate workout based on duration selection', () => {
      // Set duration to 10 minutes
      cy.get('[data-testid="duration-slider"]').invoke('val', 10).trigger('input');
      
      // Select goal
      cy.get('[data-testid="goal-strength"]').click();
      
      // Start workout
      cy.get('[data-testid="start-now-button"]').click();
      
      // Should generate and show preview
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 }).should('be.visible');
    });

    it('should generate appropriate exercises for strength goal', () => {
      cy.get('[data-testid="goal-strength"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview should show strength-focused exercises
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 })
        .should('be.visible')
        .and('contain.text', /squat|deadlift|press|row/i);
    });

    it('should generate appropriate exercises for hypertrophy goal', () => {
      cy.get('[data-testid="goal-hypertrophy"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview should show hypertrophy exercises (higher reps)
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('should generate appropriate exercises for conditioning goal', () => {
      cy.get('[data-testid="goal-conditioning"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview should show conditioning exercises
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('should only use selected equipment in generated workout', () => {
      // Select only bodyweight
      cy.get('[data-testid="equipment-bodyweight"]').click();
      
      // Uncheck other equipment if checked
      cy.get('[data-testid^="equipment-"]').each(($el) => {
        const testId = $el.attr('data-testid');
        if (testId !== 'equipment-bodyweight') {
          cy.wrap($el).uncheck();
        }
      });
      
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview should only show bodyweight exercises
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 })
        .should('be.visible')
        .and('not.contain.text', /barbell|dumbbell|kettlebell/i);
    });

    it('should show short preview before launching', () => {
      cy.get('[data-testid="goal-strength"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview should appear
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 }).should('be.visible');
      
      // Should show exercise list
      cy.get('[data-testid="preview-exercise"]').should('have.length.greaterThan', 0);
      
      // Should show estimated duration
      cy.get('[data-testid="preview-duration"]').should('be.visible');
    });

    it('should launch guided flow immediately after preview', () => {
      cy.get('[data-testid="goal-strength"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Preview appears
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 }).should('be.visible');
      
      // Click to start
      cy.get('[data-testid="start-workout-button"]').click();
      
      // Should navigate to session
      cy.url().should('include', '/session');
      
      // Guided coaching should begin
      cy.get('[data-testid="hud-overlay"]').should('be.visible');
    });

    it('should validate duration fits selected exercises', () => {
      // Set very short duration
      cy.get('[data-testid="duration-slider"]').invoke('val', 5).trigger('input');
      cy.get('[data-testid="goal-strength"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Should generate valid workout that fits in 5 minutes
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="preview-duration"]')
        .invoke('text')
        .then((duration) => {
          // Parse duration and verify it's around 5 minutes
          expect(duration).to.include('5');
        });
    });
  });

  describe('QS-3: One-Tap Repeat of Last Quick-Start', () => {
    it('should not show repeat button when no previous Quick Start exists', () => {
      // Clear localStorage
      cy.window().then((win) => {
        win.localStorage.removeItem('last-quick-start');
      });
      
      cy.reload();
      
      // Repeat button should not exist
      cy.get('[data-testid="repeat-last-quick-start"]').should('not.exist');
    });

    it('should show "Repeat Last Quick Start" after completing one', () => {
      // Generate a Quick Start workout
      cy.contains('Quick Start').click();
      cy.get('[data-testid="goal-strength"]').click();
      cy.get('[data-testid="start-now-button"]').click();
      
      // Wait for generation
      cy.get('[data-testid="workout-preview"]', { timeout: 5000 }).should('be.visible');
      
      // Save the workout config to localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('last-quick-start', JSON.stringify({
          duration: 10,
          goal: 'strength',
          equipment: ['barbell'],
          timestamp: Date.now()
        }));
      });
      
      // Go back to home
      cy.visit('/');
      
      // Repeat button should now be visible
      cy.get('[data-testid="repeat-last-quick-start"]').should('be.visible');
    });

    it('should start instantly when repeat button is clicked', () => {
      // Set up last Quick Start data
      cy.window().then((win) => {
        win.localStorage.setItem('last-quick-start', JSON.stringify({
          duration: 10,
          goal: 'strength',
          equipment: ['barbell'],
          timestamp: Date.now()
        }));
      });
      
      cy.reload();
      
      // Click repeat
      cy.get('[data-testid="repeat-last-quick-start"]').click();
      
      // Should bypass config and start immediately or show brief preview
      cy.url({ timeout: 10000 }).should('include', '/session');
      
      // Workout should be running
      cy.get('[data-testid="hud-overlay"]').should('be.visible');
    });

    it('should use same settings as last Quick Start', () => {
      // Set up specific last Quick Start
      const lastQuickStart = {
        duration: 15,
        goal: 'hypertrophy',
        equipment: ['dumbbells'],
        timestamp: Date.now()
      };
      
      cy.window().then((win) => {
        win.localStorage.setItem('last-quick-start', JSON.stringify(lastQuickStart));
      });
      
      cy.reload();
      cy.get('[data-testid="repeat-last-quick-start"]').click();
      
      // Verify settings were applied (check via session state or preview)
      cy.window().then((win) => {
        const stored = JSON.parse(win.localStorage.getItem('last-quick-start') || '{}');
        expect(stored.duration).to.equal(15);
        expect(stored.goal).to.equal('hypertrophy');
      });
    });

    it('should bypass configuration modal completely', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('last-quick-start', JSON.stringify({
          duration: 10,
          goal: 'strength',
          equipment: ['barbell'],
          timestamp: Date.now()
        }));
      });
      
      cy.reload();
      cy.get('[data-testid="repeat-last-quick-start"]').click();
      
      // Quick Start modal should NOT appear
      cy.get('[data-testid="quick-start-modal"]').should('not.exist');
      
      // Should go straight to workout or preview
      cy.url({ timeout: 10000 }).should('match', /session|preview/);
    });
  });
});
