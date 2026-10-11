import { Plus, Search, Edit2, Trash2, ExternalLink, Github, UploadCloud, AlertTriangle, Loader2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useState, useEffect } from "react";
import { projectService } from "@/api/services/projects";
import { IMAGE_INPUT_ACCEPT, storageService } from "@/api/services/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/api/config";
import { developerService, type Developer, type Assignment } from "@/api/services/developers";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { SLUG_PATTERN, slugify } from "@/utils/slug";

export function Projects() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_club_project: true,
    status: 'approved' as 'pending' | 'approved' | 'rejected',
    demo_url: '',
    github_url: '',
    tech_stack: '',
    show_on_homepage: false,
    homepage_order: '',
    slug: '',
    summary: '',
    content_md: '',
    is_featured_club_project: false
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  // Düzenlemede mevcut atamalar yüklenmeden kaydedilirse ekip silinmesin diye
  const [assignmentsReady, setAssignmentsReady] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProjects();
    developerService.getAllDevelopers()
      .then(data => setAllDevelopers(data as Developer[]))
      .catch(err => console.error("Geliştiriciler çekilemedi:", err));
    developerService.getTeamProfiles()
      .then(setTeamProfiles)
      .catch(err => console.error("Ekip üyeleri çekilemedi:", err));
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Projeler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteProject = async () => {
    if (confirmDelete !== null) {
      try {
        await projectService.deleteProject(confirmDelete);
        setProjects(projects.filter(p => p.id !== confirmDelete));
      } catch (error) {
        console.error("Proje silinirken hata:", error);
      } finally {
        setConfirmDelete(null);
      }
    }
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setSlugTouched(true);
    setShowPreview(false);
    setAssignments([]);
    setAssignmentsReady(false);
    developerService.getProjectAssignments(project.id)
      .then(list => { setAssignments(list); setAssignmentsReady(true); })
      .catch(err => console.error("Proje ekibi çekilemedi:", err));
    setFormData({
      title: project.title,
      description: project.description,
      is_club_project: project.is_club_project,
      status: project.status || 'approved',
      demo_url: project.demo_url || '',
      github_url: project.github_url || '',
      tech_stack: project.tech_stack ? project.tech_stack.join(', ') : '',
      show_on_homepage: !!project.show_on_homepage,
      homepage_order: project.homepage_order != null ? String(project.homepage_order) : '',
      slug: project.slug || '',
      summary: project.summary || '',
      content_md: project.content_md || '',
      is_featured_club_project: !!project.is_featured_club_project
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProject(null);
    setSlugTouched(false);
    setShowPreview(false);
    setAssignments([]);
    setAssignmentsReady(true);
    setFormData({
      title: '',
      description: '',
      is_club_project: true,
      status: 'approved',
      demo_url: '',
      github_url: '',
      tech_stack: '',
      show_on_homepage: false,
      homepage_order: '',
      slug: '',
      summary: '',
      content_md: '',
      is_featured_club_project: false
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const moveAssignment = (index: number, dir: -1 | 1) => {
    setAssignments(list => {
      const next = [...list];
      const target = index + dir;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const slug = (formData.slug.trim() || slugify(formData.title));
    if (!slug || !SLUG_PATTERN.test(slug)) {
      alert("Slug yalnızca küçük harf, rakam ve tire içerebilir (örn: kampus-haritasi).");
      return;
    }
    if (formData.is_featured_club_project && (formData.status !== 'approved' || !formData.is_club_project)) {
      alert("Öne çıkan proje, onaylı bir kulüp projesi olmalıdır.");
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = selectedProject?.image_url || null;

      if (imageFile) {
        imageUrl = await storageService.uploadImage('project-images', imageFile);
      }

      const techArray = formData.tech_stack
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      // Verify if user's profile exists in profiles table before setting created_by
      let createdBy: string | null = user.id;
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!profileCheck) {
        createdBy = null;
      }

      const projectPayload = {
        title: formData.title,
        description: formData.description,
        is_club_project: formData.is_club_project,
        status: formData.status,
        demo_url: formData.demo_url,
        github_url: formData.github_url,
        tech_stack: techArray,
        image_url: imageUrl,
        show_on_homepage: formData.show_on_homepage,
        homepage_order: formData.show_on_homepage && formData.homepage_order !== ''
          ? parseInt(formData.homepage_order, 10)
          : null,
        slug,
        summary: formData.summary.trim() || null,
        content_md: formData.content_md.trim() || null,
        created_by: createdBy
      };

      // Tek öne çıkan proje kuralı: bayrak yalnızca değiştiyse gönderilir
      const wasFeatured = !!selectedProject?.is_featured_club_project;
      const featured = formData.is_featured_club_project !== wasFeatured
        ? formData.is_featured_club_project
        : null;

      // Proje, ekip ve öne çıkan bayrağı tek transaction'da (save_project RPC) kaydedilir.
      // Mevcut atamalar yüklenemediyse ekibe dokunulmaz (null).
      await developerService.saveProject({
        id: selectedProject?.id ?? null,
        project: projectPayload,
        assignments: assignmentsReady ? assignments : null,
        featured,
      });

      await fetchProjects();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Kaydedilirken hata oluştu:", error);
      const msg = String(error?.message || '');
      alert(
        error?.code === '23505' ? "Bu slug başka bir projede kullanılıyor. Lütfen farklı bir slug girin."
        : msg.includes('featured_requires_approved_club_project') ? "Öne çıkan proje onaylı bir kulüp projesi olmalıdır. Önce öne çıkan işaretini kaldırın ya da projeyi onaylı kulüp projesi yapın."
        : msg.includes('duplicate_assignment') ? "Aynı kişi bu projeye birden fazla kez eklenmiş."
        : "Bir hata oluştu: " + msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aktif/Onaylı';
      case 'pending': return 'Bekliyor';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20';
      case 'pending': return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20';
      case 'rejected': return 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20';
      default: return 'bg-[var(--text-subtle)]/10 text-[var(--text-subtle)] border border-[var(--text-subtle)]/20';
    }
  };

  // Seçici kaynağı proje türüne göre değişir; diğer kaynaktaki mevcut atamalar korunur
  const pickerKind: Assignment['kind'] = formData.is_club_project ? 'profile' : 'developer';
  const otherSourceCount = assignments.filter(a => a.kind !== pickerKind).length;
  const pickerOptions = (formData.is_club_project
    ? teamProfiles
        .filter(p => p.first_name && p.last_name)
        .map(p => ({ id: p.id as string, label: `${p.first_name} ${p.last_name}${p.position ? ` — ${p.position}` : ''}` }))
    : allDevelopers.map(d => ({ id: d.id, label: d.full_name }))
  ).filter(o => !assignments.some(a => a.kind === pickerKind && a.id === o.id));

  const filteredProjects = projects.filter(project => {
    const titleMatch = (project.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (project.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const techStackArray = Array.isArray(project.tech_stack) ? project.tech_stack : [];
    const techMatch = techStackArray.some((tech: string) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return titleMatch || descMatch || techMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><span className="text-[var(--brand-primary)]">&gt;_</span> Projeler Yönetimi</h1>
        <Button variant="primary" className="flex items-center gap-2 font-mono" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> ./yeni-proje.sh
        </Button>
      </div>

      <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden relative">
        <div className="w-full h-8 bg-surface border-b border-default flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-solid)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></div>
          <span className="text-[10px] text-muted ml-4 font-mono">root@ygk-server:~/admin/projects</span>
        </div>

        <div className="p-4 border-b border-default flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="> Proje ara..."
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
               <p>Projeler yükleniyor...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
               <span className="text-4xl opacity-20">📁</span>
               <p>Henüz proje eklenmemiş.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
              <Search className="w-12 h-12 opacity-20 text-muted" />
              <p>Aranan kriterlere uygun proje bulunamadı.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-default">
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Proje Adı</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Tür</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Durum</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Bağlantılar</th>
                  <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 font-bold text-sm text-primary">
                      <div className="flex items-center gap-3">
                        {project.image_url ? (
                          <img src={project.image_url} alt={project.title} className="w-10 h-10 rounded-lg object-cover border border-default" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface border border-default flex items-center justify-center text-muted">
                            {project.title.charAt(0)}
                          </div>
                        )}
                        {project.title}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {project.is_club_project ? 'Kulüp Projesi' : 'Üye Projesi'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                      {project.is_featured_club_project && (
                        <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
                          Öne çıkan
                        </span>
                      )}
                      {project.show_on_homepage && (
                        <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                          Ana sayfa{project.homepage_order != null ? ` #${project.homepage_order}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {project.demo_url && (
                          <a href={project.demo_url} target="_blank" rel="noreferrer" className="text-muted hover:text-[var(--brand-primary)]" title="Demo">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noreferrer" className="text-muted hover:text-primary" title="GitHub">
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(project)} className="p-2 text-muted hover:text-[var(--brand-primary)] bg-surface hover:bg-page border border-default rounded-lg transition-colors cursor-pointer" title="Düzenle">
                        <Edit2 className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button onClick={() => handleDelete(project.id)} className="p-2 text-muted hover:text-[var(--color-danger)] bg-surface hover:bg-[var(--color-danger)]/10 border border-default hover:border-[var(--color-danger)]/20 rounded-lg transition-colors cursor-pointer" title="Sil">
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? ">_ Projeyi Düzenle" : ">_ Yeni Proje Ekle"}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Proje Adı</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value, slug: slugTouched ? formData.slug : slugify(e.target.value)})} placeholder="Örn: ÇOMÜ Kampüs Haritası" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Slug (Adres)</label>
            <input type="text" value={formData.slug} onChange={e => { setSlugTouched(true); setFormData({...formData, slug: e.target.value.toLowerCase()}); }} placeholder="comu-kampus-haritasi" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm font-mono focus:outline-none focus:border-[var(--brand-primary)]" />
            <p className="text-xs text-muted">/projeler/{formData.slug || '...'} — Slug değişirse eski linkler çalışmaz.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Proje Tipi</label>
              <select 
                value={formData.is_club_project ? 'club' : 'member'}
                onChange={e => setFormData({...formData, is_club_project: e.target.value === 'club'})}
                className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] text-primary appearance-none"
              >
                <option value="club">Kulüp Projesi</option>
                <option value="member">Üye Projesi</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Durum</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] text-primary appearance-none"
              >
                <option value="approved">Aktif / Onaylı</option>
                <option value="pending">Onay Bekliyor</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Demo Linki</label>
              <input type="url" value={formData.demo_url} onChange={e => setFormData({...formData, demo_url: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">GitHub Linki</label>
              <input type="url" value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} placeholder="https://github.com/..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Etiketler (Virgülle ayırın)</label>
            <input type="text" value={formData.tech_stack} onChange={e => setFormData({...formData, tech_stack: e.target.value})} placeholder="Örn: React, Node.js, MongoDB" className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <label className="flex items-center gap-2 py-2.5 text-sm font-bold text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_homepage}
                onChange={e => setFormData({...formData, show_on_homepage: e.target.checked})}
                className="w-4 h-4 accent-[var(--brand-primary)]"
              />
              Ana sayfada göster
            </label>
            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Ana Sayfa Sırası</label>
              <input
                type="number"
                min={0}
                step={1}
                value={formData.homepage_order}
                onChange={e => setFormData({...formData, homepage_order: e.target.value})}
                disabled={!formData.show_on_homepage}
                placeholder="1, 2, 3... (küçük önce)"
                className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm font-bold text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured_club_project}
              onChange={e => setFormData({...formData, is_featured_club_project: e.target.checked})}
              className="w-4 h-4 mt-0.5 accent-[var(--brand-primary)]"
            />
            <span>
              Öne çıkan kulüp projesi
              <span className="block text-xs font-medium text-muted">
                Aynı anda yalnızca bir proje olabilir; kaydedince mevcut öne çıkan projenin yerini alır. Onaylı bir kulüp projesi olmalıdır.
              </span>
            </span>
          </label>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Kapak Görseli</label>
            {imageFile || selectedProject?.image_url ? (
              <div className="w-full relative h-40 border-2 border-default rounded-xl overflow-hidden bg-surface group">
                <img 
                  src={imageFile ? URL.createObjectURL(imageFile) : selectedProject?.image_url} 
                  alt="Kapak" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" 
                />
                <button 
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    if(selectedProject) selectedProject.image_url = null;
                  }}
                  className="absolute top-2 right-2 p-2 bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Görseli Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full border-2 border-dashed border-default rounded-xl bg-page hover:bg-surface transition-colors">
                <label className="flex flex-col items-center justify-center p-6 cursor-pointer w-full gap-2">
                  <UploadCloud className="w-8 h-8 text-[var(--brand-primary)] opacity-80" />
                  <span className="text-sm font-bold text-primary">Görsel Seç</span>
                  <span className="text-xs font-medium text-muted">PNG, JPG, WEBP veya HEIC/HEIF (Max 5MB)</span>
                  <input type="file" accept={IMAGE_INPUT_ACCEPT} className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Açıklama</label>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Proje hakkında kısa bilgi..." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none" required></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-primary">Kısa Özet (kartlarda görünür)</label>
            <textarea rows={2} maxLength={400} value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="1-2 cümlelik özet. Boşsa açıklama kullanılır." className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none"></textarea>
            <p className="text-xs text-muted text-right">{formData.summary.length}/400</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-primary">Detaylı Yazı (Markdown)</label>
              <button type="button" onClick={() => setShowPreview(v => !v)} className="text-xs font-bold text-[var(--brand-primary)] cursor-pointer">
                {showPreview ? 'Düzenle' : 'Önizleme'}
              </button>
            </div>
            {showPreview ? (
              <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-surface border border-default rounded-xl">
                {formData.content_md.trim() ? <MarkdownContent>{formData.content_md}</MarkdownContent> : <p className="text-sm text-muted">Önizlenecek içerik yok.</p>}
              </div>
            ) : (
              <textarea rows={10} maxLength={50000} value={formData.content_md} onChange={e => setFormData({...formData, content_md: e.target.value})} placeholder={"## Başlık\n\n- Liste öğesi\n\n```ts\nconst kod = 1;\n```"} className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm font-mono focus:outline-none focus:border-[var(--brand-primary)]"></textarea>
            )}
            <p className="text-xs text-muted">Başlık, liste, kod bloğu, tablo ve linkler desteklenir. HTML çalıştırılmaz.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-primary">
              {formData.is_club_project ? 'Ekip Üyeleri' : 'Geliştiriciler'}
            </label>
            <p className="text-xs text-muted">
              {formData.is_club_project
                ? 'Kulüp projesi: kişiler Ekip Yönetimi sayfasındaki üyelerden seçilir.'
                : 'Üye projesi: kişiler Geliştiriciler sayfasında kayıtlı olanlardan seçilir.'}
            </p>
            {!assignmentsReady && (
              <p className="text-xs text-[var(--color-warning)]">Mevcut ekip yükleniyor... Yüklenemezse kaydetmek ekibi değiştirmez.</p>
            )}
            {assignments.length > 0 && (
              <ul className="space-y-2">
                {assignments.map((a, i) => {
                  const profile = a.kind === 'profile' ? teamProfiles.find(p => p.id === a.id) : null;
                  const dev = a.kind === 'developer' ? allDevelopers.find(d => d.id === a.id) : null;
                  const name = a.kind === 'profile'
                    ? (profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'Bilinmeyen')
                    : (dev?.full_name || 'Bilinmeyen');
                  return (
                    <li key={`${a.kind}:${a.id}`} className="flex items-center gap-2 p-2 bg-surface border border-default rounded-xl">
                      <span className="w-32 sm:w-44 min-w-0">
                        <span className="block text-sm font-bold text-primary truncate">{name}</span>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-muted">
                          {a.kind === 'profile' ? 'Ekip üyesi' : 'Geliştirici'}
                          {profile && profile.is_public === false && ' · sitede gizli'}
                        </span>
                      </span>
                      <input type="text" value={a.role} maxLength={120} onChange={e => setAssignments(list => list.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} placeholder={a.kind === 'profile' ? `Rol (boşsa: ${profile?.position || 'pozisyon'})` : 'Rol (örn: Frontend)'} className="flex-1 min-w-0 px-3 py-1.5 bg-page border border-default rounded-lg text-sm focus:outline-none focus:border-[var(--brand-primary)]" />
                      <button type="button" onClick={() => moveAssignment(i, -1)} disabled={i === 0} className="p-1.5 text-muted hover:text-primary disabled:opacity-30 cursor-pointer" title="Yukarı"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveAssignment(i, 1)} disabled={i === assignments.length - 1} className="p-1.5 text-muted hover:text-primary disabled:opacity-30 cursor-pointer" title="Aşağı"><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setAssignments(list => list.filter((_, j) => j !== i))} className="p-1.5 text-muted hover:text-[var(--color-danger)] cursor-pointer" title="Kaldır"><X className="w-4 h-4" /></button>
                    </li>
                  );
                })}
              </ul>
            )}
            {otherSourceCount > 0 && (
              <p className="text-xs font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-lg p-2">
                {otherSourceCount} atama {formData.is_club_project ? 'Geliştiriciler' : 'Ekip Yönetimi'} kaynağından. Kaldırmadığın sürece projede kalır ve sitede görünür.
              </p>
            )}
            <select
              value=""
              onChange={e => { const id = e.target.value; if (id) setAssignments(list => [...list, { kind: pickerKind, id, role: '' }]); }}
              className="w-full px-4 py-2.5 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] text-primary appearance-none"
            >
              <option value="">
                {pickerOptions.length === 0
                  ? (formData.is_club_project ? 'Eklenecek ekip üyesi kalmadı' : 'Önce Geliştiriciler sayfasından kişi ekleyin')
                  : (formData.is_club_project ? '+ Ekip üyesi ekle...' : '+ Geliştirici ekle...')}
              </option>
              {pickerOptions.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-default">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Projeyi Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Projeyi Sil"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-primary">Emin misiniz?</h3>
            <p className="text-muted">Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
          </div>
          <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={confirmDeleteProject} className="flex-1 bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white shadow-[0_0_15px_color-mix(in_srgb,var(--color-danger)_30%,transparent)]">Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
