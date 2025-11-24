export function setupGracefulShutdown(server, wss, cleanupCallback) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Run cleanup callback if provided
    if (cleanupCallback) {
      try {
        await cleanupCallback();
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }

    wss.close();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
