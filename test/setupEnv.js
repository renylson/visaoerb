// Carrega .env.test antes de qualquer módulo (incluindo db.js) ler process.env,
// para que os testes de integração usem o Postgres de teste, nunca o de
// desenvolvimento.
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.test'), override: true });
