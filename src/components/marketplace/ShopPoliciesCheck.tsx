import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useShopPolicies, useAcceptPolicy, useCheckPolicyAcceptance, ShopPolicy } from '@/hooks/useShopPolicies';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface ShopPoliciesCheckProps {
  sellerId: string;
  onAllAccepted: () => void;
  disabled?: boolean;
}

export function ShopPoliciesCheck({ sellerId, onAllAccepted, disabled }: ShopPoliciesCheckProps) {
  const { user } = useAuth();
  const { data: policies = [] } = useShopPolicies(sellerId);
  const { data: acceptanceCheck } = useCheckPolicyAcceptance(sellerId, user?.id);
  const acceptPolicy = useAcceptPolicy();
  
  const [viewingPolicy, setViewingPolicy] = useState<ShopPolicy | null>(null);
  const [acceptedLocally, setAcceptedLocally] = useState<Set<string>>(new Set());
  
  const requiredPolicies = policies.filter(p => p.is_required);
  const optionalPolicies = policies.filter(p => !p.is_required);
  
  // Check if all required policies are accepted (either from DB or locally)
  const allRequiredAccepted = requiredPolicies.every(p => 
    acceptanceCheck?.pendingPolicies.every(pending => pending.id !== p.id) ||
    acceptedLocally.has(p.id)
  );
  
  const handleAccept = async (policyId: string) => {
    if (!user) return;
    
    try {
      await acceptPolicy.mutateAsync({ policyId });
      setAcceptedLocally(prev => new Set(prev).add(policyId));
      
      // Check if this was the last required policy
      const remainingRequired = requiredPolicies.filter(p => 
        !acceptedLocally.has(p.id) && p.id !== policyId &&
        acceptanceCheck?.pendingPolicies.some(pending => pending.id === p.id)
      );
      
      if (remainingRequired.length === 0) {
        onAllAccepted();
      }
    } catch (error) {
      console.error('Error accepting policy:', error);
    }
  };
  
  const isAccepted = (policyId: string) => {
    return acceptedLocally.has(policyId) || 
           !acceptanceCheck?.pendingPolicies.some(p => p.id === policyId);
  };
  
  if (policies.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        <span>Điều khoản của Shop</span>
        {!allRequiredAccepted && requiredPolicies.length > 0 && (
          <Badge variant="destructive" className="text-[10px]">
            Bắt buộc
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {requiredPolicies.map(policy => (
          <div 
            key={policy.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isAccepted(policy.id) 
                ? 'border-green-500/30 bg-green-500/5' 
                : 'border-orange-500/30 bg-orange-500/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {isAccepted(policy.id) ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm font-medium">{policy.title}</span>
              <Badge variant="outline" className="text-[10px]">Bắt buộc</Badge>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setViewingPolicy(policy)}
                >
                  {isAccepted(policy.id) ? 'Xem' : 'Đọc & Chấp nhận'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{policy.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                  <div 
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }}
                  />
                </ScrollArea>
                {!isAccepted(policy.id) && (
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleAccept(policy.id)}
                    disabled={acceptPolicy.isPending || disabled}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Tôi đã đọc và chấp nhận điều khoản này
                  </Button>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ))}
        
        {optionalPolicies.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            + {optionalPolicies.length} điều khoản khác (không bắt buộc)
          </div>
        )}
      </div>
      
      {!allRequiredAccepted && requiredPolicies.length > 0 && (
        <p className="text-xs text-orange-600">
          Vui lòng đọc và chấp nhận tất cả điều khoản bắt buộc trước khi mua hàng
        </p>
      )}
    </div>
  );
}