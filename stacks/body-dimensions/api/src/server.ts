import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import pino from 'pino';
import { connectDB } from './db.js';
import router from './routes.js';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

const app = new Koa();

// Middleware
app.use(cors());
app.use(bodyParser());

// Centralized Error Handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    logger.error(err);
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    };
  }
});

// Logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
  });
};

start();
