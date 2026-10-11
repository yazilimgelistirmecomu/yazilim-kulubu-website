import { Save, Globe, Lock, Mail, Instagram, Youtube, Linkedin, Loader2, FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from '@/components/shared/Button';
import { useState, useEffect } from "react";
import { supabase } from "@/api/config";
import { DEFAULT_CONTACT_SETTINGS } from "@/hooks/useSiteSettings";
import { IMAGE_INPUT_ACCEPT, storageService } from "@/api/services/storage";

export function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    email: '',
    instagram: '',
    youtube: '',
    linkedin: '',
    // About Page Settings
    aboutTitle: 'Sıralarda Değil, Projelerde Büyüyoruz.',
    aboutMission: 'Yazılım Geliştirme Kulübü, kod yazmanın sadece dersliklerde değil, bir ekip ruhuyla ve gerçek projelerle öğrenileceğine inanan öğrenciler tarafından kuruldu. Amacımız; kendi ufak projelerinden ulusal yarışmalara kadar uzanan bu yolda, beraber üretecek ekip arkadaşı bulmakta zorlanan herkesi tek bir çatı altında toplamak.',
    aboutTarget: 'Bugün 800’e yakın üyemizle; Oyun Geliştirme, Web, Mobil ve Blockchain kollarında sadece teoriyi değil, pratiği konuşuyoruz. ÇOMÜ’nün teknik potansiyelini Game Jam’ler, Hackathon’lar ve workshoplarla sokağa, teknoparklara ve yarışma arenalarına taşıyoruz.',
    aboutVision: 'Bizler sadece öğrenmiyoruz; Çanakkale’den küresel teknoloji dünyasına uzanacak bir topluluğun temellerini beraber atıyoruz.',
    aboutImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200'
  });

  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: any = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        setSettings(prev => ({
          email: settingsMap['contact_email'] || '',
          instagram: settingsMap['social_instagram'] || '',
          youtube: settingsMap['social_youtube'] || '',
          linkedin: settingsMap['social_linkedin'] || '',
          aboutTitle: settingsMap['about_title'] || prev.aboutTitle,
          aboutMission: settingsMap['about_mission'] || prev.aboutMission,
          aboutTarget: settingsMap['about_target'] || prev.aboutTarget,
          aboutVision: settingsMap['about_vision'] || prev.aboutVision,
          aboutImageUrl: settingsMap['about_image_url'] || prev.aboutImageUrl
        }));
      }
    } catch (error) {
      console.error("Ayarlar çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      let finalAboutImageUrl = settings.aboutImageUrl;

      // If a new about image file is selected, upload it to storage
      if (aboutImageFile) {
        finalAboutImageUrl = await storageService.uploadImage('event-covers', aboutImageFile, 'about');
      }

      const updates = [
        { key: 'contact_email', value: settings.email },
        { key: 'social_instagram', value: settings.instagram },
        { key: 'social_youtube', value: settings.youtube },
        { key: 'social_linkedin', value: settings.linkedin },
        { key: 'about_title', value: settings.aboutTitle },
        { key: 'about_mission', value: settings.aboutMission },
        { key: 'about_target', value: settings.aboutTarget },
        { key: 'about_vision', value: settings.aboutVision },
        { key: 'about_image_url', value: finalAboutImageUrl }
      ];

      const { error } = await supabase.from('site_settings').upsert(updates);
      if (error) throw error;

      setSettings(prev => ({ ...prev, aboutImageUrl: finalAboutImageUrl }));
      setAboutImageFile(null);
      alert("Tüm ayarlar ve Hakkımızda içerikleri başarıyla kaydedildi!");
    } catch (error: any) {
      console.error("Ayarlar kaydedilemedi:", error);
      alert("Ayarlar kaydedilirken hata oluştu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Şifreler uyuşmuyor!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
      alert("Şifreniz başarıyla güncellendi!");
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error("Şifre güncellenemedi:", error);
      alert("Şifre güncellenirken hata oluştu: " + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted gap-4 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p>Ayarlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-[var(--brand-primary)]">&gt;_</span> Sistem & İçerik Ayarları
        </h1>
        <Button variant="primary" className="flex items-center gap-2 font-mono" onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sol & Orta Sütun - Ayarlar ve Hakkımızda Yönetimi */}
        <div className="lg:col-span-2 space-y-8">

          {/* Hakkımızda Sayfası İçerik Yönetimi */}
          <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default bg-surface/50">
              <div className="flex items-center gap-3 mb-1">
                <FileText className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-lg font-bold text-primary">Hakkımızda Sayfası Yönetimi</h2>
              </div>
              <p className="text-sm text-muted">Hakkımızda sayfasındaki başlıkları, metinleri ve ana görseli buradan güncelleyebilirsiniz.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Ana Başlık */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary">Ana Slogan / Başlık</label>
                <input
                  type="text"
                  value={settings.aboutTitle}
                  onChange={e => setSettings({ ...settings, aboutTitle: e.target.value })}
                  placeholder="Örn: Sıralarda Değil, Projelerde Büyüyoruz."
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              {/* Misyon */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="font-mono text-[var(--brand-primary)]">[misyon]</span> Metni
                </label>
                <textarea
                  rows={3}
                  value={settings.aboutMission}
                  onChange={e => setSettings({ ...settings, aboutMission: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Hedef */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="font-mono text-[var(--brand-primary)]">[hedef]</span> Metni
                </label>
                <textarea
                  rows={3}
                  value={settings.aboutTarget}
                  onChange={e => setSettings({ ...settings, aboutTarget: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Vizyon */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="font-mono text-[var(--brand-primary)]">[vizyon]</span> Metni
                </label>
                <textarea
                  rows={3}
                  value={settings.aboutVision}
                  onChange={e => setSettings({ ...settings, aboutVision: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Görsel Yükleme */}
              <div className="space-y-2 pt-2 border-t border-default/50">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--brand-primary)]" /> Hakkımızda Sayfası Görseli
                </label>
                
                {/* Mevcut / Önizleme Görsel */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-default bg-surface max-w-md">
                  <img
                    src={aboutImageFile ? URL.createObjectURL(aboutImageFile) : settings.aboutImageUrl}
                    alt="Hakkımızda Görseli Önizleme"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-page border border-default rounded-xl text-sm font-semibold cursor-pointer transition-colors text-primary">
                    <UploadCloud className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span>{aboutImageFile ? aboutImageFile.name : 'Yeni Görsel Seç...'}</span>
                    <input
                      type="file"
                      accept={IMAGE_INPUT_ACCEPT}
                      onChange={e => e.target.files && setAboutImageFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default bg-surface/50">
              <div className="flex items-center gap-3 mb-1">
                <Mail className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-lg font-bold text-primary">Genel İletişim Bilgileri</h2>
              </div>
              <p className="text-sm text-muted">Sitenin footer ve iletişim kısımlarında görünecek bilgiler.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted" /> Resmi E-posta Adresi
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  placeholder={DEFAULT_CONTACT_SETTINGS.email}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Sağ Sütun - Sosyal Medya & Güvenlik */}
        <div className="space-y-8">

          {/* Sosyal Medya */}
          <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default bg-surface/50">
              <h2 className="text-lg font-bold text-primary">Sosyal Medya Linkleri</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-muted" /> Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagram}
                  onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                  placeholder={DEFAULT_CONTACT_SETTINGS.instagram}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-muted" /> YouTube URL
                </label>
                <input
                  type="url"
                  value={settings.youtube}
                  onChange={e => setSettings({ ...settings, youtube: e.target.value })}
                  placeholder={DEFAULT_CONTACT_SETTINGS.youtube}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-muted" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={settings.linkedin}
                  onChange={e => setSettings({ ...settings, linkedin: e.target.value })}
                  placeholder={DEFAULT_CONTACT_SETTINGS.linkedin}
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Admin Güvenlik */}
          <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default bg-surface/50">
              <div className="flex items-center gap-3 mb-1">
                <Lock className="w-5 h-5 text-[var(--color-danger)]" />
                <h2 className="text-lg font-bold text-primary">Güvenlik</h2>
              </div>
              <p className="text-sm text-muted">Yönetici paneli giriş ayarları.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary">Yeni Şifre</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Yeni şifrenizi girin"
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--color-danger)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-primary">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Yeni şifrenizi doğrulayın"
                  className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--color-danger)]"
                />
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordForm.newPassword}
                  className="w-full border-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  {isChangingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
