import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleImportProducts } from "./routes/import-products";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Import products endpoint
  app.post("/api/import-products", handleImportProducts);

  // SPA fallback route - serve index.html for all non-API routes
  // This must be AFTER all API routes
  app.get("*", (_req, res) => {
    res.sendFile(new URL("../client/index.html", import.meta.url).pathname);
  });

  return app;
}
