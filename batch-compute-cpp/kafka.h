#ifndef KAFKA_H
#define KAFKA_H

#include <iostream>
#include <string>
#include <cstring>
#include <librdkafka/rdkafkacpp.h>

using namespace std;

/**
 * KafkaProducer - A wrapper class for sending messages to Apache Kafka
 * 
 * This class encapsulates the librdkafka C++ library functionality to simplify
 * producing messages to a Kafka topic.
 */
class KafkaProducer {
private:
    RdKafka::Producer* producer;    // Main Kafka producer instance
    RdKafka::Topic* topic;          // Kafka topic handle
    string errstr;                  // Error string for capturing error messages
    RdKafka::Conf* conf;            // Global configuration object
    RdKafka::Conf* tconf;           // Topic-specific configuration object

public:
    /**
     * Constructor - Initializes the Kafka producer
     * 
     * @param brokers - Kafka broker addresses (e.g., "localhost:9092")
     * @param topicName - The name of the Kafka topic to produce messages to
     * 
     * Steps:
     * 1. Creates global and topic configuration objects
     * 2. Sets the broker server list
     * 3. Creates the producer instance
     * 4. Creates the topic handle
     */
    KafkaProducer(const string& brokers, const string& topicName) {
        // Create configuration objects for global settings and topic settings
        conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
        tconf = RdKafka::Conf::create(RdKafka::Conf::CONF_TOPIC);

        // Configure the broker server address(es)
        if (conf->set("bootstrap.servers", brokers, errstr) != RdKafka::Conf::CONF_OK) {
            cerr << "Failed to set bootstrap.servers: " << errstr << endl;
            throw runtime_error("Kafka configuration error");
        }

        // Create the producer instance using the configuration
        producer = RdKafka::Producer::create(conf, errstr);
        if (!producer) {
            cerr << "Failed to create producer: " << errstr << endl;
            throw runtime_error("Failed to create Kafka producer");
        }

        // Create a topic handle for producing messages
        topic = RdKafka::Topic::create(producer, topicName, tconf, errstr);
        if (!topic) {
            cerr << "Failed to create topic: " << errstr << endl;
            throw runtime_error("Failed to create Kafka topic");
        }

        cout << "Kafka producer created successfully" << endl;
    }

    /**
     * Destructor - Cleans up resources
     * 
     * Flushes pending messages and deletes allocated objects
     */
    ~KafkaProducer() {
        // Wait for all pending messages to be delivered (timeout: 10 seconds)
        producer->flush(10000);
        
        // Clean up allocated resources
        delete topic;
        delete producer;
        delete conf;
        delete tconf;
    }

    /**
     * Produces a message to the Kafka topic
     * 
     * @param message - The message content to send
     * @param key - Optional message key for partitioning (default: empty)
     * @return true if message was queued successfully, false otherwise
     * 
     * How it works:
     * - Converts the message to char* format
     * - Uses PARTITION_UA (unassigned) to let Kafka choose the partition
     * - RK_MSG_COPY flag makes Kafka copy the message data
     * - Polls to handle delivery callbacks
     */
    bool produce(const string& message, const string& key = "") {
        RdKafka::ErrorCode resp;

        if (key.empty()) {
            // Produce without a key
            resp = producer->produce(
                topic,                                    // Topic to produce to
                RdKafka::Topic::PARTITION_UA,            // Let Kafka assign partition
                RdKafka::Producer::RK_MSG_COPY,          // Copy message payload
                const_cast<char*>(message.c_str()),      // Message data
                message.size(),                          // Message size
                nullptr, 0,                              // No key
                0,                                       // Timestamp (0 = now)
                nullptr                                  // No per-message opaque pointer
            );
        } else {
            // Produce with a key (for partitioning)
            resp = producer->produce(
                topic,
                RdKafka::Topic::PARTITION_UA,
                RdKafka::Producer::RK_MSG_COPY,
                const_cast<char*>(message.c_str()),
                message.size(),
                const_cast<char*>(key.c_str()),          // Message key
                key.size(),                              // Key size
                0,
                nullptr
            );
        }

        if (resp != RdKafka::ERR_NO_ERROR) {
            cerr << "Failed to produce message: " 
                      << RdKafka::err2str(resp) << endl;
            return false;
        }

        // Poll to handle delivery callbacks and other events (non-blocking)
        producer->poll(0);
        return true;
    }

    /**
     * Flushes all pending messages
     * 
     * Blocks until all messages are delivered or timeout occurs (10 seconds)
     */
    void flush() {
        producer->flush(10000);
    }
};

#endif // KAFKA_H
