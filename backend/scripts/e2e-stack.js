// Boots a throwaway stack for end-to-end tests: in-memory MongoDB, demo seed,
// then the API on E2E_API_PORT (default 5055). No local MongoDB or keys needed.
const { spawn } = require('child_process');
const path = require('path');
// Use the backend's package cache for the MongoDB binary regardless of the
// directory this script is launched from (Playwright runs it from frontend/).
process.env.MONGOMS_DOWNLOAD_DIR =
  process.env.MONGOMS_DOWNLOAD_DIR || path.join(__dirname, '..', 'node_modules', '.cache', 'mongodb-memory-server');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  const uri = `${mongo.getUri()}scrapmate-e2e`;
  // Never touches your real database or port from backend/.env.
  process.env.MONGODB_URI = uri;
  process.env.PORT = process.env.E2E_API_PORT || '5055';
  process.env.NODE_ENV = 'development';
  process.env.CLIENT_URL = process.env.E2E_CLIENT_URL || 'http://localhost:5199';
  process.env.AUTH_RATE_LIMIT = '1000';
  process.env.LOG_LEVEL = 'warn';
  // Async on purpose: blocking this process would stall mongod's output pipe.
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'seed', 'seed.js')], { env: process.env, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exited with ${code}`))));
  });
  require('../src/server');
  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
