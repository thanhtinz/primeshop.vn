import { forwardRef } from 'react';
import { useProductComparison } from '@/hooks/useProductComparison';
import { Button } from '@/components/ui/button';
import { X, Scale, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductComparisonBar = forwardRef<HTMLDivElement, {}>(function ProductComparisonBar(_, ref) {
  const { items, removeItem, clearAll, maxItems } = useProductComparison();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Scale className="h-4 w-4 text-primary" />
              <span>So sánh ({items.length}/{maxItems})</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border"
                >
                  <img
                    src={item.imageUrl || '/placeholder.svg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/compare')}
                disabled={items.length < 2}
              >
                So sánh ngay
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
