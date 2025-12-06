/// <reference types="cypress" />

/**
 * E2E Tests for System Start & Navigation User Stories
 * - SYS-1: Start Menu with "Start Workout"
 * - SYS-2: Workout Selection Menu
 * - SYS-3: Start Selected Workout Immediately
 */

describe('System Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.disableAudio();
  });

  describe('SYS-1: Start Menu with "Start Workout"', () => {
    it('should display start screen with all required elements', () => {
      // Verify Start Workout button exists
      cy.contains('Start Workout').should('be.visible');
      
      // Verify Quick Start button exists
      cy.contains('Quick Start').should('be.visible');
      
      // Verify Workout Library link exists
      cy.contains('Workout Library').should('be.visible');
      
      // Verify Stats link exists
      cy.contains('Stats').should('be.visible');
    });

    it('should navigate to workout selection when Start Workout is clicked', () => {
      cy.contains('Start Workout').click();
      
      // Should navigate to library or show workout selection
      cy.url().should('include', '/library');
    });

    it('should display last completed session summary if available', () => {
      // This test would require seeding session data
      // For now, verify the section exists or shows empty state
      cy.get('[data-testid="last-session"]').should('exist');
    });
  });

  describe('SYS-2: Workout Selection Menu', () => {
    beforeEach(() => {
      cy.visit('/library');
    });

    it('should display grid/list of available workouts', () => {
      // Verify workout cards are visible
      cy.get('[data-testid="workout-card"]').should('have.length.greaterThan', 0);
    });

    it('should show workout metadata (duration, equipment, tags)', () => {
      // Get first workout card
      cy.get('[data-testid="workout-card"]').first().within(() => {
        // Should show duration
        cy.get('[data-testid="workout-duration"]').should('be.visible');
        
        // Should show equipment icons or tags
        cy.get('[data-testid="workout-equipment"]').should('exist');
      });
    });

    it('should open workout detail when tapping a workout', () => {
      cy.get('[data-testid="workout-card"]').first().click();
      
      // Should show detail page or modal
      cy.get('[data-testid="workout-detail"]').should('be.visible');
    });

    it('should filter workouts by tags or categories', () => {
      // If filtering UI exists
      cy.get('[data-testid="filter-strength"]').click();
      
      cy.get('[data-testid="workout-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Strength');
      });
    });
  });

  describe('SYS-3: Start Selected Workout Immediately', () => {
    beforeEach(() => {
      cy.visit('/library');
    });

    it('should show "Start Guided Coaching" button on workout detail', () => {
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').should('be.visible');
    });

    it('should begin pre-start screen when starting workout', () => {
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Should show pre-start screen with countdown or "Tap to Start"
      cy.get('[data-testid="pre-start-screen"]').should('be.visible');
      
      // Should display workout name
      cy.get('[data-testid="workout-name"]').should('be.visible');
      
      // Should display duration
      cy.get('[data-testid="workout-duration"]').should('be.visible');
      
      // Should display equipment needed
      cy.get('[data-testid="workout-equipment"]').should('be.visible');
    });

    it('should load WebGPU scene and HUD when workout starts', () => {
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Start the workout
      cy.get('[data-testid="start-button"]').click();
      
      // Should navigate to session page
      cy.url().should('include', '/session');
      
      // WebGPU canvas should be visible
      cy.get('canvas').should('be.visible');
      
      // HUD should be visible
      cy.get('[data-testid="hud-overlay"]').should('be.visible');
    });

    it('should prompt for missing equipment if required', () => {
      // This would need a workout config that checks equipment
      // Mock scenario where user doesn't have required equipment
      cy.window().then((win) => {
        win.localStorage.setItem('available-equipment', JSON.stringify([]));
      });
      
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Should show equipment prompt
      cy.contains('Required Equipment').should('be.visible');
    });

    it('should support progression level selection before starting', () => {
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Should show progression options
      cy.get('[data-testid="progression-easy"]').should('be.visible');
      cy.get('[data-testid="progression-standard"]').should('be.visible');
      cy.get('[data-testid="progression-hard"]').should('be.visible');
      
      // Select hard mode
      cy.get('[data-testid="progression-hard"]').click();
      
      // Start workout
      cy.get('[data-testid="start-button"]').click();
      
      // Verify session started with hard mode
      cy.url().should('include', '/session');
    });
  });
});
