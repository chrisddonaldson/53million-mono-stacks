/// <reference types="cypress" />

/**
 * E2E Tests for Guided Coaching Flow User Stories
 * - GC-1: Launch a Guided Session
 * - GC-2: View Current Exercise Information
 * - GC-3: See Upcoming Exercise
 * - GC-4: Wizard-Style Step Flow
 * - GC-5: Pause / Resume / Skip Controls
 */

describe('Guided Coaching Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.disableAudio();
  });

  const startWorkout = () => {
    cy.visit('/library');
    cy.get('[data-testid="workout-card"]').first().click();
    cy.contains('Start Guided Coaching').click();
    cy.get('[data-testid="start-button"]').click();
  };

  describe('GC-1: Launch a Guided Session', () => {
    it('should show pre-start screen with all required information', () => {
      cy.visit('/library');
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Pre-start screen elements
      cy.get('[data-testid="workout-name"]').should('be.visible');
      cy.get('[data-testid="workout-duration"]').should('be.visible');
      cy.get('[data-testid="workout-equipment"]').should('be.visible');
      cy.get('[data-testid="progression-level"]').should('be.visible');
    });

    it('should support countdown or "Tap to Start"', () => {
      cy.visit('/library');
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Should have start button or countdown
      cy.get('[data-testid="start-button"]').should('be.visible');
    });

    it('should load WebGPU scene, HUD, and audio engines', () => {
      startWorkout();
      
      // WebGPU canvas loaded
      cy.get('canvas').should('be.visible');
      
      // HUD overlay visible
      cy.get('[data-testid="hud-overlay"]').should('be.visible');
      
      // Audio engine initialized (checking through window object)
      cy.window().its('speechSynthesis').should('exist');
    });
  });

  describe('GC-2: View Current Exercise Information', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should display current exercise name', () => {
      cy.get('[data-testid="current-exercise-name"]').should('be.visible');
    });

    it('should display reps or time information', () => {
      cy.get('[data-testid="current-exercise-reps"]')
        .should('be.visible')
        .and('not.be.empty');
    });

    it('should display load information when applicable', () => {
      cy.get('[data-testid="current-exercise-load"]').should('exist');
    });

    it('should display short coaching cue', () => {
      cy.get('[data-testid="current-exercise-cue"]').should('be.visible');
    });

    it('should show tempo information if applicable', () => {
      // May not be visible for all exercises
      cy.get('[data-testid="current-exercise-tempo"]').should('exist');
    });

    it('should sync HUD with diegetic visuals', () => {
      // WebGPU visuals should pulse in sync
      cy.get('canvas').should('be.visible');
      cy.get('[data-testid="hud-overlay"]').should('be.visible');
      
      // Both should be displaying simultaneously
      cy.get('[data-testid="current-exercise-name"]').should('be.visible');
    });
  });

  describe('GC-3: See Upcoming Exercise', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should show "Next" exercise preview in HUD', () => {
      cy.get('[data-testid="next-exercise"]').should('be.visible');
      cy.get('[data-testid="next-exercise-name"]').should('not.be.empty');
    });

    it('should show 3-second transition cue before next exercise', () => {
      // Fast-forward to end of current step
      cy.wait(2000);
      
      cy.get('[data-testid="transition-cue"]').should('be.visible');
    });

    it('should show "Last exercise" on final step', () => {
      // This requires navigating to the last exercise
      // We can skip to near the end or use a short test workout
      cy.get('[data-testid="skip-button"]').click({ multiple: true });
      
      cy.get('[data-testid="next-exercise"]').should('contain', 'Last exercise');
    });
  });

  describe('GC-4: Wizard-Style Step Flow', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should follow setup → work → rest → work → rest → summary flow', () => {
      // Verify we start in setup or work phase
      cy.get('[data-testid="current-step-type"]')
        .should('exist')
        .invoke('text')
        .should('match', /setup|work/i);
    });

    it('should show smooth animated transitions between steps', () => {
      // Wait for a transition
      cy.wait(3000);
      
      // Transition animation should occur (check for transition class)
      cy.get('[data-testid="step-transition"]').should('exist');
    });

    it('should support next/previous step navigation', () => {
      // Forward button
      cy.get('[data-testid="next-step-button"]').should('be.visible').click();
      
      // Should advance to next step
      cy.wait(500);
      
      // Back button
      cy.get('[data-testid="previous-step-button"]').should('be.visible').click();
      
      // Should go back to previous step
    });

    it('should maintain step sequence integrity', () => {
      // Track current step index
      cy.get('[data-testid="step-index"]')
        .invoke('text')
        .then((initialStep) => {
          cy.get('[data-testid="next-step-button"]').click();
          
          cy.get('[data-testid="step-index"]')
            .invoke('text')
            .should('not.equal', initialStep);
        });
    });
  });

  describe('GC-5: Pause / Resume / Skip Controls', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should pause the workout when pause button is clicked', () => {
      cy.get('[data-testid="pause-button"]').click();
      
      // Pause modal should appear
      cy.get('[data-testid="pause-modal"]').should('be.visible');
      
      // Timer should be frozen
      cy.get('[data-testid="timer"]')
        .invoke('text')
        .then((pausedTime) => {
          cy.wait(1000);
          cy.get('[data-testid="timer"]')
            .invoke('text')
            .should('equal', pausedTime);
        });
    });

    it('should freeze timers and visuals when paused', () => {
      cy.get('[data-testid="pause-button"]').click();
      
      // Visuals should stop animating (canvas should still be visible but frozen)
      cy.get('canvas').should('be.visible');
      
      // HUD should show paused state
      cy.get('[data-testid="hud-overlay"]').should('have.class', 'paused');
    });

    it('should resume from exact state when resume is clicked', () => {
      // Record current state
      cy.get('[data-testid="current-exercise-name"]')
        .invoke('text')
        .then((exerciseName) => {
          // Pause
          cy.get('[data-testid="pause-button"]').click();
          cy.wait(1000);
          
          // Resume
          cy.get('[data-testid="resume-button"]').click();
          
          // Should be same exercise
          cy.get('[data-testid="current-exercise-name"]')
            .invoke('text')
            .should('equal', exerciseName);
          
          // Timer should continue from paused point
          cy.get('[data-testid="timer"]').should('be.visible');
        });
    });

    it('should support skip to next step', () => {
      cy.get('[data-testid="current-exercise-name"]')
        .invoke('text')
        .then((currentExercise) => {
          cy.get('[data-testid="skip-button"]').click();
          
          // Should move to different step
          cy.get('[data-testid="current-exercise-name"]')
            .invoke('text')
            .should('not.equal', currentExercise);
        });
    });

    it('should support going back to previous step', () => {
      // Skip forward first
      cy.get('[data-testid="skip-button"]').click();
      cy.wait(500);
      
      cy.get('[data-testid="current-exercise-name"]')
        .invoke('text')
        .then((currentExercise) => {
          cy.get('[data-testid="previous-step-button"]').click();
          
          // Should move to different step
          cy.get('[data-testid="current-exercise-name"]')
            .invoke('text')
            .should('not.equal', currentExercise);
        });
    });

    it('should show mini toolbar with controls', () => {
      // Verify toolbar exists
      cy.get('[data-testid="toolbar"]').should('be.visible');
      
      // Verify it contains play/pause
      cy.get('[data-testid="pause-button"]').should('be.visible');
      
      // Verify it contains back/forward
      cy.get('[data-testid="previous-step-button"]').should('be.visible');
      cy.get('[data-testid="skip-button"]').should('be.visible');
    });

    it('should display step completion minimap in toolbar', () => {
      cy.get('[data-testid="step-minimap"]').should('be.visible');
      
      // Should show progress indicators
      cy.get('[data-testid="step-minimap-item"]')
        .should('have.length.greaterThan', 0);
    });
  });
});
