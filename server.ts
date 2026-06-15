import { createRequestHandler } from "@remix-run/express";
import { type ServerBuild } from "@remix-run/node";
import compression from "compression";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./app/utils/db.js";
import { apiRouter } from "./app/api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

app.use("/api", apiRouter);

type ViteDevServer = Awaited<ReturnType<typeof import("vite")["createServer"]>>;
let viteDevServer: ViteDevServer | undefined;

if (!isProduction) {
  const vite = await import("vite");
  viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(viteDevServer.middlewares);
}

async function resolveBuild(): Promise<ServerBuild> {
  if (viteDevServer) {
    return viteDevServer.ssrLoadModule("virtual:remix/server-build") as Promise<ServerBuild>;
  }
  const buildPath = path.join(__dirname, "build", "server", "build", "index.js");
  return import(buildPath) as Promise<ServerBuild>;
}

app.all(
  "*",
  createRequestHandler({
    build: resolveBuild,
    mode: isProduction ? "production" : "development",
    getLoadContext: () => ({}),
  })
);

const PORT = parseInt(process.env.PORT || "3000", 10);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(``);
    console.log(`  🎯 试听预约结算台已启动`);
    console.log(`  → http://localhost:${PORT}`);
    console.log(``);
    console.log(`  API 路由：`);
    console.log(`    GET  /api/appointments`);
    console.log(`    POST /api/appointments`);
    console.log(`    GET  /api/timeslots`);
    console.log(`    POST /api/timeslots`);
    console.log(`    GET  /api/capacity`);
    console.log(`    GET  /api/conflicts`);
    console.log(`    POST /api/conflicts/:id/forward`);
    console.log(`    POST /api/conflicts/:id/supplement`);
    console.log(`    POST /api/conflicts/:id/resolve`);
    console.log(`    GET  /api/attendance/reminder`);
    console.log(`    POST /api/attendance/checkin`);
    console.log(`    GET  /api/analytics/attendance-rate`);
    console.log(`    GET  /api/analytics/export`);
    console.log(`    POST /api/upload/appointment/:id`);
    console.log(``);
    console.log(`  模式：${isProduction ? "生产" : "开发（Vite HMR）"}`);
    console.log(``);
  });
}

start().catch((err) => {
  console.error("启动失败:", err);
  process.exit(1);
});

export default app;
