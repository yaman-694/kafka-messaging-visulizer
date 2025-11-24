#!/bin/bash

echo "=== C++ Kafka Producer Test Script ==="
echo ""

# Check if Kafka is running
echo "Step 1: Checking if Kafka is running..."
if docker ps | grep -q kafka; then
    echo "✓ Kafka is running"
else
    echo "✗ Kafka is not running"
    echo "Starting Kafka with docker-compose..."
    cd .. && docker-compose up -d && cd batch-compute-cpp
    echo "Waiting for Kafka to be ready (15 seconds)..."
    sleep 15
fi

echo ""
echo "Step 2: Creating Kafka topic 'path-coordinates'..."
docker exec kafka kafka-topics.sh --create --topic path-coordinates --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists

echo ""
echo "Step 3: Installing dependencies with Conan..."
if ! command -v conan &> /dev/null; then
    echo "✗ Conan not found. Please install it: pip install conan"
    exit 1
fi

conan install . --output-folder=build --build=missing

echo ""
echo "Step 4: Building the C++ application..."
make clean
make

if [ ! -f "./path-finder" ]; then
    echo "✗ Build failed"
    exit 1
fi

echo ""
echo "Step 5: Setting up Kafka consumer in background to monitor messages..."
echo "Messages will be displayed below:"
echo "---"

# Start consumer in background
docker exec -d kafka kafka-console-consumer.sh --topic path-coordinates --bootstrap-server localhost:9092 --from-beginning > /tmp/kafka-output.txt 2>&1 &
CONSUMER_PID=$!

sleep 2

echo ""
echo "Step 6: Running the C++ path-finder application..."
echo "---"
./path-finder

echo ""
echo "---"
echo "Step 7: Fetching messages from Kafka..."
sleep 2

docker exec kafka kafka-console-consumer.sh --topic path-coordinates --bootstrap-server localhost:9092 --from-beginning --max-messages 20 --timeout-ms 5000

echo ""
echo "=== Test Complete ==="
echo ""
echo "To manually check messages, run:"
echo "docker exec kafka kafka-console-consumer.sh --topic path-coordinates --bootstrap-server localhost:9092 --from-beginning"
