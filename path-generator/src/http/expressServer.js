import express from "express";

export function createExpressServer(PORT) {
  const app = express();

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });

  return server;
}
