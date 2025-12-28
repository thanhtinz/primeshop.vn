import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, LogOut, Users, DollarSign, Gift, Check, Edit2, Send, Loader2, Clock, CheckCircle2, XCircle, UserPlus, LogIn, Link2, Search, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { sendDiscordNotification } from '@/hooks/useDiscordNotify';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useProducts } from '@/hooks/useProducts';

interface ReferralRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface ReferralData {
  id: string;
  code: string;
  email: string;
  total_referrals: number;
  total_credits: number;
  available_credits: number;
}

interface ReferralTransaction {
  id: string;
  order_id: string;
  credit_amount: number;
  status: string;
  created_at: string;
}

type ViewState = 'check' | 'register' | 'pending' | 'rejected' | 'verify' | 'dashboard';

// Component to generate product referral links
const ProductReferralLinkGenerator = ({ referralCode }: { referralCode: string }) => {
  const { t } = useLanguage();
  const { data: products, isLoading } = useProducts(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10) || [];

  const generateLink = (productSlug: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/product/${productSlug}?ref=${referralCode}`;
  };

  const handleCopyLink = (productId: string, productSlug: string) => {
    const link = generateLink(productSlug);
    navigator.clipboard.writeText(link);
    setCopiedProductId(productId);
    toast.success(t('copiedToClipboard') || 'Đã sao chép link');
    setTimeout(() => setCopiedProductId(null), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Link2 className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t('productReferralLinks') || 'Link giới thiệu theo sản phẩm'}</h3>
          <p className="text-sm text-muted-foreground">{t('productReferralLinksDesc') || 'Tạo link giới thiệu cho từng sản phẩm, tự động áp dụng mã khi khách mua hàng'}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchProducts') || 'Tìm sản phẩm...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {generateLink(product.slug)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`/product/${product.slug}?ref=${referralCode}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCopyLink(product.id, product.slug)}
                >
                  {copiedProductId === product.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : searchTerm ? (
        <p className="text-center text-muted-foreground py-6">
          {t('noProductsFound') || 'Không tìm thấy sản phẩm'}
        </p>
      ) : (
        <p className="text-center text-muted-foreground py-6">
          {t('typeToSearchProducts') || 'Nhập tên sản phẩm để tìm kiếm'}
        </p>
      )}
    </div>
  );
};

const ReferralPage = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [viewState, setViewState] = useState<ViewState>('check');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get dynamic referral percentage
  const referralPercent = siteSettings?.referral_commission_percent || 10;
  const minRedemption = siteSettings?.min_reward_redemption || 50000;
  
  // Registration form
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    note: '',
  });
  
  // Data states
  const [registration, setRegistration] = useState<ReferralRegistration | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');

  // Auto-check status for logged in users
  useEffect(() => {
    if (!authLoading && user && profile?.email) {
      setEmail(profile.email);
      autoCheckStatus(profile.email);
    }
  }, [authLoading, user, profile]);

  // Auto check status for logged in users
  const autoCheckStatus = async (userEmail: string) => {
    setIsLoading(true);
    try {
      // Check registration
      const { data: regData, error: regError } = await supabase
        .from('referral_registrations')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle();

      if (regError) throw regError;

      if (!regData) {
        // Not registered - show registration form with prefilled email
        setRegForm(prev => ({ 
          ...prev, 
          email: userEmail,
          full_name: profile?.full_name || ''
        }));
        setViewState('register');
        return;
      }

      setRegistration(regData);

      if (regData.status === 'pending') {
        setViewState('pending');
      } else if (regData.status === 'rejected') {
        setViewState('rejected');
      } else if (regData.status === 'approved') {
        // Auto-verify and load dashboard
        await loadDashboard(userEmail);
      }
    } catch (error) {
      console.error('Auto check error:', error);
      setViewState('check');
    } finally {
      setIsLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboard = async (userEmail: string) => {
    try {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle();

      if (!refCode) {
        toast.error(t('noReferralCode'));
        return;
      }

      setReferralData(refCode);
      setNewCode(refCode.code);

      // Fetch transactions
      const { data: txData } = await supabase
        .from('referral_transactions')
        .select('*')
        .eq('referral_code_id', refCode.id)
        .order('created_at', { ascending: false });

      setTransactions(txData || []);
      setViewState('dashboard');
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  // Check registration status by email (for non-logged in users)
  const handleCheckEmail = async () => {
    if (!email) {
      toast.error(t('pleaseEnterEmail'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('emailInvalid'));
      return;
    }

    setIsLoading(true);
    try {
      // Check if already registered
      const { data: regData, error: regError } = await supabase
        .from('referral_registrations')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (regError) throw regError;

      if (!regData) {
        // Not registered yet - show registration form
        setRegForm(prev => ({ ...prev, email: email }));
        setViewState('register');
        return;
      }

      setRegistration(regData);

      if (regData.status === 'pending') {
        setViewState('pending');
      } else if (regData.status === 'rejected') {
        setViewState('rejected');
      } else if (regData.status === 'approved') {
        setViewState('verify');
      }
    } catch (error) {
      console.error('Check error:', error);
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit registration
  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.email) {
      toast.error(t('pleaseEnter') + ' ' + t('fullName').toLowerCase() + ' ' + t('email').toLowerCase());
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regForm.email)) {
      toast.error(t('emailInvalid'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_registrations')
        .insert({
          full_name: regForm.full_name.trim(),
          email: regForm.email.toLowerCase().trim(),
          phone: regForm.phone.trim() || null,
          note: regForm.note.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error(t('emailAlreadyRegistered'));
        } else {
          throw error;
        }
        return;
      }

      setRegistration(data);
      setViewState('pending');
      toast.success(t('registerSuccess'));

      // Send Discord notification
      sendDiscordNotification('new_referral_registration', {
        full_name: regForm.full_name.trim(),
        email: regForm.email.toLowerCase().trim(),
        phone: regForm.phone.trim() || undefined,
        note: regForm.note.trim() || undefined,
      });
    } catch (error) {
      console.error('Register error:', error);
      toast.error(t('registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Verify and load referral data (for non-logged in users)
  const handleVerify = async () => {
    if (!email) {
      toast.error(t('pleaseEnterEmail'));
      return;
    }

    setIsLoading(true);
    try {
      // Check registration is approved
      const { data: regData } = await supabase
        .from('referral_registrations')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'approved')
        .maybeSingle();

      if (!regData) {
        toast.error(t('emailNotApproved'));
        return;
      }

      await loadDashboard(email);
      toast.success(t('verifySuccess'));
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (referralData) {
      navigator.clipboard.writeText(referralData.code);
      toast.success(t('copiedReferralCode'));
    }
  };

  const handleUpdateCode = async () => {
    if (!newCode || newCode.length < 4) {
      toast.error(t('codeMinLength'));
      return;
    }

    if (!referralData) return;

    try {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', newCode.toUpperCase())
        .neq('id', referralData.id)
        .maybeSingle();

      if (existing) {
        toast.error(t('codeInUse'));
        return;
      }

      const { error } = await supabase
        .from('referral_codes')
        .update({ code: newCode.toUpperCase() })
        .eq('id', referralData.id);

      if (error) throw error;

      setReferralData({ ...referralData, code: newCode.toUpperCase() });
      setIsEditingCode(false);
      toast.success(`${t('codeUpdated')}: ${newCode.toUpperCase()}`);
    } catch (error) {
      toast.error(t('codeUpdateError'));
    }
  };

  const handleRequestReward = async () => {
    if (!referralData || referralData.available_credits <= 0) {
      toast.error(t('noCreditsToRedeem'));
      return;
    }

    try {
      const { error } = await supabase.from('reward_requests').insert({
        referral_code_id: referralData.id,
        amount: referralData.available_credits,
        status: 'pending',
      });

      if (error) throw error;

      // Send Discord notification
      sendDiscordNotification('reward_request', {
        email: referralData.email,
        referral_code: referralData.code,
        amount: referralData.available_credits,
      });

      toast.success(t('rewardRequestSent'));
    } catch (error) {
      toast.error(t('rewardRequestError'));
    }
  };

  const handleLogout = () => {
    if (user) {
      // If logged in, can't logout from referral
      return;
    }
    setViewState('check');
    setEmail('');
    setReferralData(null);
    setRegistration(null);
    setTransactions([]);
  };

  const navigate = useNavigate();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  // Require login
  if (!user) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">{t('loginToContinue')}</h1>
              <p className="text-muted-foreground mb-6">
                {t('pleaseLoginToJoinReferral')}
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full h-12">
                <LogIn className="h-5 w-5 mr-2" />
                {t('login')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading while fetching data
  if (isLoading && viewState === 'check') {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('referralProgram')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('referAndEarn')} <span className="text-primary font-semibold">{referralPercent}%</span>
            </p>
          </div>

          {/* Check Email View (only for non-logged in users) */}
          {viewState === 'check' && !user && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Info */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
                <h2 className="text-xl font-bold text-foreground">{t('howItWorks')}</h2>
                <ul className="mt-4 space-y-4">
                  <li className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-foreground">{t('joinReferral')}</p>
                      <p className="text-sm text-muted-foreground">{t('fillInfoAndWait')}</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-foreground">{t('getReferralCode')}</p>
                      <p className="text-sm text-muted-foreground">{t('afterApprovalGetCode')}</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
                    <div>
                      <p className="font-semibold text-foreground">{t('getReward')}</p>
                      <p className="text-sm text-muted-foreground">{t('accumulateCommission')}</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Check Form */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">{t('checkStatus')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('enterEmailToCheck')}
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckEmail()}
                      className="h-12"
                    />
                  </div>
                  <Button onClick={handleCheckEmail} className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('continue')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form View */}
          {viewState === 'register' && (
            <div className="max-w-md mx-auto">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{t('joinReferral')}</h2>
                    <p className="text-sm text-muted-foreground">{t('fillInfoAndWait')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('fullNameRequired')}</Label>
                    <Input
                      id="full_name"
                      placeholder="Nguyễn Văn A"
                      value={regForm.full_name}
                      onChange={(e) => setRegForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg_email">{t('emailRequired')}</Label>
                    <Input
                      id="reg_email"
                      type="email"
                      placeholder="email@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-12"
                      disabled={!!user}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      placeholder="0912345678"
                      value={regForm.phone}
                      onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">{t('noteOptional')}</Label>
                    <Textarea
                      id="note"
                      placeholder={t('reasonToJoin')}
                      value={regForm.note}
                      onChange={(e) => setRegForm(prev => ({ ...prev, note: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleRegister} className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('submitRegister')}
                  </Button>
                  {!user && (
                    <Button variant="ghost" onClick={() => setViewState('check')} className="w-full">
                      {t('goBack')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pending View */}
          {viewState === 'pending' && (
            <div className="max-w-md mx-auto">
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-warning" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t('pendingApproval')}</h2>
                <p className="text-muted-foreground mb-4">
                  {t('requestUnderReview')}
                </p>
                {registration && (
                  <div className="text-left rounded-lg bg-secondary/50 p-4 text-sm space-y-1">
                    <p><span className="text-muted-foreground">{t('nameLabel')}</span> <span className="font-medium">{registration.full_name}</span></p>
                    <p><span className="text-muted-foreground">{t('emailLabel')}</span> <span className="font-medium">{registration.email}</span></p>
                    <p><span className="text-muted-foreground">{t('registerDateLabel')}</span> <span className="font-medium">{new Date(registration.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}</span></p>
                  </div>
                )}
                {!user && (
                  <Button variant="outline" onClick={() => setViewState('check')} className="mt-6">
                    {t('goBack')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Rejected View */}
          {viewState === 'rejected' && (
            <div className="max-w-md mx-auto">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t('requestRejected')}</h2>
                <p className="text-muted-foreground mb-4">
                  {t('sorryRequestRejected')}
                </p>
                {registration?.admin_notes && (
                  <div className="text-left rounded-lg bg-secondary/50 p-4 text-sm mb-4">
                    <p className="text-muted-foreground">{t('reasonLabel')}</p>
                    <p className="font-medium">{registration.admin_notes}</p>
                  </div>
                )}
                {!user && (
                  <Button variant="outline" onClick={() => setViewState('check')}>
                    {t('goBack')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Verify View (only for non-logged in users) */}
          {viewState === 'verify' && !user && (
            <div className="max-w-md mx-auto">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{t('accountApproved')}</h2>
                    <p className="text-sm text-muted-foreground">{t('verifyToEnterDashboard')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify_email">{t('email')}</Label>
                    <Input
                      id="verify_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <Button onClick={handleVerify} className="w-full h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('enterDashboard')}
                  </Button>
                  <Button variant="ghost" onClick={() => setViewState('check')} className="w-full">
                    {t('goBack')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {viewState === 'dashboard' && referralData && (
            <div className="space-y-6">
              {/* Header with logout (only for non-logged in) */}
              {!user && (
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('loggedInAs')}</p>
                    <p className="font-semibold text-foreground">{referralData.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    {t('logout')}
                  </Button>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('totalReferrals')}</p>
                      <p className="text-2xl font-bold">{referralData.total_referrals}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('totalCommission')}</p>
                      <p className="text-2xl font-bold">{formatPrice(referralData.total_credits)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('availableCommission')}</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(referralData.available_credits)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Code */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">{t('yourReferralCode')}</h3>
                <div className="flex items-center gap-3">
                  {isEditingCode ? (
                    <>
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        className="font-mono text-xl tracking-wider"
                        maxLength={12}
                      />
                      <Button onClick={handleUpdateCode} size="icon">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setIsEditingCode(false);
                        setNewCode(referralData.code);
                      }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 rounded-lg bg-secondary/50 p-4 font-mono text-2xl tracking-wider text-center">
                        {referralData.code}
                      </div>
                      <Button variant="outline" size="icon" onClick={handleCopyCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setIsEditingCode(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {t('shareCodeToEarn')} ({referralPercent}%)
                </p>
              </div>

              {/* Product Referral Links */}
              <ProductReferralLinkGenerator referralCode={referralData.code} />

              {/* Request Reward */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('redeemReward')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('redeemCommissionToVoucher')} ({t('minimum')} {formatPrice(minRedemption)})
                    </p>
                  </div>
                  <Button 
                    onClick={handleRequestReward}
                    disabled={referralData.available_credits < minRedemption}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t('requestReward')}
                  </Button>
                </div>
              </div>

              {/* Transaction History */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">{t('transactionHistory')}</h3>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">+{formatPrice(tx.credit_amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                          </p>
                        </div>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status === 'completed' ? t('completed') : t('processingStatus')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('noTransactionsYet')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReferralPage;