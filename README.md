# Path Visualizer - Kafka Messaging System

This project demonstrates real-time communication between a C++ producer and Node.js consumer using Apache Kafka.

## Architecture

- **C++ Producer** (`batch-compute-cpp/`): Computes unique paths in a grid and sends coordinates to Kafka
- **Node.js Consumer** (`path-generator/`): Consumes messages from Kafka and broadcasts them via WebSocket
- **Apache Kafka**: Message broker running in Docker

## Prerequisites

- Docker and Docker Compose
- C++ compiler (g++ or clang++)
- Node.js (v14+)
- Conan (C++ package manager)

## Setup Instructions

### 1. Start Kafka Broker

```bash
# Start Kafka using Docker Compose
docker-compose up -d

# Verify Kafka is running
docker ps
```

### 2. Setup and Build C++ Producer

```bash
cd batch-compute-cpp

# Install dependencies using Conan
conan install . --output-folder=build --build=missing

# Build the project
make

# The executable will be created at: build/Release/path_computer
```

### 3. Setup Node.js Consumer

```bash
cd path-generator

# Install dependencies
npm install
```

## Running the System

### Step 1: Start the Node.js Consumer (Start this first)

```bash
cd path-generator
npm start
```

The server will:
- Start on port 8080
- Connect to Kafka broker at localhost:9092
- Subscribe to topic: `path-coordinates`
- Set up WebSocket server for broadcasting messages

### Step 2: Run the C++ Producer

In a new terminal:

```bash
cd batch-compute-cpp
./build/Release/path_computer
```

The producer will:
- Generate a random grid size (e.g., 5x7)
- Compute unique paths using dynamic programming
- Send each coordinate visited to Kafka topic `path-coordinates`
- Display total unique paths found

## Configuration

### Kafka Configuration

Both producer and consumer use:
- **Broker**: `localhost:9092`
- **Topic**: `path-coordinates`
- **Consumer Group**: `collector-group`

### Changing Kafka Broker

**C++ Producer** (`kafka.h`):
```cpp
KafkaProducer("localhost:9092", "path-coordinates");
```

**Node.js Consumer** (`src/kafka/kafka.js`):
```javascript
brokers: [process.env.KAFKA_BROKER || "localhost:9092"]
```

You can set the environment variable:
```bash
KAFKA_BROKER=your-broker:9092 npm start
```

### Changing Topic Name

If you need to change the topic name, update both files:

1. **C++ Producer** (`main.cpp`):
   ```cpp
   kafkaProducer = new KafkaProducer("localhost:9092", "your-topic-name");
   ```

2. **Node.js Consumer** (`src/kafka/kafkaConsumer.js`):
   ```javascript
   await consumer.subscribe({
     topic: "your-topic-name",
     fromBeginning: false,
   });
   ```

## WebSocket Connection

Connect to WebSocket at: `ws://localhost:8080`

Messages format:
```json
{
  "topic": "path-coordinates",
  "partition": 0,
  "offset": "123",
  "key": null,
  "value": "{\"x\":2,\"y\":3,\"m\":5,\"n\":7}",
  "timestamp": "1700000000000"
}
```

## Troubleshooting

### Kafka Connection Issues

If the consumer can't connect to Kafka:
1. Ensure Docker is running: `docker ps`
2. Check Kafka logs: `docker logs broker`
3. Wait 30 seconds after starting Kafka for it to be fully ready

### Topic Not Found

The topic will be created automatically on first message. If issues persist:
```bash
# Connect to Kafka container
docker exec -it broker bash

# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Create topic manually
kafka-topics.sh --bootstrap-server localhost:9092 --create --topic path-coordinates --partitions 3 --replication-factor 1
```

### C++ Build Issues

If `make` fails:
```bash
cd batch-compute-cpp
rm -rf build
conan install . --output-folder=build --build=missing
make clean
make
```

## Stopping the System

```bash
# Stop Node.js server: Ctrl+C in the terminal

# Stop Kafka
docker-compose down

# Or to remove volumes as well
docker-compose down -v
```

## Development

### Run Node.js in Watch Mode

```bash
cd path-generator
npm run dev
```

### Test Kafka Manually

**Produce a test message:**
```bash
docker exec -it broker kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic path-coordinates
```

**Consume messages:**
```bash
docker exec -it broker kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic path-coordinates \
  --from-beginning
```

## Project Structure

```
path-visualizer/
├── docker-compose.yml           # Kafka broker configuration
├── batch-compute-cpp/           # C++ Producer
│   ├── main.cpp                 # Main application
│   ├── kafka.h                  # Kafka producer wrapper
│   ├── Makefile                 # Build configuration
│   └── conanfile.txt           # C++ dependencies
└── path-generator/              # Node.js Consumer
    ├── package.json
    └── src/
        ├── server.js            # Application entry point
        ├── kafka/
        │   ├── kafka.js         # Kafka client configuration
        │   └── kafkaConsumer.js # Consumer implementation
        └── websocket/
            └── wsManager.js     # WebSocket message broadcaster
```
