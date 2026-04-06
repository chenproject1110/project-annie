'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { fetchSearchSuggestions, SearchSuggestion } from '@/lib/anilist';
import { SearchSuggestions } from './SearchSuggestions';

interface SearchBarProps {
  isOpen: boolean;
}

export function SearchBar({ isOpen }: SearchBarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions (debounced) - Local state only
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim()) {
        const results = await fetchSearchSuggestions(searchTerm);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = searchTerm.trim();
    if (!q) return;
    e.preventDefault();

    let list = suggestions;
    if (list.length === 0) {
      list = await fetchSearchSuggestions(q);
      setSuggestions(list);
    }

    if (list.length > 0) {
      router.push(`/anime/${list[0].id}`);
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="relative animate-slideDown"
      style={{
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Unified Search Input */}
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Left Icon: Search */}
        <Search
          className="absolute left-5 top-1/2 z-20 -translate-y-1/2 w-6 h-6 text-gray-300 pointer-events-none"
          aria-hidden
        />

        {/* Input stacks below icons so backdrop/blur does not paint over the magnifier */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="The journey starts here"
          className="relative z-0 w-full pl-14 pr-16 py-4 bg-white/10 backdrop-blur-md text-white text-lg rounded-2xl border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 focus:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)] transition-all placeholder-gray-400"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center hover:bg-white/10 rounded-full transition-all active:scale-95"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 text-gray-300 hover:text-white" />
          </button>
        )}

        {/* Suggestions Dropdown */}
        <SearchSuggestions
          suggestions={suggestions}
          isOpen={showSuggestions}
          onClose={() => {
            setShowSuggestions(false);
            setSearchTerm('');
          }}
        />
      </div>
    </div>
  );
}
