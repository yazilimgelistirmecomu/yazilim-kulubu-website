import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ExternalLink, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { DatabaseError } from '@/components/shared/DatabaseError';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { DeveloperAvatar, DeveloperModal } from '@/components/shared/DeveloperModal';
import { projectService } from '@/api/services/projects';
import { developerService, type TeamPerson } from '@/api/services/developers';
import { withTimeout } from '@/utils/promise';
import { safeHttpUrl } from '@/utils/slug';
import { NotFound } from './NotFound';

export function ProjectDetail() {
  const { slug = '' } = useParams();
  const [project, setProject] = useState<any>(null);
  const [developers, setDevelopers] = useState<TeamPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TeamPerson | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await withTimeout<any>(projectService.getProjectBySlug(slug), 8000);
      if (!data) {
        setNotFound(true);
        return;
      }
      setProject(data);
      setDevelopers(await developerService.getProjectTeam(data.id));
    } catch (err) {
      console.error('Proje detayı çekilemedi:', err);
      setError('Bağlantı Hatası: Proje yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[var(--brand-primary)] bg-page">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-mono text-muted">Proje Yükleniyor...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-page pt-24 flex items-center justify-center">
        <DatabaseError message={error} onRetry={load} />
      </div>
    );
  }
  if (notFound || !project) return <NotFound />;

  const demoUrl = safeHttpUrl(project.demo_url);
  const githubUrl = safeHttpUrl(project.github_url);
  const imageUrl = safeHttpUrl(project.image_url);

  return (
    <div className="min-h-screen bg-page transition-colors duration-300 pt-28 pb-24 px-4 sm:px-8 lg:px-20">
      <div className="max-w-[1280px] mx-auto">
        <Link to="/projeler" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-[var(--brand-primary)] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Projelere dön
        </Link>

        <header className="mb-10 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{project.title}</h1>
          <p className="text-base sm:text-xl text-muted leading-relaxed font-medium mb-6">
            {project.summary || project.description}
          </p>

          {project.tech_stack?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech_stack.map((tech: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-surface border border-default rounded-full text-sm font-bold text-primary shadow-sm">{tech}</span>
              ))}
            </div>
          )}

          <div className="flex flex-row items-center gap-3">
            {demoUrl && (
              <Button href={demoUrl} variant="primary" size="lg" className="rounded-xl font-bold whitespace-nowrap">
                Canlı Demo <ExternalLink className="w-5 h-5 shrink-0" />
              </Button>
            )}
            {githubUrl && (
              <Button href={githubUrl} variant="secondary" size="lg" className="rounded-xl font-bold bg-surface hover:bg-elevated border-default whitespace-nowrap">
                GitHub <Github className="w-5 h-5 shrink-0" />
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-14 items-start">
          <article className="min-w-0">
            {imageUrl && (
              <div className="rounded-dynamic overflow-hidden border border-default shadow-dynamic aspect-video bg-surface mb-10">
                <img src={imageUrl} alt={project.title} className="w-full h-full object-cover" />
              </div>
            )}
            {project.content_md?.trim() ? (
              <MarkdownContent>{project.content_md}</MarkdownContent>
            ) : (
              <p className="text-muted font-medium">Bu proje için henüz detaylı bir yazı eklenmemiş.</p>
            )}
          </article>

          {developers.length > 0 && (
            <aside className="lg:sticky lg:top-28">
              <h2 className="text-xl font-bold mb-4 tracking-tight">Geliştiriciler</h2>
              <ul className="flex flex-col gap-3">
                {developers.map((person) => (
                  <li key={person.member_key}>
                    <button
                      type="button"
                      onClick={() => setSelected(person)}
                      className="w-full flex items-center gap-3 p-4 bg-surface border border-default rounded-2xl text-left hover:border-[var(--brand-primary)] transition-colors cursor-pointer focus-ring"
                    >
                      <DeveloperAvatar developer={person} />
                      <span className="min-w-0">
                        <span className="block font-bold text-primary truncate">{person.full_name}</span>
                        {person.role && <span className="block text-sm text-muted font-medium truncate">{person.role}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>

      <DeveloperModal developer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
