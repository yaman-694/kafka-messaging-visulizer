#include <vector>
#include <iostream>

using namespace std;

global vector<vector<int>> dp;

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
    dp.assign(m, vector<int>(n, -1));   // initialize dp with -1
    return reachDestination(0, 0, m, n);
}

int main() {
    int m = rand() % 10 + 1; 
    int n = rand() % 10 + 1; 
    int result = uniquePaths(m, n);
    return 0;
}