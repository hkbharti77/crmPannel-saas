import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Search,
  MessageSquare,
  Kanban,
  Calendar,
  Radio,
  Brain,
  LifeBuoy,
  Settings,
  Shield,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileQuestion,
  Layers,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cx } from '@/lib/types';

interface RouteShortcut {
  title: string;
  desc: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  adminOnly?: boolean;
}

const SHORTCUTS: RouteShortcut[] = [
  {
    title: 'Dashboard',
    desc: 'Workspace metrics, active leads & operational snapshot',
    path: '/dashboard',
    icon: Home,
    tag: 'Core',
  },
  {
    title: 'Omnichannel Inbox',
    desc: 'WhatsApp & customer message streams in real-time',
    path: '/inbox',
    icon: MessageSquare,
    tag: 'Live Ops',
  },
  {
    title: 'Deals & Pipeline',
    desc: 'Visual Kanban pipeline and lead deal progression',
    path: '/pipeline',
    icon: Kanban,
    tag: 'Sales',
  },
  {
    title: 'Appointments',
    desc: 'Calendar sync, meetings & consultation bookings',
    path: '/appointments',
    icon: Calendar,
    tag: 'Schedule',
  },
  {
    title: 'Campaigns & Broadcasts',
    desc: 'WhatsApp broadcasts & automated customer campaigns',
    path: '/broadcasts',
    icon: Radio,
    tag: 'Marketing',
  },
  {
    title: 'AI Knowledge Base',
    desc: 'Custom personas, RAG docs & chatbot configurations',
    path: '/knowledge-base',
    icon: Brain,
    tag: 'AI Bot',
  },
  {
    title: 'Support Tickets',
    desc: 'Customer help desk, ticket escalations & SLA tracking',
    path: '/tickets',
    icon: LifeBuoy,
    tag: 'Support',
  },
  {
    title: 'Settings & Integrations',
    desc: 'Meta WhatsApp BSP, team roles, billing & branding',
    path: '/settings',
    icon: Settings,
    tag: 'Settings',
  },
  {
    title: 'Admin Center',
    desc: 'Multi-tenant health, global audits & governance',
    path: '/admin/overview',
    icon: Shield,
    tag: 'Admin',
    adminOnly: true,
  },
];

export function NotFoundView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin =
    user?.isSuperAdmin === true ||
    (user?.role || '').toUpperCase() === 'SUPER_ADMIN' ||
    (user?.role || '').toUpperCase() === 'PLATFORM_ADMIN';

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS.filter((sc) => {
      if (sc.adminOnly && !isSuperAdmin) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sc.title.toLowerCase().includes(q) ||
        sc.desc.toLowerCase().includes(q) ||
        sc.tag.toLowerCase().includes(q) ||
        sc.path.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, isSuperAdmin]);

  const diagnosticData = useMemo(() => {
    return {
      status: '404_NOT_FOUND',
      path: location.pathname,
      search: location.search || 'none',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      auth: {
        authenticated: !!user,
        userId: user?.id || 'guest',
        tenantId: user?.tenantId || 'unassigned',
        role: user?.role || 'ANONYMOUS',
      },
    };
  }, [location, user]);

  const handleCopyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user ? '/dashboard' : '/login');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-base-c text-primary-c selection:bg-primary-500/30 font-sans p-4 sm:p-8 flex flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 my-auto animate-in fade-in duration-200">
        {/* ── Main Error Card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c bg-card-c p-6 sm:p-10 shadow-soft-lg text-center">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 rounded-full border border-warning-500/30 bg-warning-500/10 px-3.5 py-1 text-xs font-semibold text-warning-600 dark:text-warning-400 mb-5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>404 • Page or Section Not Found</span>
          </div>

          {/* 404 Big Heading */}
          <div className="relative my-2 flex items-center justify-center select-none">
            <h1 className="text-7xl sm:text-8xl font-black tracking-tight text-primary-c">
              404
            </h1>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-primary-c mb-2">
            The page you requested could not be found
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-secondary-c mb-5 leading-relaxed">
            The URL path you entered doesn&apos;t match any registered view or settings module. Please check the spelling or jump directly to a workspace destination below.
          </p>

          {/* Path Callout Pill */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-base-c bg-subtle-c px-3.5 py-1.5 text-xs font-mono text-secondary-c mb-6 shadow-inner">
            <Terminal className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-muted-c">Path:</span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">{location.pathname}</span>
            {location.search && <span className="text-muted-c">{location.search}</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-sm transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Go Back</span>
            </button>

            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Dashboard</span>
            </Link>

            <Link
              to="/tickets"
              className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-sm transition-all active:scale-[0.98]"
            >
              <LifeBuoy className="h-3.5 w-3.5 text-emerald-500" />
              <span>Support Desk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick Workspace Directory ── */}
      <div className="rounded-2xl border border-base-c bg-card-c p-5 sm:p-6 shadow-soft-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-c">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">Workspace Directory</h3>
              <p className="text-[11px] text-muted-c">Jump directly into registered CRM modules:</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-c" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules (e.g., inbox, deals)..."
              className="form-input pl-8 pr-3 py-1.5 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-c hover:text-primary-c bg-subtle-c px-1 rounded"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group flex flex-col justify-between rounded-xl border border-base-c bg-subtle-c p-3.5 transition-all hover:border-primary-500/40 hover:bg-card-c hover:shadow-soft"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-c text-primary-600 dark:text-primary-400 border border-base-c group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="rounded-md border border-base-c bg-card-c px-1.5 py-0.5 text-[9px] font-bold text-muted-c group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-primary-c group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-c line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-base-c text-[10px] font-mono text-muted-c group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  <span>{item.path}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredShortcuts.length === 0 && (
          <div className="text-center py-8">
            <FileQuestion className="mx-auto h-7 w-7 text-muted-c mb-1" />
            <p className="text-xs font-semibold text-secondary-c">No matching module found</p>
            <p className="text-[11px] text-muted-c">Try searching &quot;deals&quot;, &quot;inbox&quot;, or &quot;settings&quot;</p>
          </div>
        )}
      </div>

      {/* ── Technical Diagnostics Telemetry Accordion ── */}
      <div className="rounded-2xl border border-base-c bg-card-c overflow-hidden shadow-soft">
        <button
          type="button"
          onClick={() => setShowDiagnostics((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-subtle-c"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-xs font-bold text-secondary-c">
              Technical Diagnostics & Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-c">
              {showDiagnostics ? 'Hide details' : 'View payload'}
            </span>
            {showDiagnostics ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-c" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-c" />
            )}
          </div>
        </button>

        {showDiagnostics && (
          <div className="border-t border-base-c p-4 bg-subtle-c space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-c">
                Payload snapshot for technical issue reporting:
              </p>
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-[11px] font-semibold text-secondary-c hover:text-primary-c hover:border-primary-500/40 transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-muted-c" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-xl border border-base-c bg-card-c p-3 font-mono text-[11px] text-primary-600 dark:text-emerald-400 leading-relaxed shadow-inner">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
