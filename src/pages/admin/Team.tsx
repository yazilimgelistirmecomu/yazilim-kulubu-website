import { Plus, Search, Edit2, Trash2, Linkedin, Github, Instagram, UploadCloud, AlertTriangle, Loader2, ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useState, useEffect } from "react";
import { supabase } from "@/api/config";
import { storageService } from "@/api/services/storage";
import { ImageField } from "@/components/shared/ImageField";
import { branchService, HIERARCHY_LEVELS, type HierarchyLevel, type TeamBranch } from "@/api/services/team";

const LEVEL_OPTIONS: Record<HierarchyLevel, string> = {
  president: 'Başkan',
  vice_president: 'Başkan Yardımcısı',
  branch_lead: 'Kol Başkanı',
  member: 'Üye',
};

const FIELD = "w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]";

export function Team() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    position: '',
    department: '',
    hierarchy_level: 'member' as HierarchyLevel,
    branch_id: '',
    linkedin_url: '',
    github_url: '',
    instagram_url: '',
    email: '',
    is_public: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [branches, setBranches] = useState<TeamBranch[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setBranches(await branchService.list());
    } catch (error) {
      console.error("Kollar çekilemedi:", error);
    }
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });
        
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Üyeler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [deleteProjects, setDeleteProjects] = useState<string[]>([]);

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
    setDeleteProjects([]);
    supabase
      .from('project_developers')
      .select('projects(title)')
      .eq('profile_id', id)
      .then(({ data }) => {
        setDeleteProjects((data || []).map((r: any) => r.projects?.title).filter(Boolean));
      });
  };

  const confirmDeleteMember = async () => {
    if (confirmDelete !== null) {
      try {
        // Ilgili tablolardaki foreign key referanslarini temizle
        await supabase.from('events').update({ created_by: null }).eq('created_by', confirmDelete);
        await supabase.from('projects').update({ created_by: null }).eq('created_by', confirmDelete);
        await supabase.from('project_members').delete().eq('profile_id', confirmDelete);

        const { error } = await supabase.from('profiles').delete().eq('id', confirmDelete);
        if (error) throw error;
        setMembers(members.filter(m => m.id !== confirmDelete));
      } catch (error: any) {
        console.error("Silinirken hata oluştu:", error);
        alert("Silinirken hata oluştu: " + (error.message || error));
      } finally {
        setConfirmDelete(null);
      }
    }
  };

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      position: member.position || '',
      department: member.department || '',
      hierarchy_level: (HIERARCHY_LEVELS.includes(member.hierarchy_level) ? member.hierarchy_level : 'member') as HierarchyLevel,
      branch_id: member.branch_id || '',
      linkedin_url: member.linkedin_url || '',
      github_url: member.github_url || '',
      instagram_url: member.instagram_url || '',
      email: member.email || '',
      is_public: member.is_public !== false,
    });
    setImageFile(null);
    setRemoveAvatar(false);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setFormData({
      first_name: '',
      last_name: '',
      position: '',
      department: '',
      hierarchy_level: 'member',
      branch_id: '',
      linkedin_url: '',
      github_url: '',
      instagram_url: '',
      email: '',
      is_public: true,
    });
    setImageFile(null);
    setRemoveAvatar(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const oldAvatarUrl: string | null = selectedMember?.avatar_url || null;
      let avatarUrl = removeAvatar ? null : oldAvatarUrl;

      if (imageFile) {
        avatarUrl = await storageService.uploadImage('project-images', imageFile); // Profil fotoları için aynı bucket'ı kullanabiliriz
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        position: formData.position,
        // Preserve an existing admin role when editing that person's public
        // team profile. New display-only members still default to "member".
        role: selectedMember?.role || 'member',
        department: formData.department,
        hierarchy_level: formData.hierarchy_level,
        branch_id: formData.branch_id || null,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        instagram_url: formData.instagram_url,
        email: formData.email.trim() || null,
        avatar_url: avatarUrl,
        is_public: formData.is_public,
      };

      if (selectedMember) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', selectedMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert([{ ...payload, id: crypto.randomUUID() }]);
        if (error) throw error;
      }

      if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        await storageService.deleteImagesByUrl([oldAvatarUrl]);
      }

      await fetchMembers();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Kaydedilirken hata oluştu:", error);
      if (error?.message?.includes('profiles_id_fkey')) {
        alert("Veritabanı kısıtlaması hatası: 'profiles' tablosundaki 'profiles_id_fkey' kısıtlaması kaldırılmalıdır. Lütfen Supabase SQL Editor üzerinden 'ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;' komutunu çalıştırın.");
      } else {
        alert("Bir hata oluştu: " + (error.message || error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sıra: komşuyla yer değiştirme tek RPC ile atomik yapılır
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    setMovingId(id);
    try {
      const { error } = await supabase.rpc('move_team_member', { p_id: id, p_direction: direction });
      if (error) throw error;
      await fetchMembers();
    } catch (error: any) {
      console.error("Sıra değiştirilemedi:", error);
      alert("Sıra değiştirilemedi: " + error.message);
    } finally {
      setMovingId(null);
    }
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
    const position = (member.position || '').toLowerCase();
    const department = (member.department || '').toLowerCase();
    const branch = (branches.find(b => b.id === member.branch_id)?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || position.includes(query) || department.includes(query) || branch.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><span className="text-[var(--brand-primary)]">&gt;_</span> Ekip Yönetimi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" className="flex items-center gap-2 font-mono" onClick={() => setIsBranchModalOpen(true)}>
            <Settings2 className="w-4 h-4" /> Kolları Yönet
          </Button>
          <Button variant="primary" className="flex items-center gap-2 font-mono" onClick={handleAdd}>
            <Plus className="w-4 h-4" /> ./yeni-uye.sh
          </Button>
        </div>
      </div>

      <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden relative">
        <div className="w-full h-8 bg-surface border-b border-default flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-solid)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></div>
          <span className="text-[10px] text-muted ml-4 font-mono">root@ygk-server:~/admin/team</span>
        </div>

        <div className="p-4 border-b border-default flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="> İsim veya rol ara..." 
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
               <p>Ekip listesi yükleniyor...</p>
             </div>
          ) : members.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
               <p>Henüz ekip üyesi bulunmuyor.</p>
             </div>
          ) : filteredMembers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
               <Search className="w-12 h-12 opacity-20 text-muted" />
               <p>Aranan kriterlere uygun üye bulunamadı.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-default">
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider w-24">Sıra</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Üye Bilgisi</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Rol</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Seviye / Kol</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Bölüm</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">İletişim</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Yayın</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredMembers.map((member) => {
                  const index = members.findIndex(m => m.id === member.id);
                  const reorderDisabled = movingId !== null || searchQuery.trim() !== '';
                  return (
                  <tr key={member.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-xs font-mono text-muted">{index + 1}</span>
                        <button onClick={() => handleMove(member.id, 'up')} disabled={reorderDisabled || index === 0} className="p-1 text-muted hover:text-[var(--brand-primary)] bg-surface border border-default rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title={searchQuery.trim() ? 'Sıralamak için aramayı temizleyin' : 'Yukarı taşı'} aria-label="Yukarı taşı">
                          <ChevronUp className="w-4 h-4 pointer-events-none" />
                        </button>
                        <button onClick={() => handleMove(member.id, 'down')} disabled={reorderDisabled || index === members.length - 1} className="p-1 text-muted hover:text-[var(--brand-primary)] bg-surface border border-default rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title={searchQuery.trim() ? 'Sıralamak için aramayı temizleyin' : 'Aşağı taşı'} aria-label="Aşağı taşı">
                          <ChevronDown className="w-4 h-4 pointer-events-none" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.first_name} className="w-10 h-10 rounded-full object-cover border border-default" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface border border-default flex items-center justify-center text-muted font-bold">
                          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-primary">{member.first_name} {member.last_name}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                        {member.position || 'Üye'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-bold text-primary">{LEVEL_OPTIONS[member.hierarchy_level as HierarchyLevel] || 'Üye'}</div>
                      <div className="text-xs text-muted">{branches.find(b => b.id === member.branch_id)?.name || '-'}</div>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {member.department || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="text-muted hover:text-[#0A66C2] transition-colors cursor-pointer" title="LinkedIn">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {member.instagram_url && (
                          <a href={member.instagram_url} target="_blank" rel="noreferrer" className="text-muted hover:text-[#E1306C] transition-colors cursor-pointer" title="Instagram">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {member.github_url && (
                          <a href={member.github_url} target="_blank" rel="noreferrer" className="text-muted hover:text-primary transition-colors cursor-pointer" title="GitHub">
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${member.is_public !== false ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' : 'bg-surface text-muted border-default'}`}>
                        {member.is_public !== false ? 'Sitede' : 'Gizli'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(member)} className="p-2 text-muted hover:text-[var(--brand-primary)] bg-surface hover:bg-page border border-default rounded-lg transition-colors cursor-pointer" title="Düzenle">
                        <Edit2 className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="p-2 text-muted hover:text-[var(--color-danger)] bg-surface hover:bg-[var(--color-danger)]/10 border border-default hover:border-[var(--color-danger)]/20 rounded-lg transition-colors cursor-pointer" title="Sil">
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
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
        title={selectedMember ? ">_ Üyeyi Düzenle" : ">_ Yeni Ekip Üyesi Ekle"}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Ad</label>
              <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="Örn: Ahmet" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Soyad</label>
              <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Örn: Kaya" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Rol / Unvan</label>
              <input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Örn: Başkan" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Bölüm</label>
              <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Örn: Bilgisayar Mühendisliği" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Hiyerarşi Seviyesi</label>
              <select value={formData.hierarchy_level} onChange={e => setFormData({...formData, hierarchy_level: e.target.value as HierarchyLevel})} className={FIELD}>
                {HIERARCHY_LEVELS.map(level => <option key={level} value={level}>{LEVEL_OPTIONS[level]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Kol / Ekip</label>
              <select value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className={FIELD}>
                <option value="">Yok</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {formData.hierarchy_level === 'branch_lead' && !formData.branch_id && (
              <p className="sm:col-span-2 text-xs font-medium text-[var(--color-warning)]">Kol başkanı için bir kol seçmeniz önerilir.</p>
            )}
          </div>

          <ImageField
            variant="avatar"
            label="Profil Fotoğrafı"
            currentUrl={selectedMember?.avatar_url}
            file={imageFile}
            removed={removeAvatar}
            onFileChange={e => { setImageFile(e.target.files?.[0] || null); setRemoveAvatar(false); }}
            onRemove={() => { setImageFile(null); setRemoveAvatar(true); }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">LinkedIn</label>
              <input type="url" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Instagram</label>
              <input type="url" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} placeholder="https://instagram.com/..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">GitHub</label>
              <input type="url" value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} placeholder="https://github.com/..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-sm font-bold text-primary">E-posta</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ornek@gmail.com" maxLength={254} className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
              <p className="text-xs text-muted font-medium">Doldurulursa Ekibimiz sayfasında herkese açık görünür.</p>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-default bg-page p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={e => setFormData({...formData, is_public: e.target.checked})}
              className="mt-1 h-4 w-4 accent-[var(--brand-primary)]"
            />
            <span>
              <span className="block text-sm font-bold text-primary">Sitede göster</span>
              <span className="block text-xs text-muted mt-1">Kapalı olduğunda bu profil yalnızca yönetim panelinde görünür.</span>
            </span>
          </label>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-default">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Üyeyi Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      <BranchManager
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        memberCounts={members.reduce<Record<string, number>>((acc, m) => { if (m.branch_id) acc[m.branch_id] = (acc[m.branch_id] || 0) + 1; return acc; }, {})}
        onChanged={async () => { await fetchBranches(); await fetchMembers(); }}
      />

      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Üyeyi Sil"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-primary">Emin misiniz?</h3>
            <p className="text-muted">
              Bu ekip üyesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              {deleteProjects.length > 0 && <> Şu projelerden de çıkarılacak: <strong className="text-primary">{deleteProjects.join(', ')}</strong>.</>}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={confirmDeleteMember} className="flex-1 bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white shadow-[0_0_15px_color-mix(in_srgb,var(--color-danger)_30%,transparent)]">Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BranchManager({ isOpen, onClose, branches, memberCounts, onChanged }: {
  isOpen: boolean;
  onClose: () => void;
  branches: TeamBranch[];
  memberCounts: Record<string, number>;
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch (error: any) {
      console.error("Kol işlemi başarısız:", error);
      alert("İşlem başarısız: " + (error.message || error));
    } finally {
      setBusy(false);
    }
  };

  const nameOf = (b: TeamBranch) => names[b.id] ?? b.name;
  const clearDraft = (id: string) => setNames(({ [id]: _drop, ...rest }) => rest);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title=">_ Kolları Yönet">
      <div className="space-y-5">
        <p className="text-sm text-muted">Kol ve ekipler Ekibimiz sayfasında bölüm başlığı olarak görünür. Sıra buradaki sıradır.</p>

        <ul className="space-y-2">
          {branches.map((b, i) => (
            <li key={b.id} className="p-3 bg-surface border border-default rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameOf(b)}
                  maxLength={80}
                  onChange={e => setNames({ ...names, [b.id]: e.target.value })}
                  onBlur={() => {
                    const value = nameOf(b).trim();
                    clearDraft(b.id);
                    if (value && value !== b.name) run(() => branchService.rename(b.id, value));
                  }}
                  className={FIELD}
                  aria-label="Kol adı"
                />
                <button disabled={busy || i === 0} onClick={() => run(() => branchService.swapOrder(b, branches[i - 1]))} className="p-2 text-muted hover:text-[var(--brand-primary)] bg-page border border-default rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Yukarı taşı">
                  <ChevronUp className="w-4 h-4 pointer-events-none" />
                </button>
                <button disabled={busy || i === branches.length - 1} onClick={() => run(() => branchService.swapOrder(b, branches[i + 1]))} className="p-2 text-muted hover:text-[var(--brand-primary)] bg-page border border-default rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Aşağı taşı">
                  <ChevronDown className="w-4 h-4 pointer-events-none" />
                </button>
                <button disabled={busy} onClick={() => setConfirmId(b.id)} className="p-2 text-muted hover:text-[var(--color-danger)] bg-page border border-default rounded-lg cursor-pointer disabled:opacity-30" aria-label="Sil">
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
              {confirmId === b.id && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted">
                    {memberCounts[b.id] ? `${memberCounts[b.id]} üye kolsuz kalacak. ` : ''}Silinsin mi?
                  </span>
                  <span className="flex gap-2">
                    <Button variant="ghost" onClick={() => setConfirmId(null)}>Vazgeç</Button>
                    <Button variant="primary" className="bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white" onClick={() => { setConfirmId(null); run(() => branchService.remove(b.id)); }}>Sil</Button>
                  </span>
                </div>
              )}
            </li>
          ))}
          {branches.length === 0 && <li className="text-sm text-muted">Henüz kol yok.</li>}
        </ul>

        <form
          className="flex gap-2 pt-4 border-t border-default"
          onSubmit={e => {
            e.preventDefault();
            const value = newName.trim();
            if (!value) return;
            run(async () => { await branchService.create(value, branches); setNewName(''); });
          }}
        >
          <input type="text" value={newName} maxLength={80} onChange={e => setNewName(e.target.value)} placeholder="Yeni kol / ekip adı (örn: Yapay Zeka Kolu)" className={FIELD} />
          <Button variant="primary" type="submit" disabled={busy || !newName.trim()}>Ekle</Button>
        </form>
      </div>
    </Modal>
  );
}
