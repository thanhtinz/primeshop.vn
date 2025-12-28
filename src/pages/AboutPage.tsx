import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Users, Zap, Award, Globe, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  const { data: siteName } = useSiteSetting('site_name');
  const { t, language } = useLanguage();
  const displayName = String(siteName || 'DigiShop').replace(/"/g, '');

  const features = [
    {
      icon: Shield,
      title: language === 'vi' ? 'An toàn & Bảo mật' : 'Safe & Secure',
      description: language === 'vi' 
        ? 'Mọi giao dịch được bảo vệ với công nghệ mã hóa tiên tiến nhất'
        : 'All transactions are protected with advanced encryption technology'
    },
    {
      icon: Zap,
      title: language === 'vi' ? 'Giao hàng nhanh chóng' : 'Fast Delivery',
      description: language === 'vi'
        ? 'Sản phẩm được giao ngay lập tức sau khi thanh toán thành công'
        : 'Products delivered instantly after successful payment'
    },
    {
      icon: Users,
      title: language === 'vi' ? 'Hỗ trợ 24/7' : '24/7 Support',
      description: language === 'vi'
        ? 'Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn mọi lúc mọi nơi'
        : 'Support team always ready to help you anytime, anywhere'
    },
    {
      icon: Award,
      title: language === 'vi' ? 'Chất lượng đảm bảo' : 'Quality Guaranteed',
      description: language === 'vi'
        ? 'Cam kết sản phẩm chính hãng, hoàn tiền nếu không hài lòng'
        : 'Guaranteed authentic products, refund if not satisfied'
    },
    {
      icon: Globe,
      title: language === 'vi' ? 'Đa dạng sản phẩm' : 'Wide Selection',
      description: language === 'vi'
        ? 'Hàng ngàn sản phẩm số từ các nhà cung cấp uy tín'
        : 'Thousands of digital products from trusted providers'
    },
    {
      icon: HeartHandshake,
      title: language === 'vi' ? 'Cộng đồng lớn mạnh' : 'Strong Community',
      description: language === 'vi'
        ? 'Hàng triệu khách hàng tin tưởng và sử dụng dịch vụ của chúng tôi'
        : 'Millions of customers trust and use our services'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {language === 'vi' ? `Về ${displayName}` : `About ${displayName}`}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {language === 'vi' 
              ? `${displayName} là nền tảng thương mại điện tử hàng đầu Việt Nam chuyên cung cấp các sản phẩm số như game key, thẻ nạp, phần mềm và nhiều dịch vụ số khác.`
              : `${displayName} is Vietnam's leading e-commerce platform specializing in digital products such as game keys, top-up cards, software and many other digital services.`
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card rounded-xl p-6 text-center border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1M+</div>
            <div className="text-sm text-muted-foreground">
              {language === 'vi' ? 'Khách hàng' : 'Customers'}
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
            <div className="text-sm text-muted-foreground">
              {language === 'vi' ? 'Sản phẩm' : 'Products'}
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99%</div>
            <div className="text-sm text-muted-foreground">
              {language === 'vi' ? 'Hài lòng' : 'Satisfaction'}
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5+</div>
            <div className="text-sm text-muted-foreground">
              {language === 'vi' ? 'Năm hoạt động' : 'Years Active'}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            {language === 'vi' ? 'Tại sao chọn chúng tôi?' : 'Why choose us?'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-card rounded-2xl p-8 md:p-12 border text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {language === 'vi' ? 'Sứ mệnh của chúng tôi' : 'Our Mission'}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {language === 'vi'
              ? `Chúng tôi cam kết mang đến cho khách hàng trải nghiệm mua sắm trực tuyến tốt nhất với các sản phẩm số chất lượng cao, giá cả hợp lý và dịch vụ hỗ trợ tận tâm. ${displayName} không chỉ là nơi mua sắm mà còn là cộng đồng kết nối những người đam mê công nghệ và gaming.`
              : `We are committed to providing customers with the best online shopping experience with high-quality digital products, reasonable prices and dedicated support services. ${displayName} is not just a shopping destination but also a community connecting technology and gaming enthusiasts.`
            }
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
