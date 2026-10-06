import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, version: env.APP_VERSION },
    `🌾 CropSage AI server listening on port ${env.PORT} (0.0.0.0)`,
  );
});

// Configure 90-second request timeout (§18.13)
server.requestTimeout = 90_000;
server.headersTimeout = 95_000;

// Graceful shutdown (§18.14)
function handleShutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown signal received. Closing HTTP server...');

  server.close(err => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server shutdown');
      process.exit(1);
    }
    logger.info('HTTP server closed. Exiting process cleanly.');
    process.exit(0);
  });

  // Force exit after 20 seconds maximum
  setTimeout(() => {
    logger.error('Shutdown timeout reached (20s). Forcing process exit.');
    process.exit(1);
  }, 20_000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
