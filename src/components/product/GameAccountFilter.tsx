import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface FilterValues {
  search: string;
  rank: string[];
  minChampions: string;
  maxChampions: string;
  minSkins: string;
  maxSkins: string;
  minPrice: string;
  maxPrice: string;
}

interface GameAccountFilterProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  availableRanks?: string[];
}

const defaultRanks = [
  'Sắt', 'Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương', 'Cao Thủ', 'Đại Cao Thủ', 'Thách Đấu'
];

export function GameAccountFilter({ filters, onFiltersChange, availableRanks }: GameAccountFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ranks = availableRanks?.length ? availableRanks : defaultRanks;

  const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleRank = (rank: string) => {
    const newRanks = filters.rank.includes(rank)
      ? filters.rank.filter(r => r !== rank)
      : [...filters.rank, rank];
    updateFilter('rank', newRanks);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      rank: [],
      minChampions: '',
      maxChampions: '',
      minSkins: '',
      maxSkins: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.rank.length > 0,
    filters.minChampions,
    filters.maxChampions,
    filters.minSkins,
    filters.maxSkins,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo mã acc, rank..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Toggle Button */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-card hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              Bộ lọc tìm kiếm
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="space-y-6 p-4 bg-card rounded-lg border border-border">
            {/* Rank Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rank</label>
              <div className="flex flex-wrap gap-2">
                {ranks.map((rank) => (
                  <Badge
                    key={rank}
                    variant={filters.rank.includes(rank) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleRank(rank)}
                  >
                    {rank}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Champions Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Số tướng</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={filters.minChampions}
                  onChange={(e) => updateFilter('minChampions', e.target.value)}
                  className="w-full"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={filters.maxChampions}
                  onChange={(e) => updateFilter('maxChampions', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Skins Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Số trang phục</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={filters.minSkins}
                  onChange={(e) => updateFilter('minSkins', e.target.value)}
                  className="w-full"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={filters.maxSkins}
                  onChange={(e) => updateFilter('maxSkins', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Giá (VNĐ)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
