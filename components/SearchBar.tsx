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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      // Navigate to first suggestion
      const firstSuggestion = suggestions[0];
      router.push(`/anime/${firstSuggestion.id}`);
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
      <div className="relative">
        {/* Left Icon: Search */}
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        
        {/* Input Field */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search anime across all seasons..."
          autoFocus
          className="w-full pl-12 pr-12 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors placeholder-gray-500 relative z-10"
        />
        
        {/* Right Icon: Clear (only when text exists) */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
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
