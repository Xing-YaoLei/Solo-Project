import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./app/utils/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, "build");

const app = express();
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static("public", { maxAge: "1h" }));

app.use("/api", (await import("./app/api/index.js")).default);

app.all(
  "*",
  createRequestHandler({
    build: await import(BUILD_DIR),
    getLoadContext: () => ({}),
  })
);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

export default app;
