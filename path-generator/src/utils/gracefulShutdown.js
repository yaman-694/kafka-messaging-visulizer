export function setupGracefulShutdown(server, wss) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    wss.close();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
