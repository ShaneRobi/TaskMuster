const BLIND_75_ROWS = [
  ['Arrays & Hashing', 'Contains Duplicate'],
  ['Arrays & Hashing', 'Valid Anagram'],
  ['Arrays & Hashing', 'Two Sum'],
  ['Arrays & Hashing', 'Group Anagrams'],
  ['Arrays & Hashing', 'Top K Frequent Elements'],
  ['Arrays & Hashing', 'Product of Array Except Self'],
  ['Arrays & Hashing', 'Encode and Decode Strings'],
  ['Arrays & Hashing', 'Longest Consecutive Sequence'],
  ['Two Pointers', 'Valid Palindrome'],
  ['Two Pointers', '3Sum'],
  ['Two Pointers', 'Container With Most Water'],
  ['Sliding Window', 'Best Time to Buy and Sell Stock'],
  ['Sliding Window', 'Longest Substring Without Repeating Characters'],
  ['Sliding Window', 'Longest Repeating Character Replacement'],
  ['Sliding Window', 'Minimum Window Substring'],
  ['Stack', 'Valid Parentheses'],
  ['Binary Search', 'Find Minimum in Rotated Sorted Array'],
  ['Binary Search', 'Search in Rotated Sorted Array'],
  ['Linked List', 'Reverse Linked List'],
  ['Linked List', 'Merge Two Sorted Lists'],
  ['Linked List', 'Reorder List'],
  ['Linked List', 'Remove Nth Node From End of List'],
  ['Linked List', 'Linked List Cycle'],
  ['Linked List', 'Merge K Sorted Lists'],
  ['Trees', 'Invert Binary Tree'],
  ['Trees', 'Maximum Depth of Binary Tree'],
  ['Trees', 'Same Tree'],
  ['Trees', 'Binary Tree Maximum Path Sum'],
  ['Trees', 'Binary Tree Level Order Traversal'],
  ['Trees', 'Serialize and Deserialize Binary Tree'],
  ['Trees', 'Subtree of Another Tree'],
  ['Trees', 'Construct Binary Tree from Preorder and Inorder Traversal'],
  ['Trees', 'Validate Binary Search Tree'],
  ['Trees', 'Kth Smallest Element in a BST'],
  ['Trees', 'Lowest Common Ancestor of a BST'],
  ['Heap / Priority Queue', 'Find Median from Data Stream'],
  ['Backtracking', 'Combination Sum'],
  ['Backtracking', 'Word Search'],
  ['Tries', 'Implement Trie (Prefix Tree)'],
  ['Tries', 'Design Add and Search Words Data Structure'],
  ['Tries', 'Word Search II'],
  ['Graphs', 'Number of Islands'],
  ['Graphs', 'Clone Graph'],
  ['Graphs', 'Pacific Atlantic Water Flow'],
  ['Graphs', 'Course Schedule'],
  ['Graphs', 'Graph Valid Tree'],
  ['Graphs', 'Number of Connected Components in an Undirected Graph'],
  ['Advanced Graphs', 'Alien Dictionary'],
  ['1-D Dynamic Programming', 'Climbing Stairs'],
  ['1-D Dynamic Programming', 'House Robber'],
  ['1-D Dynamic Programming', 'House Robber II'],
  ['1-D Dynamic Programming', 'Longest Palindromic Substring'],
  ['1-D Dynamic Programming', 'Palindromic Substrings'],
  ['1-D Dynamic Programming', 'Decode Ways'],
  ['1-D Dynamic Programming', 'Coin Change'],
  ['1-D Dynamic Programming', 'Maximum Product Subarray'],
  ['1-D Dynamic Programming', 'Word Break'],
  ['1-D Dynamic Programming', 'Longest Increasing Subsequence'],
  ['2-D Dynamic Programming', 'Unique Paths'],
  ['2-D Dynamic Programming', 'Longest Common Subsequence'],
  ['Greedy', 'Maximum Subarray'],
  ['Greedy', 'Jump Game'],
  ['Intervals', 'Insert Interval'],
  ['Intervals', 'Merge Intervals'],
  ['Intervals', 'Non-overlapping Intervals'],
  ['Intervals', 'Meeting Rooms'],
  ['Intervals', 'Meeting Rooms II'],
  ['Math & Geometry', 'Rotate Image'],
  ['Math & Geometry', 'Spiral Matrix'],
  ['Math & Geometry', 'Set Matrix Zeroes'],
  ['Bit Manipulation', 'Number of 1 Bits'],
  ['Bit Manipulation', 'Counting Bits'],
  ['Bit Manipulation', 'Reverse Bits'],
  ['Bit Manipulation', 'Missing Number'],
  ['Bit Manipulation', 'Sum of Two Integers'],
];

const TRACK_CURRICULA = {
  math: [
    ['Arithmetic baseline', '120-second mixed arithmetic and a strategy note'],
    ['Fractions and percentages', 'Convert, compare, and estimate without a calculator'],
    ['Ratios and number properties', 'Reason about divisibility, scale, and bounds'],
    ['Counting and combinatorics', 'Define the state space before calculating'],
    ['Conditional probability', 'State assumptions and independence explicitly'],
    ['Expected value', 'Model weighted outcomes and explain the decision'],
    ['Recursive expectation', 'Define states and write repeat-until-stop equations'],
    ['Fermi estimation', 'Build an assumption tree, range, and point estimate'],
    ['Statistics foundations', 'Mean, variance, distributions, and calibration'],
    ['Linear algebra', 'Vectors, matrices, and transformations'],
    ['Betting and risk', 'Compare EV, variance, confidence, and risk limits'],
    ['Full quant diagnostic', 'Arithmetic, estimation, probability, and error repair'],
  ],
  build: [
    ['Tests and edge cases', 'Add a failure-path test and capture the output'],
    ['Clean functions and typing', 'Refactor one solution into typed, testable functions'],
    ['Market-data importer', 'Validate and import price data with error handling'],
    ['Data structures module', 'Implement and test a queue, stack, or linked list'],
    ['SQLite persistence', 'Add schema, migrations, queries, and fixtures'],
    ['Traversal module', 'Implement iterative and recursive traversal'],
    ['Statistics module', 'Add numerical tests and explain trade-offs'],
    ['Backtesting module', 'Calculate returns and moving statistics with fixtures'],
    ['Numerical module', 'Add vector or matrix behavior with precision tests'],
    ['Analysis report', 'Write charts, findings, and limitations'],
    ['Performance evaluation', 'Profile an existing solution and document the result'],
    ['Project release', 'Document, test, package, and release the project'],
  ],
  sql: [
    ['SELECT, filter, and aggregate', 'Save three queries and explain their results'],
    ['GROUP BY and HAVING', 'Demonstrate grouped filters with edge cases'],
    ['INNER and LEFT JOIN', 'Explain which rows are preserved and why'],
    ['Subqueries and CTEs', 'Solve one task both ways and compare readability'],
    ['Window functions', 'Use ranking or rolling calculations with a fixture'],
    ['Schema and constraints', 'Create keys, checks, and representative invalid cases'],
    ['Indexes and query plans', 'Compare a query plan before and after an index'],
    ['Transactions', 'Demonstrate commit, rollback, and an error path'],
    ['Time-series SQL', 'Aggregate market-style data into stable intervals'],
    ['Data quality checks', 'Detect duplicates, nulls, and broken relationships'],
    ['Performance repair', 'Measure and improve one slow query'],
    ['SQL diagnostic', 'Complete a mixed set and explain every result'],
  ],
  english: Array.from({ length: 12 }, (_, index) => [
    `Week ${index + 1} technical explanation`,
    index === 9
      ? 'Revise a complete analysis report for clarity and limitations'
      : 'Explain one algorithm, mathematical result, or project decision plainly',
  ]),
};

export const ROADMAP_TITLES = [
  'Python through problems', 'Arrays & strings',
  'Arithmetic foundations', 'Clean functions & tests',
  'Hashing & two pointers', 'Core SQL',
  'Sliding window & search', 'Market-data importer',
  'Stacks, queues & lists', 'Probability foundations',
  'Trees, BFS & DFS', 'SQLite persistence',
  'Heaps & intervals', 'Statistics foundations',
  'Graphs & greedy', 'Backtesting module',
  'Dynamic programming I', 'Linear algebra',
  'Dynamic programming II', 'Technical reporting',
  'Mixed timed sets', 'C++ evaluation',
  'Re-solve failures', 'Project release',
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sequentialItems(trackId, rows, type) {
  return rows.map(([title, detail], index) => {
    const id = `${trackId}-${String(index + 1).padStart(2, '0')}-${slugify(title)}`;
    const previous = index > 0
      ? `${trackId}-${String(index).padStart(2, '0')}-${slugify(rows[index - 1][0])}`
      : null;
    return {
      id,
      trackId,
      type,
      title,
      topic: type,
      detail,
      remaining: '1 output',
      estimateMinutes: trackId === 'math' ? 90 : trackId === 'build' ? 60 : 30,
      state: index === 0 ? 'active' : 'queued',
      prerequisiteIds: previous ? [previous] : [],
      order: index + 1,
      source: 'Habit Rabbit curriculum v1',
      attempts: 0,
    };
  });
}

export function createDefaultLearningItems() {
  const algorithms = BLIND_75_ROWS.map(([topic, title], index) => {
    const id = `blind75-${String(index + 1).padStart(2, '0')}-${slugify(title)}`;
    const previous = index > 0
      ? `blind75-${String(index).padStart(2, '0')}-${slugify(BLIND_75_ROWS[index - 1][1])}`
      : null;
    return {
      id,
      trackId: 'algorithms',
      type: 'Blind 75',
      title,
      topic,
      detail: `${topic} · 25–35 minute unaided attempt`,
      remaining: '1 problem',
      estimateMinutes: 35,
      state: index === 0 ? 'active' : 'queued',
      prerequisiteIds: previous ? [previous] : [],
      order: index + 1,
      source: 'Blind 75 catalogue v1',
      canonicalUrl: `https://leetcode.com/problems/${slugify(title)}/`,
      attempts: 0,
    };
  });

  return [
    ...algorithms,
    ...sequentialItems('math', TRACK_CURRICULA.math, 'Quant module'),
    ...sequentialItems('build', TRACK_CURRICULA.build, 'Build milestone'),
    ...sequentialItems('sql', TRACK_CURRICULA.sql, 'SQL module'),
    ...sequentialItems('english', TRACK_CURRICULA.english, 'Explanation'),
  ];
}

export function createDefaultRoadmap(startDate) {
  return ROADMAP_TITLES.map((title, index) => ({
    id: `roadmap-${index + 1}`,
    week: Math.floor(index / 2) + 1,
    title,
    state: 'not-started',
    completedAt: null,
    startDate,
    proof: '',
  }));
}

export const BLIND_75_COUNT = BLIND_75_ROWS.length;

