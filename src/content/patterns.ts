import type { Pattern } from './schema';

/** One-line explanations shown when you long-press a pattern chip. */
export const PATTERN_INFO: Record<Pattern, string> = {
  'Hash map / set': 'O(1) lookup by key. Reach for it when you ask "have I seen this before?" or need counts. Trades memory for speed.',
  'Two pointers': 'Two indexes moving toward each other, or in the same direction, usually over sorted data. Replaces a nested loop.',
  'Sliding window': 'A contiguous range [left, right] that grows on the right and shrinks on the left. For "longest/shortest substring or subarray such that…".',
  'Prefix sum': 'Running totals, so any range sum is prefix[j] − prefix[i] in O(1). Pairs with a hash map for "subarray sums to k".',
  'Binary search': 'Halve the search space each step. Works on sorted arrays, and on any yes/no question whose answer flips once (searching the answer).',
  'Sort first': 'Sort in O(n log n) so related items sit next to each other. That unlocks two pointers, greedy sweeps and easy duplicate skipping.',
  'Stack / monotonic stack': 'Last in, first out. For matching brackets and undo. Kept in sorted order, it finds the "next greater/smaller element".',
  'Heap / top-k': 'A priority queue that gives the min or max in O(log n). For top-k, kth largest, merging sorted lists and scheduling.',
  'Intervals: sort + sweep': 'Sort intervals by start (or end), then walk once, merging or counting overlaps as you go.',
  'Fast & slow pointers': 'Two pointers moving at different speeds through a list. Detects cycles and finds the middle in O(1) space.',
  'Tree DFS / BFS': 'DFS (recursion) for paths, heights and subtree questions. BFS (a queue) for anything level by level.',
  'Graph BFS / DFS': 'Explore everything reachable from a start node, with a visited set. BFS gives shortest paths in unweighted graphs. Grids are graphs too.',
  'Topological sort': 'Order nodes so every edge points forward. For dependencies and prerequisites. Impossible if there is a cycle.',
  Backtracking: 'Build a solution step by step: choose, recurse, undo. For permutations, combinations, subsets and puzzles.',
  'Dynamic programming': 'Split a problem into overlapping subproblems and reuse their answers. Define the state, the transition and the base case.',
  Greedy: 'Take the locally best choice at each step and never undo it. Only correct when you can argue that choice is always safe.',
  'Union-Find': 'Tracks which items are in the same group, with near-O(1) merge and lookup. For connected components and cycle detection.',
  Trie: 'A tree of characters where words share their prefixes. For prefix search, autocomplete and word games.',
};
