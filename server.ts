import { createRequestHandler } from "@remix-run/express";
import { type ServerBuild } from "@remix-run/node";
import compression from "compression";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./app/utils/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, "build");

const app = express();
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));
app.use(express.static("public", { maxAge: "1h" }));

app.use("/api", (await import("./app/api/index.js")).default);

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
          appType: "custom",
        })
      );

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
}

function getBuild(): Promise<ServerBuild> {
  if (viteDevServer) {
    return viteDevServer.ssrLoadModule(
      "virtual:remix/server-build"
    ) as Promise<ServerBuild>;
  }
  return import(BUILD_DIR) as Promise<ServerBuild>;
}

app.all(
  "*",
  createRequestHandler({
    build: getBuild,
    mode: process.env.NODE_ENV,
    getLoadContext: () => ({}),
  })
);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `🚀 试听预约结算台已启动 → http://localhost:${PORT}`
    );
    console.log(
      `   └ API 挂载: /api/appointments, /api/timeslots, /api/capacity, /api/conflicts, /api/attendance, /api/analytics, /api/upload`
    );
  });
});

export default app;
