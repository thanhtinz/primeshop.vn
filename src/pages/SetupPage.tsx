import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Database, User, Shield, Mail, Check, X, ArrowRight, 
  ArrowLeft, Loader2, Eye, EyeOff, Globe, CheckCircle2, 
  Settings, AlertCircle, Sparkles, Lock, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SetupData {
  // Database
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  
  // Admin
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Site Settings
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  senderEmail: string;
  
  // Email SMTP
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
}

const SetupPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupStatus, setSetupStatus] = useState<string[]>([]);
  
  const [data, setData] = useState<SetupData>({
    dbHost: 'localhost',
    dbPort: '3306',
    dbName: 'prime_shop',
    dbUser: 'root',
    dbPassword: '',
    adminUsername: 'admin',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    siteName: 'Prime Shop',
    siteUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
    supportEmail: '',
    senderEmail: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
  });

  const steps = [
    { id: 'welcome', title: 'Chào mừng', icon: Sparkles, description: 'Giới thiệu setup wizard' },
    { id: 'database', title: 'Database', icon: Database, description: 'Cấu hình MySQL' },
    { id: 'admin', title: 'Admin', icon: Shield, description: 'Tài khoản quản trị' },
    { id: 'site', title: 'Website', icon: Globe, description: 'Thông tin website' },
    { id: 'email', title: 'Email', icon: Mail, description: 'Cấu hình SMTP (tùy chọn)' },
    { id: 'review', title: 'Xác nhận', icon: CheckCircle2, description: 'Kiểm tra và hoàn tất' },
  ];

  // Check if setup already completed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/setup/check`);
        const result = await response.json();
        
        if (result.isSetupComplete) {
          setIsSetupComplete(true);
        }
      } catch (error) {
        console.log('Setup check failed, proceeding with setup');
      } finally {
        setIsLoading(false);
      }
    };
    checkSetup();
  }, []);

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const updateData = (field: keyof SetupData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
    setDbTestResult(null);
  };

  const testDatabaseConnection = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/setup/test-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: data.dbHost,
          port: parseInt(data.dbPort),
          database: data.dbName,
          user: data.dbUser,
          password: data.dbPassword,
        }),
      });
      
      const result = await response.json();
      setDbTestResult(result);
      
      if (result.success) {
        toast.success('Kết nối database thành công!');
      } else {
        toast.error(result.message || 'Không thể kết nối database');
      }
    } catch (error) {
      setDbTestResult({ success: false, message: 'Không thể kết nối server' });
      toast.error('Không thể kết nối server');
    } finally {
      setTestingDb(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Database
        if (!data.dbHost || !data.dbPort || !data.dbName || !data.dbUser) {
          toast.error('Vui lòng điền đầy đủ thông tin database');
          return false;
        }
        return true;
        
      case 2: // Admin
        if (!data.adminUsername || !data.adminEmail || !data.adminPassword) {
          toast.error('Vui lòng điền đầy đủ thông tin admin');
          return false;
        }
        if (data.adminPassword.length < 8) {
          toast.error('Mật khẩu admin phải có ít nhất 8 ký tự');
          return false;
        }
        if (data.adminPassword !== data.adminPasswordConfirm) {
          toast.error('Mật khẩu xác nhận không khớp');
          return false;
        }
        if (!data.adminEmail.includes('@')) {
          toast.error('Email admin không hợp lệ');
          return false;
        }
        return true;
        
      case 3: // Site
        if (!data.siteName || !data.siteUrl) {
          toast.error('Vui lòng điền tên và URL website');
          return false;
        }
        return true;
        
      case 4: // Email (optional)
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const runSetup = async () => {
    setIsSubmitting(true);
    setSetupProgress(0);
    setSetupStatus([]);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // Progress tracking
      const addStatus = (msg: string) => {
        setSetupStatus(prev => [...prev, msg]);
      };
      
      setSetupProgress(10);
      addStatus('🔄 Đang kết nối database...');
      
      const response = await fetch(`${apiUrl}/setup/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      setSetupProgress(30);
      addStatus('📦 Đang import cấu trúc database...');
      
      // Simulate progress for user feedback
      await new Promise(r => setTimeout(r, 500));
      setSetupProgress(50);
      addStatus('📊 Đang import seed data...');
      
      await new Promise(r => setTimeout(r, 500));
      setSetupProgress(70);
      addStatus('👤 Đang tạo tài khoản admin...');
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Setup thất bại');
      }
      
      setSetupProgress(90);
      addStatus('⚙️ Đang lưu cấu hình...');
      
      await new Promise(r => setTimeout(r, 300));
      setSetupProgress(100);
      addStatus('✅ Setup hoàn tất!');
      
      toast.success('🎉 Setup thành công! Đang chuyển hướng...');
      
      // Redirect to admin login after 2 seconds
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
      
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra trong quá trình setup');
      setSetupProgress(0);
      setSetupStatus(prev => [...prev, `❌ Lỗi: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Đang kiểm tra trạng thái setup...</p>
        </div>
      </div>
    );
  }

  if (isSetupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Setup đã hoàn tất</CardTitle>
            <CardDescription>
              Website đã được cấu hình. Trang setup không còn khả dụng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/')} className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/login')} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Đăng nhập Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl">
              <Rocket className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chào mừng đến Prime Shop
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Hãy hoàn tất các bước sau để thiết lập website của bạn. Quá trình này chỉ mất vài phút.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {[
                { icon: Database, title: 'Cấu hình Database', desc: 'Kết nối MySQL' },
                { icon: Shield, title: 'Tạo Admin', desc: 'Tài khoản quản trị' },
                { icon: Globe, title: 'Thiết lập Website', desc: 'Thông tin cơ bản' },
                { icon: Mail, title: 'Email SMTP', desc: 'Gửi email tự động' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 1: // Database
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dbHost">Host</Label>
                <Input
                  id="dbHost"
                  value={data.dbHost}
                  onChange={(e) => updateData('dbHost', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dbPort">Port</Label>
                <Input
                  id="dbPort"
                  value={data.dbPort}
                  onChange={(e) => updateData('dbPort', e.target.value)}
                  placeholder="3306"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dbName">Tên Database</Label>
              <Input
                id="dbName"
                value={data.dbName}
                onChange={(e) => updateData('dbName', e.target.value)}
                placeholder="prime_shop"
              />
              <p className="text-xs text-muted-foreground">
                Database sẽ được tạo tự động nếu chưa tồn tại
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dbUser">Username</Label>
              <Input
                id="dbUser"
                value={data.dbUser}
                onChange={(e) => updateData('dbUser', e.target.value)}
                placeholder="root"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dbPassword">Password</Label>
              <div className="relative">
                <Input
                  id="dbPassword"
                  type={showPasswords.dbPassword ? 'text' : 'password'}
                  value={data.dbPassword}
                  onChange={(e) => updateData('dbPassword', e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => togglePassword('dbPassword')}
                >
                  {showPasswords.dbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={testDatabaseConnection}
                disabled={testingDb}
              >
                {testingDb ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Test kết nối
              </Button>
              
              {dbTestResult && (
                <Badge variant={dbTestResult.success ? 'default' : 'destructive'}>
                  {dbTestResult.success ? (
                    <><Check className="h-3 w-3 mr-1" /> Thành công</>
                  ) : (
                    <><X className="h-3 w-3 mr-1" /> Thất bại</>
                  )}
                </Badge>
              )}
            </div>
            
            {dbTestResult && !dbTestResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi kết nối</AlertTitle>
                <AlertDescription>{dbTestResult.message}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        );

      case 2: // Admin
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="adminUsername">Username Admin</Label>
              <Input
                id="adminUsername"
                value={data.adminUsername}
                onChange={(e) => updateData('adminUsername', e.target.value)}
                placeholder="admin"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Admin</Label>
              <Input
                id="adminEmail"
                type="email"
                value={data.adminEmail}
                onChange={(e) => updateData('adminEmail', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPasswords.adminPassword ? 'text' : 'password'}
                  value={data.adminPassword}
                  onChange={(e) => updateData('adminPassword', e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => togglePassword('adminPassword')}
                >
                  {showPasswords.adminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mật khẩu mạnh: ít nhất 8 ký tự, bao gồm chữ và số
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPasswordConfirm">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="adminPasswordConfirm"
                  type={showPasswords.adminPasswordConfirm ? 'text' : 'password'}
                  value={data.adminPasswordConfirm}
                  onChange={(e) => updateData('adminPasswordConfirm', e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => togglePassword('adminPasswordConfirm')}
                >
                  {showPasswords.adminPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {data.adminPassword && data.adminPasswordConfirm && data.adminPassword !== data.adminPasswordConfirm && (
                <p className="text-xs text-destructive">Mật khẩu không khớp</p>
              )}
            </div>
          </motion.div>
        );

      case 3: // Site
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="siteName">Tên Website</Label>
              <Input
                id="siteName"
                value={data.siteName}
                onChange={(e) => updateData('siteName', e.target.value)}
                placeholder="Prime Shop"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteUrl">URL Website</Label>
              <Input
                id="siteUrl"
                value={data.siteUrl}
                onChange={(e) => updateData('siteUrl', e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Không có dấu / ở cuối
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Email hỗ trợ</Label>
              <Input
                id="supportEmail"
                type="email"
                value={data.supportEmail}
                onChange={(e) => updateData('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Email gửi thông báo</Label>
              <Input
                id="senderEmail"
                type="email"
                value={data.senderEmail}
                onChange={(e) => updateData('senderEmail', e.target.value)}
                placeholder="noreply@example.com"
              />
            </div>
          </motion.div>
        );

      case 4: // Email SMTP
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Tùy chọn</AlertTitle>
              <AlertDescription>
                Bạn có thể bỏ qua phần này và cấu hình sau trong Admin Panel.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={data.smtpHost}
                  onChange={(e) => updateData('smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={data.smtpPort}
                  onChange={(e) => updateData('smtpPort', e.target.value)}
                  placeholder="587"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={data.smtpUser}
                onChange={(e) => updateData('smtpUser', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password / App Password</Label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPasswords.smtpPassword ? 'text' : 'password'}
                  value={data.smtpPassword}
                  onChange={(e) => updateData('smtpPassword', e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => togglePassword('smtpPassword')}
                >
                  {showPasswords.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Với Gmail: Sử dụng App Password thay vì mật khẩu thường
              </p>
            </div>
          </motion.div>
        );

      case 5: // Review
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {isSubmitting ? (
              <div className="py-8">
                <div className="text-center mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Đang thiết lập...</h3>
                </div>
                
                <Progress value={setupProgress} className="mb-4" />
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {setupStatus.map((status, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      {status}
                    </motion.p>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Database className="h-4 w-4 text-blue-500" />
                      Database
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Host:</span>
                      <span>{data.dbHost}:{data.dbPort}</span>
                      <span className="text-muted-foreground">Database:</span>
                      <span>{data.dbName}</span>
                      <span className="text-muted-foreground">User:</span>
                      <span>{data.dbUser}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-green-500" />
                      Admin
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Username:</span>
                      <span>{data.adminUsername}</span>
                      <span className="text-muted-foreground">Email:</span>
                      <span>{data.adminEmail}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4 text-purple-500" />
                      Website
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Tên:</span>
                      <span>{data.siteName}</span>
                      <span className="text-muted-foreground">URL:</span>
                      <span className="truncate">{data.siteUrl}</span>
                    </div>
                  </div>
                  
                  {data.smtpHost && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4 text-orange-500" />
                        Email SMTP
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{data.smtpHost}:{data.smtpPort}</span>
                        <span className="text-muted-foreground">User:</span>
                        <span>{data.smtpUser}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lưu ý quan trọng</AlertTitle>
                  <AlertDescription>
                    Quá trình setup sẽ tạo database, import dữ liệu mẫu và tạo tài khoản admin. 
                    Vui lòng không đóng trình duyệt trong quá trình này.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Setup Wizard</CardTitle>
                  <CardDescription>Bước {currentStep + 1} / {steps.length}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                {(() => {
                  const StepIcon = steps[currentStep].icon;
                  return StepIcon ? <StepIcon className="h-3 w-3" /> : null;
                })()}
                {steps[currentStep].title}
              </Badge>
            </div>
            
            {/* Progress bar */}
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1 cursor-pointer transition-all",
                    i <= currentStep ? "opacity-100" : "opacity-40"
                  )}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      i < currentStep
                        ? "bg-green-500 text-white"
                        : i === currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </CardContent>
          
          <div className="border-t p-6 flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={runSetup}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu Setup'}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Tiếp tục
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SetupPage;
