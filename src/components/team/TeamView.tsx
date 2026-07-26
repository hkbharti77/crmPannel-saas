import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  AGENTS,
  STATUS_META,
  ROLE_META,
  type Agent,
  type AgentStatus,
  type AgentRole,
} from './teamData';
import {
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Target,
  IndianRupee,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

type StatusFilter = AgentStatus | 'ALL';
type RoleFilter = AgentRole | 'ALL';

export function TeamView() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showInvite, setShowInvite] = useState(false);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        !query ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.email.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [agents, query, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === 'ACTIVE').length;
    const totalDeals = agents.reduce((s, a) => s + a.dealsClosed, 0);
    const avgConv = agents.reduce((s, a) => s + a.conversion, 0) / agents.length;
    return { total: agents.length, active, totalDeals, avgConv: avgConv.toFixed(1) };
  }, [agents]);

  const handleInvite = (data: { name: string; email: string; phone: string; role: AgentRole; city: string }) => {
    const id = `A-${String(agents.length + 1).padStart(2, '0')}`;
    const newAgent: Agent = {
      ...data,
      id,
      status: 'ACTIVE',
      dealsClosed: 0,
      activeLeads: 0,
      revenue: '₹0',
      conversion: 0,
      joinedDate: 'Jul 2026',
      rating: 0,
    };
    setAgents((prev) => [newAgent, ...prev]);
    setShowInvite(false);
  };

  const handleRemove = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Team</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Manage your agents, roles, and performance.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> Invite Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TeamStat icon={Users} label="Team Members" value={stats.total} accent="text-primary-600 dark:text-primary-400" bg="bg-primary-500/10" />
        <TeamStat icon={Target} label="Active Now" value={stats.active} accent="text-success-600 dark:text-success-400" bg="bg-success-500/10" />
        <TeamStat icon={IndianRupee} label="Total Deals" value={stats.totalDeals} accent="text-secondary-600 dark:text-secondary-400" bg="bg-secondary-500/10" />
        <TeamStat icon={TrendingUp} label="Avg Conversion" value={`${stats.avgConv}%`} accent="text-warning-600 dark:text-warning-400" bg="bg-warning-500/10" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents by name, email, or city…"
            className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-10 pr-4 text-sm text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-lg border border-base-c bg-card-c px-2.5 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="Team Lead">Team Lead</option>
          <option value="Senior Agent">Senior Agent</option>
          <option value="Agent">Agent</option>
          <option value="Junior Agent">Junior Agent</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-base-c bg-card-c px-2.5 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="AWAY">Away</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Agent cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No agents match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AgentCard key={a.id} agent={a} onRemove={() => handleRemove(a.id)} />
          ))}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />}
    </div>
  );
}

function TeamStat({ icon: Icon, label, value, accent, bg }: { icon: typeof Users; label: string; value: string | number; accent: string; bg: string }) {
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl2', bg)}>
        <Icon className={cx('h-5 w-5', accent)} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
        <p className={cx('text-xl font-bold tabular-nums', accent)}>{value}</p>
      </div>
    </GlassCard>
  );
}

function AgentCard({ agent, onRemove }: { agent: Agent; onRemove: () => void }) {
  const statusMeta = STATUS_META[agent.status];
  const roleMeta = ROLE_META[agent.role];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <GlassCard hover className="p-5">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={agent.name} size={48} />
            <span className={cx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-ink-900', statusMeta.dot)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary-c">{agent.name}</h3>
            <span className={cx('mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold', roleMeta.color)}>
              {agent.role}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl2 border border-base-c bg-card-c shadow-soft-lg animate-slide-down">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-secondary-c hover:bg-slate-50 hover:text-primary-c dark:hover:bg-ink-850">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onRemove(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-danger-600 hover:bg-danger-500/5 dark:text-danger-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-4 space-y-1.5 text-xs text-secondary-c">
        <p className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-c" /> <span className="truncate">{agent.email}</span>
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-c" /> {agent.phone}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-c" /> {agent.city}
        </p>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-base-c pt-4">
        <AgentStat label="Deals" value={agent.dealsClosed} />
        <AgentStat label="Leads" value={agent.activeLeads} />
        <AgentStat label="Revenue" value={agent.revenue} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-base-c pt-3">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
          <span className="text-xs font-bold text-primary-c">{agent.rating}</span>
          <span className="text-[10px] text-muted-c">rating</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-c">Conv</span>
          <span className="text-xs font-bold text-success-600 dark:text-success-400">{agent.conversion}%</span>
        </div>
        <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold', statusMeta.color)}>
          <span className={cx('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
          {statusMeta.label}
        </span>
      </div>
    </GlassCard>
  );
}

function AgentStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-primary-c tabular-nums">{value}</p>
    </div>
  );
}

function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (data: { name: string; email: string; phone: string; role: AgentRole; city: string }) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AgentRole>('Agent');
  const [city, setCity] = useState('');

  const canSubmit = name.trim() && email.trim() && phone.trim() && city.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onInvite({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, city: city.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent">
              <Users className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">Invite Agent</h3>
              <p className="text-xs text-muted-c">Add a new team member</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Full Name <span className="text-danger-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ravi Kumar" className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Email <span className="text-danger-500">*</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@crmlite.io" className="form-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Phone <span className="text-danger-500">*</span></label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as AgentRole)} className="form-input">
                <option value="Team Lead">Team Lead</option>
                <option value="Senior Agent">Senior Agent</option>
                <option value="Agent">Agent</option>
                <option value="Junior Agent">Junior Agent</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">City <span className="text-danger-500">*</span></label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Hyderabad" className="form-input" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              canSubmit ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            <Plus className="h-3.5 w-3.5" /> Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
