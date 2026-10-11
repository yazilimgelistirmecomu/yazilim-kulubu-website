import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, AlertCircle, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '@/api/config';
import { Button } from '@/components/shared/Button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error("Supabase Login Error:", err);
      setError(err.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-primary)] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-fg)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface/80 backdrop-blur-xl border border-default p-8 rounded-dynamic shadow-dynamic">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-elevated border border-default rounded-2xl flex items-center justify-center shadow-sm">
              <Terminal className="w-8 h-8 text-[var(--brand-primary)]" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2 tracking-tight">Yönetim Paneli</h1>
            <p className="text-sm font-medium text-muted">Yetkili erişimi için lütfen giriş yapın.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-primary px-1">E-posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-elevated border border-default rounded-xl text-sm font-medium text-primary placeholder-muted focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                  placeholder="admin@ygk.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-primary">Şifre</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-elevated border border-default rounded-xl text-sm font-medium text-primary placeholder-muted focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold rounded-xl shadow-dynamic relative overflow-hidden group"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-muted">
              Sadece kulüp yönetim kurulu üyeleri giriş yapabilir.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
