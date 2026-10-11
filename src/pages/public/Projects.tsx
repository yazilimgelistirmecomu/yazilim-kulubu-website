import { motion } from 'motion/react';
import { ArrowRight, Github, ExternalLink, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useState, useEffect } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { supabase } from '@/api/config';
import { withTimeout } from '@/utils/promise';
import { DatabaseError } from '@/components/shared/DatabaseError';
import { ProjectCardLink } from '@/components/shared/ProjectCardLink';

export function Projects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [featuredProject, setFeaturedProject] = useState<any>(null);
  const [clubProjects, setClubProjects] = useState<any[]>([]);
  const [memberProjects, setMemberProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    projectName: '',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await withTimeout<any>(
        supabase.from('projects').select('id,title,description,summary,slug,github_url,demo_url,image_url,tech_stack,is_club_project,is_featured_club_project,created_at').order('created_at', { ascending: false }),
        5000
      );
      if (dbError) throw dbError;

      if (data) {
        const featured = data.find(p => p.is_featured_club_project);
        const club = data.filter(p => p.is_club_project && p.id !== featured?.id);
        const member = data.filter(p => !p.is_club_project);

        setFeaturedProject(featured);
        setClubProjects(club);
        setMemberProjects(member);
      }
    } catch (err: any) {
      console.error("Projeler çekilemedi:", err);
      setError("Bağlantı Hatası: Projeler veritabanından yüklenemedi. Lütfen internet bağlantınızı veya API ayarlarını kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const message = `
Proje Adı: ${formData.projectName}
Teknolojiler: ${formData.techStack}
GitHub: ${formData.githubUrl}
Demo: ${formData.demoUrl || 'Belirtilmemiş'}

Açıklama:
${formData.description}
      `.trim();

      const { error } = await supabase.from('applications').insert([{
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department.trim(),
        message: message,
        type: 'project',
        status: 'pending'
      }]);

      if (error) throw error;

      setIsSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        department: '',
        projectName: '',
        techStack: '',
        githubUrl: '',
        demoUrl: '',
        description: ''
      });
    } catch (error: any) {
      console.error("Proje gönderilemedi:", error);
      alert(
        ['submission_rate_limit', 'duplicate_submission', 'submission_capacity_limit'].includes(error?.message)
          ? "Bu e-posta adresinden kısa süre içinde zaten başvuru gönderilmiş. Lütfen daha sonra tekrar deneyin."
          : "Projeniz gönderilemedi. Alanları kontrol edip tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[var(--brand-primary)] bg-page">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-mono text-muted">Projeler Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page pt-24 flex items-center justify-center">
        <DatabaseError message={error} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page transition-colors duration-300">
      {/* Featured Project */}
      {featuredProject && (
        <section className="pt-28 pb-16 px-4 sm:px-8 lg:px-20 bg-page">
          <div className="max-w-[1280px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center"
            >
              <ProjectCardLink slug={featuredProject.slug} title={featuredProject.title} />
              {/* Left - Details */}
              <div className="col-span-1 lg:col-span-6 order-2 lg:order-1">
                <div className="mb-6 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--brand-primary)]"></span>
                  </span>
                  <span className="text-sm font-bold text-[var(--brand-primary)] tracking-widest uppercase">
                    ÖNE ÇIKAN KULÜP PROJESİ
                  </span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6 tracking-tight">{featuredProject.title}</h2>
                <p className="text-base sm:text-xl text-muted leading-relaxed font-medium mb-6 sm:mb-8">
                  {featuredProject.summary || featuredProject.description}
                </p>

                {featuredProject.tech_stack && featuredProject.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-10">
                    {featuredProject.tech_stack.map((tech: string, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-surface border border-default rounded-full text-sm font-bold text-primary shadow-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative z-20 flex flex-row items-center gap-3 w-full">
                  {featuredProject.demo_url && (
                    <Button 
                      href={featuredProject.demo_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      variant="primary" 
                      size="lg" 
                      className={`${featuredProject.github_url ? 'w-1/2' : 'w-full'} sm:w-auto flex items-center justify-center text-xs xs:text-sm sm:text-base px-2.5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-dynamic font-bold whitespace-nowrap`}
                    >
                      <span className="whitespace-nowrap">Canlı Demo</span> <ExternalLink className="w-3.5 h-3.5 sm:w-5 h-5 ml-1 sm:ml-2 shrink-0" />
                    </Button>
                  )}
                  {featuredProject.github_url && (
                    <Button 
                      href={featuredProject.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      variant="secondary" 
                      size="lg" 
                      className={`${featuredProject.demo_url ? 'w-1/2' : 'w-full'} sm:w-auto flex items-center justify-center text-xs xs:text-sm sm:text-base px-2.5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-bold bg-surface hover:bg-elevated border-default shadow-sm whitespace-nowrap`}
                    >
                      <span className="whitespace-nowrap">GitHub</span> <Github className="w-3.5 h-3.5 sm:w-5 h-5 ml-1 sm:ml-2 shrink-0" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Right - Realistic Mockup Image */}
              <div className="col-span-1 lg:col-span-6 relative order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
                <div className="relative rounded-dynamic overflow-hidden border border-default shadow-dynamic aspect-video bg-surface">
                  {featuredProject.image_url ? (
                    <img
                      src={featuredProject.image_url}
                      alt={featuredProject.title}
                      className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted font-bold">Görsel Yok</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-primary)]/20 to-transparent mix-blend-overlay"></div>
                </div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[var(--brand-primary)] rounded-full blur-[80px] opacity-20 -z-10" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Club Projects Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-20 bg-surface border-y border-default">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">Kulüp Projeleri</h2>
            <p className="text-sm sm:text-base text-muted font-medium">Kulüp bünyesindeki farklı alan kollarımızın aktif geliştirdiği ürünler</p>
          </div>

          <div className="flex flex-col py-8">
            {clubProjects.map((project, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center mb-24 lg:mb-32 last:mb-0`}
                >
                  <ProjectCardLink slug={project.slug} title={project.title} />
                  {/* Image Side */}
                  <div className="w-full lg:w-1/2 relative group">
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-surface flex items-center justify-center text-muted border border-default rounded-3xl">
                          <span className="font-bold opacity-50">Görsel Yok</span>
                        </div>
                      )}
                      {/* Subtle overlay gradient for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none" />
                    </div>
                    {/* Decorative glow behind image */}
                    <div className="absolute -inset-4 bg-[var(--brand-primary)] opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-1000 rounded-full -z-10" />
                  </div>

                  {/* Content Side */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      {project.branch && (
                        <span className="px-3 py-1 bg-[var(--brand-primary)] text-[var(--brand-text)] text-xs font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_var(--brand-primary)]">
                          {project.branch}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-widest">
                        <User className="w-4 h-4" />
                        KULÜP PROJESİ
                      </div>
                    </div>

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 tracking-tight leading-tight">{project.title}</h3>
                    <p className="text-sm sm:text-base text-muted mb-6 leading-relaxed font-medium line-clamp-3">
                      {project.summary || project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {project.tech_stack && project.tech_stack.map((tech: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-surface border border-default text-primary text-sm font-bold rounded-xl shadow-sm">{tech}</span>
                      ))}
                    </div>

                    <div className="relative z-20 flex flex-row items-center gap-3 w-full">
                      {project.demo_url && (
                        <Button 
                          href={project.demo_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          variant="primary" 
                          size="lg" 
                          className={`${project.github_url ? 'w-1/2' : 'w-full'} sm:w-auto flex items-center justify-center text-xs xs:text-sm sm:text-base px-2.5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-[0_0_20px_var(--brand-glow)] font-bold whitespace-nowrap`}
                        >
                          <span className="whitespace-nowrap">Canlı Demo</span> <ExternalLink className="w-3.5 h-3.5 sm:w-5 h-5 ml-1 sm:ml-2 shrink-0" />
                        </Button>
                      )}
                      {project.github_url && (
                        <Button 
                          href={project.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          variant="secondary" 
                          size="lg" 
                          className={`${project.demo_url ? 'w-1/2' : 'w-full'} sm:w-auto flex items-center justify-center text-xs xs:text-sm sm:text-base px-2.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-surface hover:bg-elevated border-default font-bold shadow-sm whitespace-nowrap`}
                        >
                          <span className="whitespace-nowrap">GitHub</span> <Github className="w-3.5 h-3.5 sm:w-5 h-5 ml-1 sm:ml-2 shrink-0" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {clubProjects.length === 0 && (
            <div className="text-center text-muted font-medium py-12 w-full">Kulüp projesi bulunmamaktadır.</div>
          )}
        </div>
      </section>

      {/* Member Projects */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-20 bg-page">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">Üye Projeleri</h2>
              <p className="text-sm sm:text-base text-muted leading-relaxed font-medium max-w-xl">
                Kulüp üyelerimizin bireysel başarılarını da sergiliyoruz.
                Geliştirdiğin bir proje mi var? Hemen bize gönder!
              </p>
            </div>
            <div className="shrink-0">
              <Button onClick={() => { setIsModalOpen(true); setIsSubmitted(false); }} variant="primary" size="lg" className="rounded-xl shadow-dynamic font-bold px-8">
                Projeni Gönder <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {memberProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group relative flex flex-col"
              >
                <ProjectCardLink slug={project.slug} title={project.title} />
                {/* Visual Preview */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-6 shadow-md bg-surface">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-surface flex items-center justify-center text-muted border border-default rounded-3xl">
                      <span className="font-bold opacity-50">Görsel Yok</span>
                    </div>
                  )}
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 z-10" />
                  <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none z-10" />

                  {/* Hover Action Buttons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 z-20">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 flex items-center justify-center shadow-2xl transition-all" title="Kaynak Kod">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[var(--brand-primary)] text-[var(--brand-text)] hover:opacity-90 flex items-center justify-center shadow-2xl shadow-[var(--brand-primary)] transition-all" title="Demo">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Content Area - Borderless */}
                <div className="flex-1 flex flex-col px-2">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-muted uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    ÜYE PROJESİ
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-primary group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-sm font-medium text-muted mb-5 line-clamp-2 leading-relaxed">{project.summary || project.description}</p>

                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tech_stack && project.tech_stack.map((tech: string, i: number) => (
                        <span key={i} className="text-xs font-bold text-primary opacity-80">{tech}</span>
                      ))}
                    </div>

                    {project.team_members && (
                      <div className="text-xs font-medium text-muted border-t border-default/50 pt-4 mt-2">
                        Geliştirici: <span className="font-bold text-primary">{project.team_members}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {memberProjects.length === 0 && (
            <div className="text-center text-muted font-medium py-12 w-full">Üye projesi bulunmamaktadır.</div>
          )}
        </div>
      </section>

      {/* Submit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Projeni Paylaş"
      >
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-20 h-20 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3">Tebrikler, Projen Gönderildi!</h3>
            <p className="text-muted font-medium mb-8 max-w-[320px]">
              Projeni inceleyip en kısa sürede "Üye Projeleri" bölümünde sergileyeceğiz. Eline sağlık!
            </p>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="font-bold border-default px-8">
              Kapat
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-muted font-medium mb-2">
              Kendi geliştirdiğin, bitmiş veya devam eden projenin detaylarını aşağıya gir. Diğer üyelerimize ilham ol!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-primary">Adın Soyadın</label>
                <input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" minLength={2} maxLength={120} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-primary">Bölüm / Sınıf</label>
                <input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} type="text" className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={160} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">E-posta Adresin</label>
              <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} type="email" className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={254} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Projenin Adı</label>
              <input value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} type="text" className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={120} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Kullanılan Teknolojiler</label>
              <input value={formData.techStack} onChange={e => setFormData({ ...formData, techStack: e.target.value })} type="text" placeholder="Python, Fast API, PostgreSQL (virgülle ayırın)" className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={500} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-primary">GitHub Linki</label>
                <input value={formData.githubUrl} onChange={e => setFormData({ ...formData, githubUrl: e.target.value })} type="url" placeholder="https://github.com/..." className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={2048} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-primary">Canlı Demo (Varsa)</label>
                <input value={formData.demoUrl} onChange={e => setFormData({ ...formData, demoUrl: e.target.value })} type="url" placeholder="https://..." className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]" maxLength={2048} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-primary">Proje Hakkında Kısa Bilgi</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Projen ne işe yarıyor? Neden geliştirdin?" className="w-full px-4 py-3 bg-page border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none" minLength={10} maxLength={5000} required></textarea>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full rounded-xl py-3.5 font-bold shadow-dynamic">
                {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gönderiliyor...</> : (
                  <>Projeyi Gönder <Send className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
