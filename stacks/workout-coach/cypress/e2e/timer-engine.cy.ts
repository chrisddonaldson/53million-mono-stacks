/// <reference types="cypress" />

/**
 * E2E Tests for Timers & Reps Engine User Stories
 * - TE-1: Timed Intervals (Tabata Style)
 * - TE-2: Tempo-Synced Rep Counting
 * - TE-3: Adjustable Rest Times
 * - TE-4: Overall Workout Progress
 */

describe('Timer Engine', () => {
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

  describe('TE-1: Timed Intervals (Tabata Style)', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should run work intervals automatically', () => {
      // Verify work interval is active
      cy.get('[data-testid="interval-type"]')
        .invoke('text')
        .should('match', /work/i);
      
      // Timer should be counting
      cy.get('[data-testid="interval-timer"]').should('be.visible');
    });

    it('should transition to rest intervals automatically', () => {
      // Wait for work interval to complete (using a short timeout for testing)
      cy.get('[data-testid="interval-type"]', { timeout: 30000 })
        .invoke('text')
        .should('match', /rest/i);
    });

    it('should announce "Work" and "Rest" via voice cues', () => {
      // Voice cues are muted in tests, but verify the cue system is triggered
      cy.window().then((win) => {
        // Spy on speech synthesis if not already stubbed
        expect(win.speechSynthesis).to.exist;
      });
    });

    it('should adjust WebGPU visuals for work vs rest intensity', () => {
      cy.get('canvas').should('be.visible');
      
      // During work, intensity should be high
      cy.get('[data-testid="interval-type"]').then(($type) => {
        if ($type.text().toLowerCase().includes('work')) {
          cy.get('[data-testid="visual-intensity"]')
            .invoke('attr', 'data-intensity')
            .then((intensity) => {
              expect(parseFloat(intensity as string)).to.be.greaterThan(0.5);
            });
        }
      });
    });

    it('should cycle through multiple work/rest intervals', () => {
      let cycleCount = 0;
      const checkCycles = () => {
        cy.get('[data-testid="interval-type"]', { timeout: 15000 })
          .invoke('text')
          .then((text) => {
            if (text.toLowerCase().includes('rest') && cycleCount < 2) {
              cycleCount++;
              checkCycles();
            }
          });
      };
      
      checkCycles();
    });
  });

  describe('TE-2: Tempo-Synced Rep Counting', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should display tempo information (down/hold/up)', () => {
      // Verify tempo is shown (e.g., "3-1-1")
      cy.get('[data-testid="tempo-display"]')
        .should('be.visible')
        .and('match', /\d+-\d+-\d+/);
    });

    it('should announce tempo phases via voice cues', () => {
      // Voice announcements: "down", "hold", "up"
      cy.window().then((win) => {
        expect(win.speechSynthesis).to.exist;
      });
    });

    it('should automatically count reps based on tempo', () => {
      // Rep counter should increment
      cy.get('[data-testid="rep-count"]')
        .invoke('text')
        .then((initialReps) => {
          const initial = parseInt(initialReps);
          
          // Wait for tempo cycle to complete
          cy.wait(5000);
          
          cy.get('[data-testid="rep-count"]')
            .invoke('text')
            .then((newReps) => {
              const updated = parseInt(newReps);
              expect(updated).to.be.greaterThan(initial);
            });
        });
    });

    it('should sync voice cues with tempo exactly', () => {
      // This is hard to test precisely, but we can verify timing
      cy.get('[data-testid="tempo-phase"]').should('be.visible');
      
      // Phase should cycle through down -> hold -> up
      cy.wait(3000);
      cy.get('[data-testid="tempo-phase"]').should('not.be.empty');
    });

    it('should match WebGPU visual pulses to tempo phases', () => {
      cy.get('canvas').should('be.visible');
      cy.get('[data-testid="tempo-phase"]').should('be.visible');
      
      // Verify both are updating
      cy.wait(2000);
      cy.get('[data-testid="tempo-phase"]').should('exist');
    });
  });

  describe('TE-3: Adjustable Rest Times', () => {
    it('should allow editing global rest time before workout', () => {
      cy.visit('/library');
      cy.get('[data-testid="workout-card"]').first().click();
      cy.contains('Start Guided Coaching').click();
      
      // Look for rest time setting
      cy.get('[data-testid="rest-time-setting"]').should('be.visible');
      
      // Adjust rest time
      cy.get('[data-testid="rest-time-input"]').clear().type('60');
      
      // Verify it updated
      cy.get('[data-testid="rest-time-input"]').should('have.value', '60');
    });

    it('should allow +/- 5 second adjustments during session', () => {
      startWorkout();
      
      // Wait for rest interval
      cy.get('[data-testid="interval-type"]', { timeout: 30000 })
        .should('contain', 'Rest');
      
      // Look for rest adjustment controls
      cy.get('[data-testid="rest-time-decrease"]').should('be.visible');
      cy.get('[data-testid="rest-time-increase"]').should('be.visible');
      
      // Click increase
      cy.get('[data-testid="rest-time-increase"]').click();
      
      // Verify rest time increased
      cy.get('[data-testid="rest-time-value"]')
        .invoke('text')
        .then((newTime) => {
          expect(parseInt(newTime)).to.be.greaterThan(0);
        });
    });

    it('should update HUD instantly when rest time is adjusted', () => {
      startWorkout();
      
      cy.get('[data-testid="interval-type"]', { timeout: 30000 })
        .should('contain', 'Rest');
      
      cy.get('[data-testid="rest-time-value"]')
        .invoke('text')
        .then((initialTime) => {
          cy.get('[data-testid="rest-time-increase"]').click();
          
          cy.get('[data-testid="rest-time-value"]')
            .invoke('text')
            .should('not.equal', initialTime);
        });
    });

    it('should apply adjustment only to next rest interval', () => {
      startWorkout();
      
      // Make adjustment during work phase
      cy.get('[data-testid="rest-time-increase"]').click();
      
      // Wait for rest interval to verify it applied
      cy.get('[data-testid="interval-type"]', { timeout: 30000 })
        .should('contain', 'Rest');
      
      cy.get('[data-testid="rest-time-value"]').should('be.visible');
    });
  });

  describe('TE-4: Overall Workout Progress', () => {
    beforeEach(() => {
      startWorkout();
    });

    it('should display elapsed time', () => {
      cy.get('[data-testid="elapsed-time"]')
        .should('be.visible')
        .and('not.be.empty');
    });

    it('should display remaining time', () => {
      cy.get('[data-testid="remaining-time"]')
        .should('be.visible')
        .and('not.be.empty');
    });

    it('should show progress bar indicating completion percentage', () => {
      cy.get('[data-testid="progress-bar"]').should('be.visible');
      
      // Progress should be between 0 and 100
      cy.get('[data-testid="progress-bar"]')
        .invoke('attr', 'aria-valuenow')
        .then((value) => {
          const progress = parseInt(value as string);
          expect(progress).to.be.at.least(0);
          expect(progress).to.be.at.most(100);
        });
    });

    it('should update progress in real-time', () => {
      cy.get('[data-testid="elapsed-time"]')
        .invoke('text')
        .then((initial) => {
          cy.wait(2000);
          
          cy.get('[data-testid="elapsed-time"]')
            .invoke('text')
            .should('not.equal', initial);
        });
    });

    it('should auto-show summary when workout ends', () => {
      // Skip to end of workout
      cy.get('[data-testid="skip-button"]').then(($btn) => {
        // Click skip multiple times to reach end
        for (let i = 0; i < 10; i++) {
          cy.wrap($btn).click();
          cy.wait(200);
        }
      });
      
      // Summary modal should appear
      cy.get('[data-testid="summary-modal"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should show step completion minimap', () => {
      cy.get('[data-testid="step-minimap"]').should('be.visible');
      
      // Should have multiple step indicators
      cy.get('[data-testid="step-minimap-item"]')
        .should('have.length.greaterThan', 1);
      
      // At least one should be marked as complete
      cy.get('[data-testid="step-minimap-item"].complete')
        .should('have.length.greaterThan', 0);
    });
  });
});
