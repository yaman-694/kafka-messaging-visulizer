#include <curl/curl.h>
#include <json/json.h>

#include <cstdlib>
#include <ctime>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

vector<vector<int>> dp;

int reachDestination(int x, int y, int m, int n) {
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
    dp.assign(m, vector<int>(n, -1));  // initialize dp with -1
    return reachDestination(0, 0, m, n);
}

// Callback function to handle HTTP response (we don't need the response)
size_t WriteCallback(void* contents, size_t size, size_t nmemb, string* response) {
    size_t totalSize = size * nmemb;
    response->append((char*)contents, totalSize);
    return totalSize;
}

void sendPathData(int x, int y, int m, int n, int result) {
    CURL* curl;
    CURLcode res;
    string response;

    curl = curl_easy_init();
    if (curl) {
        // Create JSON payload
        Json::Value json;
        json["x"] = x;
        json["y"] = y;
        json["m"] = m;
        json["n"] = n;
        json["result"] = result;
        json["timestamp"] = (long long)time(0) * 1000;

        Json::StreamWriterBuilder builder;
        string jsonString = Json::writeString(builder, json);

        // Set URL - sending to Node.js server which will forward to Kafka
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:8080/api/path-data");

        // Set POST data
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());

        // Set headers
        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        // Set callback function
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        // Perform the request
        res = curl_easy_perform(curl);

        if (res != CURLE_OK) {
            cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << endl;
        } else {
            cout << "Sent path data: (" << x << "," << y << ") in " << m << "x" << n << " grid, result=" << result << endl;
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
}

int main() {
    srand(time(0));  // Initialize random seed

    cout << "C++ Path Finder started. Generating and sending path data..." << endl;

    // Generate and process multiple path scenarios
    for (int i = 0; i < 10; i++) {
        int m = rand() % 8 + 3;  // Grid height 3-10
        int n = rand() % 8 + 3;  // Grid width 3-10
        int x = rand() % m;      // Random starting x position
        int y = rand() % n;      // Random starting y position

        // Clear dp for new calculation
        dp.clear();
        dp.assign(m, vector<int>(n, -1));

        int result = reachDestination(x, y, m, n);

        cout << "Generated: (" << x << "," << y << ") -> (" << (m - 1) << "," << (n - 1) << ") = " << result << " paths" << endl;

        // Send data to server
        sendPathData(x, y, m, n, result);

// Wait 2 seconds between sends
#ifdef _WIN32
        Sleep(2000);
#else
        usleep(2000000);
#endif
    }

    cout << "Path finder completed." << endl;
    return 0;
}