import { defineConfig } from '@prisma/config';
import * as fs from 'fs';
import * as path from 'path';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) {
        databaseUrl = match[1];
      }
    }
  } catch (e) {
    console.error('Error reading .env file manually:', e);
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
