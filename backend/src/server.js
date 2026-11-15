import app from './app.js';
import { getServerConfig } from './serverConfig.js';
import { validateStoredData } from './startup/validateStoredData.js';

const { port, host } = getServerConfig();

async function start() {
  try {
    await validateStoredData();
  } catch (error) {
    console.error(`[startup] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  app.listen(port, host, () => {
    console.log(`Backend escuchando en http://${host}:${port}`);
  });
}

start();
