#include <vector>
#include <iostream>
#include <sstream>
#include "kafka.h"

using namespace std;

vector<vector<int>> dp;
KafkaProducer* kafkaProducer = nullptr;

int reachDestination(int x, int y, int m, int n) {
    
    // Send coordinates to Kafka
    if (kafkaProducer) {
        stringstream ss;
        ss << "{\"x\":" << x << ",\"y\":" << y << ",\"m\":" << m << ",\"n\":" << n << "}";
        kafkaProducer->produce(ss.str());
    }
    
    // Base case: reached last cell
    if (x == m - 1 && y == n - 1)
        return 1;

    // Out of bounds
    if (x >= m || y >= n)
        return 0;

    // If already computed, return it
    if (dp[x][y] != -1)
        return dp[x][y];

    // Save result in dp
    return dp[x][y] = reachDestination(x + 1, y, m, n) +
                        reachDestination(x, y + 1, m, n);
}

int uniquePaths(int m, int n) {
    dp.assign(m, vector<int>(n, -1));   // initialize dp with -1
    return reachDestination(0, 0, m, n);
}

int main() {
    try {
        // Initialize Kafka producer
        kafkaProducer = new KafkaProducer("localhost:9092", "path-coordinates");
        
        int m = rand() % 10 + 1; 
        int n = rand() % 10 + 1; 
        
        cout << "Computing unique paths for grid " << m << "x" << n << endl;
        
        int result = uniquePaths(m, n);
        
        cout << "Total unique paths: " << result << endl;
        
        // Flush and cleanup
        kafkaProducer->flush();
        delete kafkaProducer;
        kafkaProducer = nullptr;
        
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        if (kafkaProducer) {
            delete kafkaProducer;
            kafkaProducer = nullptr;
        }
        return 1;
    }
    
    return 0;
}