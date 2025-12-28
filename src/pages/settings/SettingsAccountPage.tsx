import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Briefcase, GraduationCap, Globe, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsContext {
  profile: any;
  vipLevel: any;
  formatPrice: (n: number) => string;
  t: (key: string) => string;
}

export default function SettingsAccountPage() {
  const { t } = useOutletContext<SettingsContext>();
  const { profile, refreshProfile } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState((profile as any)?.bio || '');
  const [nickname, setNickname] = useState((profile as any)?.nickname || '');
  const [location, setLocation] = useState((profile as any)?.location || '');
  const [workplace, setWorkplace] = useState((profile as any)?.workplace || '');
  const [school, setSchool] = useState((profile as any)?.school || '');
  const [website, setWebsite] = useState((profile as any)?.website || '');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio((profile as any)?.bio || '');
      setNickname((profile as any)?.nickname || '');
      setLocation((profile as any)?.location || '');
      setWorkplace((profile as any)?.workplace || '');
      setSchool((profile as any)?.school || '');
      setWebsite((profile as any)?.website || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          bio,
          nickname,
          location,
          workplace,
          school,
          website,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success(t('updateSuccess'));
      refreshProfile();
    } catch (error: any) {
      toast.error(t('updateError') || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('personalInfo')}
          </CardTitle>
          <CardDescription>{t('updateAccountInfo')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input value={profile.email} disabled className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label>{t('fullName')}</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('enterFullName')}
              />
            </div>

            <div className="space-y-2">
              <Label>Biệt danh / Nickname</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nhập biệt danh của bạn"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('enterPhone')}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Địa chỉ / Thành phố
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Hà Nội, Việt Nam"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Nơi làm việc
              </Label>
              <Input
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                placeholder="Công ty ABC"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Trường học
              </Label>
              <Input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Đại học XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Website
              </Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Giới thiệu bản thân</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Viết vài dòng về bản thân..."
              rows={3}
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
