import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, X, Clock, TrendingUp, Package, Folder, Store, 
  FileText, Loader2, Sparkles, ArrowRight 
} from 'lucide-react';
import { useAdvancedSearch, useSearchHistory, usePopularSearches, useAISearchSuggestions } from '@/hooks/useAdvancedSearch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Simple debounce hook
const useDebounceValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

export const AdvancedSearchBar = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounceValue(query, 300);
  
  const { search, results, isSearching, clearResults } = useAdvancedSearch();
  const { data: searchHistory = [] } = useSearchHistory();
  const { data: popularSearches = [] } = usePopularSearches();
  const { suggestions, getSuggestions, isLoading: suggestionsLoading } = useAISearchSuggestions();

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
      getSuggestions(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setQuery('');
    clearResults();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="h-4 w-4" />;
      case 'category': return <Folder className="h-4 w-4" />;
      case 'seller': return <Store className="h-4 w-4" />;
      case 'news': return <FileText className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Sản phẩm';
      case 'category': return 'Danh mục';
      case 'seller': return 'Cửa hàng';
      case 'news': return 'Tin tức';
      default: return type;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm sản phẩm, danh mục, cửa hàng..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => { setQuery(''); clearResults(); }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <ScrollArea className="max-h-[400px]">
              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Sparkles className="h-3 w-3" /> Gợi ý AI
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(s)}
                        className="text-xs"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {results.length > 0 && (
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 mb-2">
                    Tìm thấy {results.length} kết quả
                  </p>
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result.url)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="h-10 w-10 rounded-lg object-cover bg-muted"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          {getTypeIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.description && (
                          <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {getTypeLabel(result.type)}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {query.length >= 2 && !isSearching && results.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy kết quả cho "{query}"</p>
                </div>
              )}

              {/* Popular & History (when no query) */}
              {!query && (
                <>
                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <div className="p-3 border-b">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Clock className="h-3 w-3" /> Tìm kiếm gần đây
                      </p>
                      <div className="space-y-1">
                        {searchHistory.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleQuickSearch(item.query)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left text-sm"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{item.query}</span>
                            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  {popularSearches.length > 0 && (
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <TrendingUp className="h-3 w-3" /> Tìm kiếm phổ biến
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((item: any) => (
                          <Button
                            key={item.id}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleQuickSearch(item.query)}
                            className="text-xs"
                          >
                            {item.query}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchBar;
