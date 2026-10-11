import { Search, Inbox, Clock, User, CheckCircle, XCircle, AlertTriangle, Loader2, Mail, GraduationCap } from "lucide-react";
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useState, useEffect } from "react";
import { supabase } from "@/api/config";

interface Application {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  message: string | null;
  type: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function Submissions() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data as Application[]);
    } catch (error) {
      console.error("Başvurular çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: confirmAction.action })
        .eq('id', confirmAction.id);

      if (error) throw error;
      
      await fetchApplications();
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      alert("Bir hata oluştu.");
    } finally {
      setConfirmAction(null);
      setSelectedApp(null);
    }
  };

  const filteredApps = applications.filter(a => {
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    const searchMatch = 
      (a.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.message || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const pendingCount = applications.filter(a => a.status === "pending").length;

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return { text: "Beklemede", cls: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20" };
      case "approved": return { text: "Onaylandı", cls: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20" };
      case "rejected": return { text: "Reddedildi", cls: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20" };
      default: return { text: status, cls: "bg-[var(--text-subtle)]/10 text-[var(--text-subtle)] border-[var(--text-subtle)]/20" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'join': return 'Kulüp Üyeliği';
      case 'contact': return 'İletişim Mesajı';
      case 'project': return 'Proje Fikri';
      default: return 'Başvuru';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="text-[var(--brand-primary)]">&gt;_</span> Gelen Başvurular
          </h1>
          <p className="text-sm text-muted mt-1">Kulüp üyelik ve iletişim başvurularını buradan yönetin.</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20 rounded-full text-sm font-bold">
            {pendingCount} bekliyor
          </span>
        )}
      </div>

      <div className="bg-page border border-default rounded-2xl shadow-sm overflow-hidden">
        <div className="w-full h-8 bg-surface border-b border-default flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-solid)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></div>
          <span className="text-[10px] text-muted ml-4 font-mono">root@ygk-server:~/admin/submissions</span>
        </div>

        <div className="p-4 border-b border-default flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="> Başvuru ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-default rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "pending", "approved", "rejected"] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-[var(--brand-primary)] text-[var(--brand-text)]"
                    : "bg-surface border border-default text-muted hover:text-primary"
                }`}
              >
                {status === "all" ? "Tümü" : statusLabel(status).text}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-default min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
               <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
               <p>Başvurular yükleniyor...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-4">
              <Inbox className="w-12 h-12 opacity-20" />
              <p>Bu filtreye uygun başvuru bulunamadı.</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const badge = statusLabel(app.status || 'pending');
              const displayDate = new Date(app.created_at).toLocaleDateString('tr-TR');
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="w-full p-6 text-left hover:bg-surface/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <p className="text-sm font-bold text-primary truncate group-hover:text-[var(--brand-primary)] transition-colors">
                          {app.full_name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.cls}`}>
                          {badge.text}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-surface text-muted">
                          {getTypeLabel(app.type)}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2 line-clamp-1">{app.message || "Mesaj içeriği yok."}</p>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{displayDate}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title=">_ Başvuru Detayı"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-primary">{selectedApp.full_name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusLabel(selectedApp.status || 'pending').cls}`}>
                  {statusLabel(selectedApp.status || 'pending').text}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-surface text-muted">
                  {getTypeLabel(selectedApp.type)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{selectedApp.email}</span>
                {selectedApp.department && (
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />{selectedApp.department}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(selectedApp.created_at).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Mesaj / Neden Katılmak İstiyor?</label>
              <p className="text-sm text-primary leading-relaxed bg-surface border border-default rounded-xl p-4 whitespace-pre-wrap">
                {selectedApp.message || "Belirtilmemiş."}
              </p>
            </div>

            {selectedApp.status === "pending" && (
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-default">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setConfirmAction({ id: selectedApp.id, action: "rejected" })}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reddet
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => setConfirmAction({ id: selectedApp.id, action: "approved" })}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Onayla
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === "approved" ? "Başvuruyu Onayla" : "Başvuruyu Reddet"}
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              confirmAction?.action === "approved"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            }`}>
              {confirmAction?.action === "approved"
                ? <CheckCircle className="w-6 h-6" />
                : <AlertTriangle className="w-6 h-6" />
              }
            </div>
            <div>
              <p className="text-sm text-primary font-bold mb-1">
                {confirmAction?.action === "approved"
                  ? "Bu başvuruyu onaylamak istediğinize emin misiniz?"
                  : "Bu başvuruyu reddetmek istediğinize emin misiniz?"
                }
              </p>
              <p className="text-xs text-muted">
                {confirmAction?.action === "approved"
                  ? "Onaylandıktan sonra durumu güncellenecektir."
                  : "Reddedilen başvurular listede kalır ancak onaylanmış sayılmaz."
                }
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-default">
            <Button variant="ghost" type="button" onClick={() => setConfirmAction(null)}>
              Vazgeç
            </Button>
            <Button
              variant={confirmAction?.action === "approved" ? "primary" : "primary"}
              type="button"
              onClick={handleConfirmAction}
              className={confirmAction?.action === "rejected" ? "!bg-[var(--color-danger-solid)] hover:!bg-[var(--color-danger-hover)] !border-[var(--color-danger)]" : ""}
            >
              {confirmAction?.action === "approved" ? "Evet, Onayla" : "Evet, Reddet"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
