# Testing the C++ Kafka Producer

## Prerequisites

You need the following installed:

1. **Docker** - for running Kafka
2. **Conan** - C++ package manager
   ```bash
   pip install conan
   ```
3. **C++ compiler** (g++ or clang++)
4. **Make** build tool

## Quick Test (Automated)

Run the automated test script:

```bash
cd batch-compute-cpp
./test.sh
```

This script will:
1. Check/start Kafka
2. Create the topic
3. Install dependencies
4. Build the application
5. Run it and show Kafka messages

## Manual Testing Steps

### Step 1: Start Kafka

```bash
cd /Users/yamanjain/Documents/Workspace/path-visualizer
docker-compose up -d
```

Wait ~15 seconds for Kafka to be ready.

### Step 2: Create Kafka Topic

```bash
docker exec kafka kafka-topics.sh --create \
  --topic path-coordinates \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
```

### Step 3: Install Dependencies

```bash
cd batch-compute-cpp
conan install . --output-folder=build --build=missing
```

### Step 4: Build the Application

```bash
make
```

This creates the `path-finder` executable.

### Step 5: Start a Kafka Consumer (in separate terminal)

Open a new terminal and run:

```bash
docker exec -it kafka kafka-console-consumer.sh \
  --topic path-coordinates \
  --bootstrap-server localhost:9092 \
  --from-beginning
```

Leave this running to see messages in real-time.

### Step 6: Run the C++ Application

In the original terminal:

```bash
./path-finder
```

You should see:
- Console output showing the grid size and number of paths
- JSON messages appearing in the Kafka consumer terminal with coordinates

## Expected Output

### In the application terminal:
```
Kafka producer created successfully
Computing unique paths for grid 5x7
Total unique paths: 462
```

### In the Kafka consumer terminal:
```json
{"x":0,"y":0,"m":5,"n":7}
{"x":1,"y":0,"m":5,"n":7}
{"x":2,"y":0,"m":5,"n":7}
...
```

## Troubleshooting

### Kafka connection fails
- Check Kafka is running: `docker ps | grep kafka`
- Verify port 9092 is accessible
- Check docker-compose.yml has correct configuration

### Build fails
- Ensure Conan dependencies are installed: `conan install . --output-folder=build --build=missing`
- Check librdkafka is available in build/Release/generators

### No messages in Kafka
- Verify topic exists: `docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092`
- Check for errors in application output
- Ensure Kafka broker address is correct (localhost:9092)

## Clean Up

```bash
# Stop application (Ctrl+C if running)
# Clean build artifacts
make clean

# Stop Kafka
cd ..
docker-compose down
```

## Useful Commands

```bash
# List all topics
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check consumer group
docker exec kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# Delete topic (if needed)
docker exec kafka kafka-topics.sh --delete --topic path-coordinates --bootstrap-server localhost:9092
```
