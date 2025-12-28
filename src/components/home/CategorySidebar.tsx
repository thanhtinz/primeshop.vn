import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Gamepad2, Crown, Zap, ChevronDown,
  Sparkles, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const CategorySidebar = () => {
  const { data: categories } = useCategories();
  const { language, t } = useLanguage();
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    premium: false,
    topup: false,
    design: false,
    account: false,
  });
  
  const allCategories = categories || [];
  
  // Separate categories by style
  const gameAccountCategories = allCategories.filter(c => c.style === 'game_account');
  const premiumCategories = allCategories.filter(c => c.style === 'premium');
  const topupCategories = allCategories.filter(c => c.style === 'game_topup');
  const designCategories = allCategories.filter(c => c.style === 'design');

  const getCategoryName = (category: any) => {
    if (language === 'en' && category.name_en) {
      return category.name_en;
    }
    return category.name;
  };

  const renderCategoryItem = (category: any) => {
    return (
      <Link
        key={category.id}
        to={`/category/${category.slug}`}
        className="block px-6 py-2 text-sm hover:bg-muted/50 transition-colors hover:text-primary truncate"
      >
        {getCategoryName(category)}
      </Link>
    );
  };

  const renderSection = (
    key: string,
    label: string,
    Icon: React.ElementType,
    items: any[]
  ) => {
    if (items.length === 0) return null;
    
    return (
      <Collapsible
        open={openSections[key]}
        onOpenChange={() => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))}
      >
        <CollapsibleTrigger className="w-full px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
          <Icon className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown 
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              openSections[key] ? "rotate-0" : "-rotate-90"
            )} 
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="py-1">
            {items.map(renderCategoryItem)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="hidden lg:block w-[220px] shrink-0">
      <div className="bg-card rounded-xl border border-border overflow-hidden h-full">
        <div className="p-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            {t('categories')}
          </h3>
        </div>
        <nav className="py-1">
          {renderSection('premium', 'Premium', Crown, premiumCategories)}
          {renderSection('topup', 'Topup', Zap, topupCategories)}
          {renderSection('design', 'Design', Palette, designCategories)}
          {renderSection('account', 'Account', Gamepad2, gameAccountCategories)}
        </nav>
      </div>
    </div>
  );
};
