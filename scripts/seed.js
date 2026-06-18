import { initSchema } from '../src/lib/server/db/schema.js';
import { seedMockData } from '../src/lib/server/services/dataMergeService.js';

console.log('Initializing database schema...');
initSchema();

console.log('Seeding mock data...');
seedMockData();

console.log('Done! Mock data has been inserted.');
