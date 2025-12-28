import { Link } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown, Facebook, Youtube, Instagram } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import bidvLogo from '@/assets/banks/bidv.webp';
import visaMastercardLogo from '@/assets/banks/visa-mastercard.webp';
import vietcombankLogo from '@/assets/banks/vietcombank.webp';
import paypalLogo from '@/assets/banks/paypal.png';

interface FooterProps {
  className?: string;
}

// TikTok icon component
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

export function Footer({ className }: FooterProps) {
  const { data: siteName } = useSiteSetting('site_name');
  const { data: supportEmail } = useSiteSetting('support_email');
  const { data: companyPhone } = useSiteSetting('company_phone');
  const { data: dmcaBadgeUrl } = useSiteSetting('dmca_badge_url');
  const { language } = useLanguage();
  
  const [openSections, setOpenSections] = useState<string[]>([]);

  const displayName = String(siteName || 'DigiShop').replace(/"/g, '');
  const dmcaUrl = dmcaBadgeUrl ? String(dmcaBadgeUrl).replace(/"/g, '') : '';

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const bankLogos = [
    { name: 'Visa/Mastercard', src: visaMastercardLogo },
    { name: 'PayPal', src: paypalLogo },
    { name: 'BIDV', src: bidvLogo },
    { name: 'Vietcombank', src: vietcombankLogo },
  ];

  const footerSections = [
    {
      id: 'about',
      title: language === 'vi' ? `Về ${displayName}` : `About ${displayName}`,
      links: [
        { label: language === 'vi' ? 'Giới thiệu' : 'About us', href: '/about' },
        { label: language === 'vi' ? 'Giới thiệu bạn bè' : 'Referral', href: '/referral' },
        { label: language === 'vi' ? 'Liên hệ' : 'Contact', href: '/contact' },
      ]
    },
    {
      id: 'shopping',
      title: language === 'vi' ? 'Mua sắm' : 'Shopping',
      links: [
        { label: language === 'vi' ? 'Sản phẩm' : 'Products', href: '/products' },
        { label: language === 'vi' ? 'Khuyến mãi' : 'Promotions', href: '/promotions' },
        { label: language === 'vi' ? 'Tra cứu đơn hàng' : 'Order lookup', href: '/order-lookup' },
      ]
    },
    {
      id: 'legal',
      title: language === 'vi' ? 'Pháp lý' : 'Legal',
      links: [
        { label: language === 'vi' ? 'Điều khoản sử dụng' : 'Terms of service', href: '/terms' },
        { label: language === 'vi' ? 'Chính sách bảo mật' : 'Privacy policy', href: '/privacy' },
        { label: language === 'vi' ? 'Chính sách hoàn tiền' : 'Refund policy', href: '/refund-policy' },
      ]
    },
    {
      id: 'support',
      title: language === 'vi' ? 'Hỗ trợ' : 'Support',
      links: [
        { label: language === 'vi' ? 'Trung tâm trợ giúp' : 'Help center', href: '/support' },
        { label: `Email: ${supportEmail ? String(supportEmail) : 'support@example.com'}`, href: `mailto:${supportEmail || 'support@example.com'}` },
        { label: `Hotline: ${companyPhone ? String(companyPhone) : '1900 xxxx'}`, href: `tel:${companyPhone || ''}` },
      ]
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: TikTokIcon, href: '#', label: 'TikTok', isCustom: true },
  ];

  return (
    <footer className={cn("bg-[#1a1a1f] text-slate-200 pb-20 md:pb-0", className)}>
      <div className="container py-8">
        {/* Payment logos */}
        <div className="flex flex-wrap gap-3 justify-start mb-8 pb-8 border-b border-slate-700/50">
          {bankLogos.map((bank) => (
            <div 
              key={bank.name}
              className="h-8 flex items-center bg-white rounded px-2"
            >
              <img src={bank.src} alt={bank.name} className="h-6 w-auto object-contain" />
            </div>
          ))}
        </div>

        {/* Collapsible sections - Mobile */}
        <div className="md:hidden space-y-0">
          {footerSections.map((section) => (
            <Collapsible 
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-4 border-b border-slate-700/50">
                <span className="font-semibold text-white">{section.title}</span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    openSections.includes(section.id) && "rotate-180"
                  )} 
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="py-3 space-y-2">
                {section.links.map((link, idx) => (
                  <Link 
                    key={idx}
                    to={link.href}
                    className="block text-sm text-slate-400 hover:text-primary transition-colors py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Grid layout - Desktop */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.id}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <Link 
                      to={link.href}
                      className="text-sm text-slate-400 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* DMCA Badge */}
        {dmcaUrl && (
          <div className="flex justify-center md:justify-start py-6 border-t border-slate-700/50">
            <a 
              href={dmcaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 rounded px-4 py-2 flex items-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-bold text-white bg-slate-600 px-2 py-0.5 rounded">DMCA</span>
              <span className="text-xs text-slate-300">PROTECTED</span>
            </a>
          </div>
        )}

        {/* Social links */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-400 mb-4">
            {language === 'vi' ? 'Hãy cập nhật với chúng tôi' : 'Stay connected with us'}
          </p>
          <div className="flex justify-center gap-6">
            {socialLinks.map((social) => (
              <a 
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label={social.label}
              >
                {social.isCustom ? (
                  <social.icon />
                ) : (
                  <social.icon className="w-6 h-6" />
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {displayName}. {language === 'vi' ? 'Tất cả quyền được bảo lưu' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </footer>
  );
}
