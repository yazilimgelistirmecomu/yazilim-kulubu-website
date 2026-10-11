import { MotionConfig } from 'motion/react';
import { Outlet, ScrollRestoration } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsTracker } from '@/components/shared/AnalyticsTracker';

export function Layout() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-page text-primary transition-colors duration-300">
      <AnalyticsTracker />
      <ScrollRestoration />
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
    </MotionConfig>
  );
}
