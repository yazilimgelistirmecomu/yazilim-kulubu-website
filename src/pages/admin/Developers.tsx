import { Plus, Search, Edit2, Trash2, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { DeveloperAvatar } from '@/components/shared/DeveloperModal';
import { developerService, type Developer } from "@/api/services/developers";
import { storageService } from "@/api/services/storage";
import { ImageField } from "@/components/shared/ImageField";

type DeveloperRow = Developer & {
  project_developers?: { project_id: string; projects: { title: string } | null }[];
};

const emptyForm = {
  full_name: '',
  email: '',
  linkedin_url: '',
  github_url: '',
  instagram_url: '',
  website_url: '',
};

const inputClass = "w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]";

export function Developers() {
  const [developers, setDevelopers] = useState<DeveloperRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<DeveloperRow | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DeveloperRow | null>(null);

  const fetchDevelopers = async () => {
    setIsLoading(true);
    try {
      setDevelopers((await developerService.getAllDevelopers()) as unknown as DeveloperRow[]);
    } catch (error) {
      console.error("Geliştiriciler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleAdd = () => {
    setSelected(null);
    setFormData(emptyForm);
    setImageFile(null);
    setRemoveAvatar(false);
    setIsModalOpen(true);
  };

  const handleEdit = (dev: DeveloperRow) => {
    setSelected(dev);
    setFormData({
      full_name: dev.full_name,
      email: dev.email || '',
      linkedin_url: dev.linkedin_url || '',
      github_url: dev.github_url || '',
      instagram_url: dev.instagram_url || '',
      website_url: dev.website_url || '',
    });
    setImageFile(null);
    setRemoveAvatar(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const oldAvatarUrl = selected?.avatar_url ?? null;
      let avatarUrl = removeAvatar ? null : oldAvatarUrl;
      if (imageFile) {
        avatarUrl = await storageService.uploadImage('project-images', imageFile, 'developers');
      }

      const payload = { ...formData, avatar_url: avatarUrl };
      if (selected) {
        await developerService.updateDeveloper(selected.id, payload);
      } else {
        await developerService.createDeveloper(payload);
      }
      if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        await storageService.deleteImagesByUrl([oldAvatarUrl]);
      }
      await fetchDevelopers();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Geliştirici kaydedilemedi:", error);
      alert("Bir hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteDeveloper = async () => {
    if (!confirmDelete) return;
    try {
      await developerService.deleteDeveloper(confirmDelete.id);
      setDevelopers(list => list.filter(d => d.id !== confirmDelete.id));
    } catch (error) {
      console.error("Geliştirici silinemedi:", error);
      alert("Geliştirici silinemedi.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = developers.filter(d =>
    d.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteProjects = confirmDelete?.project_developers?.map(pd => pd.projects?.title).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><span className="text-[var(--brand-primary)]">&gt;_</span> Geliştiriciler</h1>
        <Button variant="primary" className="flex items-center gap-2 font-mono" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> ./yeni-gelistirici.sh
        </Button>
      </div>

      <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-default">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="> Geliştirici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
              <p>Geliştiriciler yükleniyor...</p>
            </div>
          ) : developers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
              <span className="text-4xl opacity-20">👤</span>
              <p>Henüz geliştirici eklenmemiş.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
              <Search className="w-12 h-12 opacity-20" />
              <p>Aranan kriterlere uygun geliştirici bulunamadı.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-default">
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Geliştirici</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Projeler</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filtered.map(dev => {
                  const titles = dev.project_developers?.map(pd => pd.projects?.title).filter(Boolean) ?? [];
                  return (
                    <tr key={dev.id} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <DeveloperAvatar developer={dev} className="w-10 h-10 text-sm" />
                          <span className="font-bold text-sm text-primary">{dev.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted">
                        {titles.length > 0 ? titles.join(', ') : <span className="opacity-60">Hiçbir projeye atanmamış</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(dev)} className="p-2 text-muted hover:text-[var(--brand-primary)] bg-surface hover:bg-page border border-default rounded-lg transition-colors cursor-pointer" title="Düzenle">
                            <Edit2 className="w-4 h-4 pointer-events-none" />
                          </button>
                          <button onClick={() => setConfirmDelete(dev)} className="p-2 text-muted hover:text-[var(--color-danger)] bg-surface hover:bg-[var(--color-danger)]/10 border border-default hover:border-[var(--color-danger)]/20 rounded-lg transition-colors cursor-pointer" title="Sil">
                            <Trash2 className="w-4 h-4 pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selected ? ">_ Geliştiriciyi Düzenle" : ">_ Yeni Geliştirici Ekle"}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Ad Soyad</label>
            <input type="text" required maxLength={120} value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="Örn: Ayşe Yılmaz" className={inputClass} />
          </div>

          <ImageField
            variant="avatar"
            label="Fotoğraf (opsiyonel)"
            currentUrl={selected?.avatar_url}
            file={imageFile}
            removed={removeAvatar}
            onFileChange={e => { setImageFile(e.target.files?.[0] || null); setRemoveAvatar(false); }}
            onRemove={() => { setImageFile(null); setRemoveAvatar(true); }}
          />

          <p className="text-xs text-muted font-medium bg-surface border border-default rounded-xl p-3">
            Aşağıdaki iletişim bilgileri proje sayfasında herkese açık gösterilir. Boş bıraktığınız alanlar gösterilmez.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">E-posta</label>
            <input type="email" maxLength={254} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ornek@mail.com" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">LinkedIn</label>
              <input type="url" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">GitHub</label>
              <input type="url" value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} placeholder="https://github.com/..." className={inputClass} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Instagram</label>
            <input type="url" value={formData.instagram_url} onChange={e => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/..." className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Kişisel Web Sitesi</label>
            <input type="url" value={formData.website_url} onChange={e => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-default">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Geliştiriciyi Sil">
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-primary">Emin misiniz?</h3>
            <p className="text-muted">
              <strong className="text-primary">{confirmDelete?.full_name}</strong> silinecek. Bu işlem geri alınamaz.
              {deleteProjects.length > 0 && <> Şu projelerden de çıkarılacak: {deleteProjects.join(', ')}.</>}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={confirmDeleteDeveloper} className="flex-1 bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white">Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
