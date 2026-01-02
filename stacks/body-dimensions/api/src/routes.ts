import Router from 'koa-router';
import { z } from 'zod';
import { Entry } from './models/Entry.js';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });
const router = new Router();

const EntrySchema = z.object({
  measuredAt: z.string().datetime().optional(),
  heightCm: z.number().min(50).max(300).nullable().optional(),
  weightKg: z.number().min(20).max(500).nullable().optional(),
  bodyFatPercent: z.number().min(0).max(75).nullable().optional(),
  skinfolds: z.array(z.object({
    site: z.string(),
    mm: z.number().min(0).max(200)
  })).optional(),
  circumferences: z.array(z.object({
    site: z.string(),
    cm: z.number().min(0).max(300)
  })).optional(),
  notes: z.string().nullable().optional()
});

// Middleware for validation
const validate = (schema: z.ZodSchema) => async (ctx: any, next: any) => {
  try {
    ctx.request.body = schema.parse(ctx.request.body);
    await next();
  } catch (err: any) {
    ctx.status = 400;
    ctx.body = {
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors
    };
  }
};

router.get('/entries', async (ctx) => {
  const { from, to, limit = 50 } = ctx.query;
  const filter: any = {};
  if (from || to) {
    filter.measuredAt = {};
    if (from) filter.measuredAt.$gte = new Date(from as string);
    if (to) filter.measuredAt.$lte = new Date(to as string);
  }
  
  const entries = await Entry.find(filter)
    .sort({ measuredAt: -1 })
    .limit(Number(limit));
    
  ctx.body = entries;
});

router.get('/entries/latest', async (ctx) => {
  const latest = await Entry.findOne().sort({ measuredAt: -1 });
  if (!latest) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'No entries found' };
    return;
  }
  
  // Basic trend calculation could go here or in a separate reporting endpoint
  ctx.body = { entry: latest };
});

router.post('/entries', validate(EntrySchema), async (ctx) => {
  try {
    const entry = new Entry(ctx.request.body as any);
    await entry.save();
    logger.info({ entryId: (entry as any)._id }, 'Created new entry');
    ctx.status = 201;
    ctx.body = entry;
  } catch (err: any) {
    logger.error(err, 'Failed to create entry');
    ctx.status = 500;
    ctx.body = { error: 'INTERNAL_ERROR', message: err.message };
  }
});

router.patch('/entries/:id', validate(EntrySchema.partial()), async (ctx) => {
  const entry = await Entry.findByIdAndUpdate(ctx.params.id, ctx.request.body as any, { new: true });
  if (!entry) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'Entry not found' };
    return;
  }
  logger.info({ entryId: (entry as any)._id }, 'Updated entry');
  ctx.body = entry;
});

router.delete('/entries/:id', async (ctx) => {
  const entry = await Entry.findByIdAndDelete(ctx.params.id);
  if (!entry) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'Entry not found' };
    return;
  }
  logger.info({ entryId: (entry as any)._id }, 'Deleted entry');
  ctx.status = 204;
});

// Reporting endpoint
router.get('/reports/trends', async (ctx) => {
  const { period = 'daily' } = ctx.query;
  
  // Aggregation pipeline for Min/Max/Avg
  const entries = await Entry.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { 
            format: period === 'daily' ? "%Y-%m-%d" : "%G-%V", 
            date: "$measuredAt" 
          }
        },
        minWeight: { $min: "$weightKg" },
        maxWeight: { $max: "$weightKg" },
        avgWeight: { $avg: "$weightKg" },
        minBF: { $min: "$bodyFatPercent" },
        maxBF: { $max: "$bodyFatPercent" },
        avgBF: { $avg: "$bodyFatPercent" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  ctx.body = entries;
});

export default router;
