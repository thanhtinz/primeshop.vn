import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles, ArrowRight, User, AtSign, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicDomains } from '@/hooks/useMailAdmin';

interface SetupMailboxProps {
  onSetup: (email: string, domainId: string) => void;
}

export const SetupMailbox: React.FC<SetupMailboxProps> = ({ onSetup }) => {
  const { user } = useAuth();
  const [emailLocal, setEmailLocal] = useState(user?.email?.split('@')[0] || '');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: publicDomains, isLoading: domainsLoading } = usePublicDomains();

  // Set default domain when loaded
  React.useEffect(() => {
    if (publicDomains && publicDomains.length > 0 && !selectedDomainId) {
      const defaultDomain = publicDomains.find(d => d.is_default) || publicDomains[0];
      setSelectedDomainId(defaultDomain.id);
    }
  }, [publicDomains, selectedDomainId]);

  const selectedDomain = publicDomains?.find(d => d.id === selectedDomainId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLocal.trim() || !selectedDomainId) return;

    setIsLoading(true);
    try {
      const fullEmail = `${emailLocal}@${selectedDomain?.domain || 'primemail.vn'}`;
      await onSetup(fullEmail, selectedDomainId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Mail className="h-10 w-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">Tạo hộp thư của bạn</CardTitle>
            <CardDescription className="text-base">
              Chào mừng bạn đến với hệ thống email! Hãy tạo địa chỉ email để bắt đầu gửi và nhận thư.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Địa chỉ email của bạn
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    type="text"
                    placeholder="your.name"
                    value={emailLocal}
                    onChange={(e) => setEmailLocal(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="text-lg"
                    autoFocus
                  />
                  <span className="text-muted-foreground">@</span>
                  <Select 
                    value={selectedDomainId} 
                    onValueChange={setSelectedDomainId}
                    disabled={domainsLoading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn domain..." />
                    </SelectTrigger>
                    <SelectContent>
                      {publicDomains?.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            {domain.domain}
                            {domain.is_default && (
                              <Badge variant="secondary" className="text-[10px] h-4">Mặc định</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chỉ sử dụng chữ cái, số, dấu chấm, gạch dưới và gạch ngang
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Email của bạn sẽ là:</span>
                </div>
                <p className="text-lg font-semibold text-primary">
                  {emailLocal || 'your.name'}@{selectedDomain?.domain || 'domain.com'}
                </p>
                {selectedDomain?.display_name && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDomain.display_name}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg gap-2"
                disabled={!emailLocal.trim() || !selectedDomainId || isLoading || domainsLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                    />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Tạo hộp thư
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm text-center">Bạn có thể:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">✓</span>
                  Gửi và nhận email từ người dùng khác trong hệ thống
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">✓</span>
                  Tổ chức email với thư mục và nhãn
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">✓</span>
                  Đính kèm tệp và hình ảnh
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">✓</span>
                  Lên lịch gửi email tự động
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupMailbox;
