import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./db.js";
import { initRedis } from "./redis.js";
import apiRoutes from "./routes/index.js";

installGlobals();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(process.cwd(), "build");
const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

app.use(cors());
app.use(compression());
app.disable("x-powered-by");

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

app.use(express.static("build/client", { maxAge: "1h" }));
app.use(express.json());
app.use(morgan("tiny"));

await connectDB();
await initRedis();

app.use("/api", apiRoutes);

const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./../build/server/index.js"),
});

app.all("*", remixHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 服务器运行在 http://localhost:${port}`);
});
