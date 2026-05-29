import { useState, memo } from 'react';
import { X, Search } from 'lucide-react';
import { useVideo } from '../context/VideoContext';
import { useNavigate } from 'react-router-dom';

const SearchBar = memo(() => {
  const [q, setQ] = useState('');
  const { search } = useVideo();
  const navigate   = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    search(trimmed);
    navigate(`/search/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg" role="search">
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search videos or paste YouTube link..."
          aria-label="Search videos"
          className="w-full pl-4 pr-8 py-2 text-sm rounded-l-full
                     border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800
                     text-gray-900 dark:text-gray-100
                     focus:outline-none focus:border-red-500 dark:focus:border-red-500
                     transition-colors"
        />
        {q.length > 0 && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center
                       justify-center rounded-full text-gray-400 hover:text-gray-600
                       dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700
                       transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Submit search"
        className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800
                   border border-red-600 rounded-r-full text-white transition-colors shrink-0"
      >
        <Search className="w-4 h-4" strokeWidth={2} />
      </button>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
