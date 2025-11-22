let dp: number[][];

const findPaths = (i: number, j: number): number => {
    if (i === 0 && j === 0) return 1;
    if (i < 0 || j < 0) return 0;
    
    if (dp[i][j] !== -1) return dp[i][j];
    const up = findPaths(i - 1, j);
    const left = findPaths(i, j - 1);
    
    dp[i][j] = up + left;
    return dp[i][j];
}

const pathFinder = (m: number, n: number): number => {
    dp = Array.from({ length: m }, () => Array(n).fill(-1));
    return findPaths(m - 1, n - 1);
}

export default pathFinder;