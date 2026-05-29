import { Search } from 'lucide-react';

const EmptyState = ({ onSearchClick }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center col-span-full">
    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-5">
      <Search className="w-9 h-9 text-red-500 dark:text-red-400" strokeWidth={1.5} />
    </div>
    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
      Find Your Next Video
    </h2>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
      Search for any video or paste a YouTube link to start watching and downloading instantly.
    </p>
  </div>
);

export default EmptyState;
