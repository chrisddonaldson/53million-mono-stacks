import { Schema, model } from 'mongoose';

const SkinfoldSchema = new Schema({
  site: { type: String, required: true },
  mm: { type: Number, required: true }
}, { _id: false });

const CircumferenceSchema = new Schema({
  site: { type: String, required: true },
  cm: { type: Number, required: true }
}, { _id: false });

const EntrySchema = new Schema({
  measuredAt: { type: Date, default: Date.now, index: true },
  heightCm: Number,
  weightKg: Number,
  bodyFatPercent: Number,
  skinfolds: [SkinfoldSchema],
  circumferences: [CircumferenceSchema],
  notes: String
}, {
  timestamps: true
});

// Compound index for time-based queries
EntrySchema.index({ measuredAt: -1 });

export const Entry = model('Entry', EntrySchema);
