import kafka from "./kafka.js";

class KafkaProducer {
  constructor() {
    this.producer = kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("Kafka producer connected");
    } catch (error) {
      console.error("Failed to connect Kafka producer:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log("Kafka producer disconnected");
    }
  }

  async sendPathData(pathData) {
    if (!this.isConnected) {
      throw new Error("Producer is not connected");
    }

    try {
      await this.producer.send({
        topic: "results_topic",
        messages: [
          {
            key: `path-${Date.now()}`,
            value: JSON.stringify(pathData),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log("Path data sent:", pathData);
    } catch (error) {
      console.error("Error sending path data:", error);
      throw error;
    }
  }

  // Generate random grid and path coordinates for demonstration
  generateRandomPathData() {
    const m = Math.floor(Math.random() * 8) + 3; // Grid height 3-10
    const n = Math.floor(Math.random() * 8) + 3; // Grid width 3-10
    const x = Math.floor(Math.random() * m); // Current x position
    const y = Math.floor(Math.random() * n); // Current y position

    // Calculate the number of unique paths from (x,y) to (m-1,n-1)
    const result = this.calculateUniquePaths(x, y, m, n);

    return {
      x,
      y,
      m,
      n,
      result,
      timestamp: Date.now(),
    };
  }

  // Dynamic programming solution for unique paths
  calculateUniquePaths(startX, startY, m, n) {
    if (startX >= m || startY >= n) return 0;
    if (startX === m - 1 && startY === n - 1) return 1;

    const dp = Array(m)
      .fill()
      .map(() => Array(n).fill(0));

    // Fill the last row and column
    dp[m - 1][n - 1] = 1;

    // Fill from bottom-right to top-left
    for (let i = m - 1; i >= startX; i--) {
      for (let j = n - 1; j >= startY; j--) {
        if (i === m - 1 && j === n - 1) continue;

        dp[i][j] = 0;
        if (i + 1 < m) dp[i][j] += dp[i + 1][j];
        if (j + 1 < n) dp[i][j] += dp[i][j + 1];
      }
    }

    return dp[startX][startY];
  }

  // Start producing data at regular intervals
  startProducing(intervalMs = 2000) {
    this.producerInterval = setInterval(async () => {
      try {
        const pathData = this.generateRandomPathData();
        await this.sendPathData(pathData);
      } catch (error) {
        console.error("Error producing path data:", error);
      }
    }, intervalMs);

    console.log(`Started producing path data every ${intervalMs}ms`);
  }

  stopProducing() {
    if (this.producerInterval) {
      clearInterval(this.producerInterval);
      this.producerInterval = null;
      console.log("Stopped producing path data");
    }
  }
}

export { KafkaProducer };
