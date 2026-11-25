import { env } from '../config/env.js';

/**
 * Tiny levelled logger. Output goes to stdout, so it shows in the console and in the
 * HTML report's "stdout" section of each test. Level comes from LOG_LEVEL in `.env`.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const activeLevel = LEVELS[env.logLevel] || LEVELS.info;

function write(level, scope, message) {
  if (LEVELS[level] < activeLevel) {
    return;
  }
  const time = new Date().toISOString().slice(11, 23);
  const line = `[${time}] ${level.toUpperCase().padEnd(5)} [${scope}] ${message}`;
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(scope) {
  return {
    debug: (message) => write('debug', scope, message),
    info: (message) => write('info', scope, message),
    warn: (message) => write('warn', scope, message),
    error: (message) => write('error', scope, message),
  };
}
