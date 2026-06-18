import dotenv from "dotenv";
dotenv.config();

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import compression from "compression";
import session from "express-session";
import MongoStore from "connect-mongo";
import { RedisStore } from "connect-redis";
import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import { connectToMongo, getRedisClient } from "~/lib/db";
import { authRouter } from "~/routes/api/auth";
import { vehiclesRouter } from "~/routes/api/vehicles";
import { requireUser } from "~/middleware/auth";

installGlobals();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, "..", "build");
const isDev = process.env.NODE_ENV !== "production";

async function startServer() {
  const mongoConnected = await connectToMongo();
  const redisClient = getRedisClient();

  const app = express();

  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let store;
  if (mongoConnected && process.env.MONGODB_URI) {
    store = new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      mongoOptions: {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      },
    });
  } else if (redisClient) {
    store = new RedisStore({ client: redisClient as any });
  } else {
    console.warn("⚠️  会话存储将使用内存存储（仅用于开发）");
    store = undefined;
  }

  const sessionConfig = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDev,
      sameSite: "lax" as const,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  };

  if (store) {
    (sessionConfig as any).store = store;
  }

  app.use(session(sessionConfig));

  app.use("/api/auth", authRouter);
  app.use("/api/vehicles", requireUser, vehiclesRouter);

  app.use(
    "/build",
    express.static("public/build", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("public", { maxAge: "1h" }));

  const build = (await import("../build/index.js" as any)) as any;

  app.all(
    "*",
    createRequestHandler({
      build: isDev ? () => import("../build/index.js" as any) : build,
      mode: isDev ? "development" : "production",
      getLoadContext(req) {
        return { user: req.user, session: req.session };
      },
    })
  );

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 服务器运行在 http://localhost:${port}`);
    if (isDev && process.env.REMIX_DEV_ORIGIN) {
      broadcastDevReady(build);
    }
  });
}

startServer().catch((err) => {
  console.error("服务器启动失败:", err);
  process.exit(1);
});
