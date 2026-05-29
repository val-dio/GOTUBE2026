const HISTORY_KEY = 'gotube_search_history';
const MAX_HISTORY = 50;

export const loadHistory = () => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
};

/**
 * Merge new videos into existing history, deduplicate by id, cap at MAX_HISTORY.
 */
export const mergeHistory = (newVideos, prevHistory) =>
  [...newVideos, ...prevHistory]
    .reduce((acc, curr) => {
      if (!acc.find(v => v.id === curr.id)) acc.push(curr);
      return acc;
    }, [])
    .slice(0, MAX_HISTORY);
