import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage() {
  const { data: siteName } = useSiteSetting('site_name');
  const { data: supportEmail } = useSiteSetting('support_email');
  const { data: companyPhone } = useSiteSetting('company_phone');
  const { data: companyAddress } = useSiteSetting('company_address');
  const { language } = useLanguage();
  const displayName = String(siteName || 'DigiShop').replace(/"/g, '');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(language === 'vi' 
      ? 'Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm nhất có thể.'
      : 'Message sent! We will respond as soon as possible.'
    );
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: String(supportEmail || 'support@example.com'),
      href: `mailto:${supportEmail || 'support@example.com'}`
    },
    {
      icon: Phone,
      title: language === 'vi' ? 'Điện thoại' : 'Phone',
      value: String(companyPhone || '1900 xxxx'),
      href: `tel:${companyPhone || ''}`
    },
    {
      icon: MapPin,
      title: language === 'vi' ? 'Địa chỉ' : 'Address',
      value: String(companyAddress || 'Việt Nam'),
      href: '#'
    },
    {
      icon: Clock,
      title: language === 'vi' ? 'Giờ làm việc' : 'Working Hours',
      value: language === 'vi' ? '24/7 - Hỗ trợ mọi lúc' : '24/7 - Always available',
      href: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === 'vi' ? 'Liên hệ với chúng tôi' : 'Contact Us'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'vi' 
              ? `Bạn có câu hỏi hoặc cần hỗ trợ? Đội ngũ ${displayName} luôn sẵn sàng giúp đỡ bạn.`
              : `Have questions or need support? The ${displayName} team is always ready to help you.`
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-start gap-4 p-4 bg-card rounded-xl border hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">{item.title}</h3>
                  <p className="text-foreground">{item.value}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'vi' ? 'Gửi tin nhắn' : 'Send a Message'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={language === 'vi' ? 'Nhập họ và tên' : 'Enter your name'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={language === 'vi' ? 'Nhập email' : 'Enter your email'}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    {language === 'vi' ? 'Tiêu đề' : 'Subject'}
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={language === 'vi' ? 'Nhập tiêu đề' : 'Enter subject'}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">
                    {language === 'vi' ? 'Nội dung' : 'Message'}
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={language === 'vi' ? 'Nhập nội dung tin nhắn...' : 'Enter your message...'}
                    rows={5}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting 
                    ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') 
                    : (language === 'vi' ? 'Gửi tin nhắn' : 'Send Message')
                  }
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
