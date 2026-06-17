"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("./src/generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
async function test() {
    try {
        console.log('Testing Prisma connection...');
        const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
        const prisma = new client_1.PrismaClient({ adapter });
        const count = await prisma.elder.count();
        console.log('Elder count:', count);
        const elders = await prisma.elder.findMany({ take: 2 });
        console.log('Sample elders:', elders.map(e => e.name));
        await prisma.$disconnect();
        console.log('Prisma test PASSED');
    }
    catch (e) {
        console.error('Prisma test FAILED:', e.message);
        console.error(e.stack);
    }
}
test();
//# sourceMappingURL=test-prisma.js.map