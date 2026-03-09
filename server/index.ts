import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  const staticPath = path.resolve(__dirname, "..", "dist", "public");
  console.log(`[Server] Serving static files from: ${staticPath}`);

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.use(express.static(staticPath));

  // Catch-all route: Serve index.html for any request that doesn't match a static file or health check
  app.use((req, res) => {
    console.log(`[Server] Serving index.html for path: ${req.url}`);
    const indexPath = path.join(staticPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("[Server] Error sending index.html:", err);
        if (!res.headersSent) {
          res.status(500).send("Internal Server Error - index.html missing");
        }
      }
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[Server] Listening at http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error("[Server] Critical Failure:", error);
});
