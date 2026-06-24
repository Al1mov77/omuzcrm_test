import { defineConfig } from '@prisma/config';
import * as fs from 'fs';
import * as path from 'path';

let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is not set, try to read it from .env manually
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

// Since the Prisma schema uses SQLite provider, the URL must start with 'file:' or 'sqlite:'.
// In production (Railway), DATABASE_URL is often set automatically to a PostgreSQL connection string.
// We override it to SQLite local file to ensure compatibility.
if (!databaseUrl || (!databaseUrl.startsWith('file:') && !databaseUrl.startsWith('sqlite:'))) {
  databaseUrl = 'file:./dev.db';
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
