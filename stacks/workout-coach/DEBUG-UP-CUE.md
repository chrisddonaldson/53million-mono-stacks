# Debug Test Guide

## How to Test

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Start a workout** with tempo (e.g., wrist workout)
3. **Click START** button
4. **Watch the console logs** during the first 2 reps

## What to Look For

### Expected Log Sequence for Rep 1:

```
[UnifiedTimingEngine] Phase complete check: {newPhase: "eccentric", currentRep: 1, ...}
[UnifiedTimingEngine] ✅ EMITTING CUE: phase=eccentric, rep=1
[SessionEngine] Forwarding cue: {type: "tempo", phase: "eccentric", rep: 1}
[GuidedSession] Received cue: {type: "tempo", phase: "eccentric", rep: 1}
[GuidedSession] Calling voiceCoach.announceTempo(eccentric, 1)
[VoiceCoach] announceTempo: phase=eccentric, rep=1, text="1"
```

Then after eccentric phase completes:

```
[UnifiedTimingEngine] Phase complete check: {newPhase: "concentric", currentRep: 1, ...}
[UnifiedTimingEngine] ✅ EMITTING CUE: phase=concentric, rep=1
[SessionEngine] Forwarding cue: {type: "tempo", phase: "concentric", rep: 1}
[GuidedSession] Received cue: {type: "tempo", phase: "concentric", rep: 1}
[GuidedSession] Calling voiceCoach.announceTempo(concentric, 1)
[VoiceCoach] announceTempo: phase=concentric, rep=1, text="Up"  <-- THIS SHOULD HAPPEN
```

### If "Up" is NOT being said, check:

1. **Is the cue being emitted?**
   - Look for `[UnifiedTimingEngine] ✅ EMITTING CUE: phase=concentric`
   - If NO: The timing engine logic is wrong
   - If YES: Continue to step 2

2. **Is the cue being forwarded?**
   - Look for `[SessionEngine] Forwarding cue: {type: "tempo", phase: "concentric"}`
   - If NO: SessionEngine event handling is broken
   - If YES: Continue to step 3

3. **Is GuidedSession receiving it?**
   - Look for `[GuidedSession] Received cue: {type: "tempo", phase: "concentric"}`
   - If NO: Event listener not connected
   - If YES: Continue to step 4

4. **Is voiceCoach being called?**
   - Look for `[GuidedSession] Calling voiceCoach.announceTempo(concentric, 1)`
   - If NO: Check volume setting or cue.type check
   - If YES: Continue to step 5

5. **Is VoiceCoach processing it?**
   - Look for `[VoiceCoach] announceTempo: phase=concentric, rep=1, text="Up"`
   - If NO: VoiceCoach logic is broken
   - If text is NOT "Up": Check textMap in VoiceCoach

6. **Is TTS speaking?**
   - Check for TTS errors in console
   - Look for "not-allowed" errors
   - Check if unlock was called: `[TTSEngine] Speech Synthesis unlocked`

## Common Issues

### Issue: Cue skipped with "⏭️ SKIPPING CUE (duplicate)"
**Cause:** `lastEmittedPhase` is not being reset properly between phases
**Fix:** Check the phase comparison logic in UnifiedTimingEngine

### Issue: No cues after first rep
**Cause:** TTS not unlocked or "not-allowed" error
**Fix:** Ensure `voiceCoach.unlock()` is called in handleStart

### Issue: Only "Down" cues, no "Up" cues
**Cause:** Phase names don't match or cue emission logic wrong
**Fix:** Check that phases array has "concentric" phase

## Quick Checks

Run these in browser console:

```javascript
// Check if TTS is available
window.speechSynthesis

// Check current volume
settingsStore.audio.masterVolume

// Manually test TTS
const utterance = new SpeechSynthesisUtterance('Up');
window.speechSynthesis.speak(utterance);
```
