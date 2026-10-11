import { Users, Calendar, Briefcase, Inbox, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from "@/api/config";

export function Dashboard() {
  const [trafficData, setTrafficData] = useState<{ name: string; views: number; unique: number }[]>([]);
  const [todayViews, setTodayViews] = useState(0);
  const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([]);

  // Real DB Stats
  const [pendingApps, setPendingApps] = useState(0);
  const [pendingList, setPendingList] = useState<{ id: string, full_name: string, type: string, created_at: string }[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchDashboardStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Bekleyen başvurular adeti
      const { count: appsCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      if (appsCount !== null) setPendingApps(appsCount);

      // Bekleyen başvurular listesi
      const { data: pendingData } = await supabase
        .from('applications')
        .select('id, full_name, type, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      if (pendingData) {
        setPendingList(pendingData);
      }

      // Supabase'den son 7 günlük sayfa görüntülemelerini çek
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: viewsData } = await supabase
        .from('page_views')
        .select('created_at, session_id, path')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (viewsData) {
        // Son 7 günün gün kovalarını (buckets) oluştur
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
          const isoDateStr = d.toISOString().split('T')[0];
          last7Days.push({ name: dateStr, isoDate: isoDateStr, views: 0, unique: 0, sessions: new Set() });
        }

        // Verileri günlere grupla
        viewsData.forEach(row => {
          const rowDateStr = new Date(row.created_at).toISOString().split('T')[0];
          const dayBucket = last7Days.find(d => d.isoDate === rowDateStr);
          if (dayBucket) {
            dayBucket.views += 1;
            if (!dayBucket.sessions.has(row.session_id)) {
              dayBucket.sessions.add(row.session_id);
              dayBucket.unique += 1;
            }
          }
        });

        const formattedTraffic = last7Days.map(d => ({
          name: d.name,
          views: d.views,
          unique: d.unique
        }));

        setTrafficData(formattedTraffic);

        // Bugünün toplam sayfa görüntülenmesi
        const todayStr = new Date().toISOString().split('T')[0];
        const todayBucket = last7Days.find(d => d.isoDate === todayStr);
        setTodayViews(todayBucket ? todayBucket.views : 0);

        // En popüler yolları (path) grupla
        const pathCounts: { [key: string]: number } = {};
        viewsData.forEach(row => {
          const path = row.path || '/';
          pathCounts[path] = (pathCounts[path] || 0) + 1;
        });

        const sortedPaths = Object.entries(pathCounts)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopPages(sortedPaths.length > 0 ? sortedPaths : [
          { path: "/", count: 0 }
        ]);
      }

    } catch (error) {
      console.error("Dashboard verileri çekilemedi:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Traffic Chart */}
      <div className="bg-page border border-default rounded-md shadow-sm p-6 relative overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="absolute top-0 left-0 w-full h-6 bg-surface border-b border-default flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-solid)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"></div>
          <span className="text-[10px] text-muted ml-4 font-mono">root@ygk-server:~# htop</span>
        </div>

        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h3 className="text-primary text-lg mb-1 flex items-center gap-2">
              <span className="text-[var(--brand-primary)]">&gt;_</span> Sitenin Günlük Trafiği
            </h3>
            <p className="text-xs text-muted">Son 7 gün içindeki gerçek sayfa görüntülenmeleri ve tekil ziyaretçiler.</p>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted opacity-20" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted" dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: '12px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="views" name="Görüntülenme" stroke="var(--brand-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Links & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Submissions Card */}
        <div className="bg-page border border-[var(--color-warning)]/30 rounded-md shadow-sm p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-warning)] opacity-20"></div>

          <Link
            to="/admin/basvurular"
            className="flex items-center justify-between mb-4 group"
          >
            <h3 className="text-[var(--color-warning)] text-lg flex items-center gap-2">
              <span className="opacity-50">&gt;</span> Bekleyen Başvurular
            </h3>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-[var(--color-warning)] transition-colors" />
          </Link>

          <div className="space-y-3 font-mono text-[11px] flex-1">
            {pendingList.length > 0 ? (
              pendingList.map((item) => {
                let actionText = "Yeni Başvuru";
                if (item.type === 'join') actionText = "Üyelik Başvurusu";
                if (item.type === 'project') actionText = "Proje Fikri";
                if (item.type === 'contact') actionText = "İletişim Mesajı";

                return (
                  <div key={item.id} className="flex items-center justify-between border-b border-default last:border-0 pb-2 last:pb-0">
                    <span className="text-[var(--color-warning)] truncate pr-4">
                      {actionText} — {item.full_name}
                    </span>
                    <span className="text-muted flex-shrink-0">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-muted text-center pt-4 opacity-50">Bekleyen başvuru bulunmamaktadır.</div>
            )}
          </div>

          <p className="text-[10px] text-muted mt-4 border-t border-default pt-2 flex items-center justify-between">
            <span>{pendingApps} yeni başvuru</span>
            <span className="font-mono bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-1.5 py-0.5 rounded text-[9px]">./incelenmeyi_bekliyor.sh</span>
          </p>
        </div>

        {/* Top Pages Summary */}
        <div className="bg-page border border-default rounded-md shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-primary)] opacity-20"></div>
          <div>
            <h3 className="text-primary mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="text-[var(--brand-primary)]">&gt;</span> Popüler Sayfalar</span>
              <span className="text-[10px] uppercase tracking-wider bg-surface px-2 py-1 rounded text-[var(--brand-primary)] border border-default">Bugün</span>
            </h3>
            <div className="space-y-3">
              {topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-default last:border-0 pb-2 last:pb-0">
                  <span className="text-muted font-medium truncate pr-4 flex items-center gap-2">
                    <span className="text-muted opacity-70">[{i + 1}]</span> {page.path === '/' ? '/ana sayfa' : page.path}
                  </span>
                  <span className="text-[var(--brand-primary)] font-bold font-mono">
                    {page.count} <span className="text-muted font-normal">reqs</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Visitors Card (Cyan theme) */}
        <div className="bg-page border border-default rounded-md shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-fg)] opacity-20"></div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-primary text-lg flex items-center gap-2">
              <span className="text-[var(--accent-fg)] opacity-50">&gt;</span> Günlük Ziyaretçi
            </h3>
            <div className="w-8 h-8 rounded-full bg-[var(--accent-fg)]/10 flex items-center justify-center text-[var(--accent-fg)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="text-4xl font-extrabold text-primary tracking-tight flex items-baseline gap-1.5 font-mono">
              {todayViews}
              <span className="w-3 h-6 bg-[var(--accent-fg)] animate-pulse inline-block opacity-70"></span>
            </div>
            <p className="text-xs text-muted mt-2">Bugünkü canlı tekil sayfa görüntülemeleri.</p>
          </div>

          <div className="border-t border-default pt-3 mt-auto flex items-center justify-between text-[11px] text-muted">
            <span>Durum: <span className="text-[var(--color-success)] font-bold">Aktif / Canlı</span></span>
            <span className="bg-[var(--color-success)]/10 text-[var(--color-success)] px-1.5 py-0.5 rounded font-mono text-[9px]">live_stream</span>
          </div>
        </div>
      </div>
    </div>
  );
}
