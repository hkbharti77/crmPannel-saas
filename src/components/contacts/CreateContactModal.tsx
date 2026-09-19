import { useState } from 'react';
import { X, Loader2, AlertCircle, User, Mail, Tag } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { createContact } from '@/lib/contactsApi';
import { FormField } from '@/components/ui/FormField';

export function CreateContactModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waId, setWaId] = useState<string | undefined>('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time inline field errors
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = touched.email && email && !emailRegex.test(email)
    ? 'Please enter a valid email address'
    : undefined;
  
  const phoneError = touched.phone && !waId
    ? 'WhatsApp phone number is required'
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });

    if (!waId) {
      setError('WhatsApp Number is required');
      return;
    }

    if (email && !emailRegex.test(email)) {
      setError('Please provide a valid email format');
      return;
    }

    setLoading(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const { error: apiError } = await createContact({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      waId,
      tags: tags.length > 0 ? tags : undefined,
    });

    setLoading(false);

    if (apiError) {
      setError(typeof apiError === 'string' ? apiError : 'Failed to create contact');
    } else {
      onSuccess();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-ink-800 dark:bg-ink-950">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Add New Contact</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Store customer details and sync with WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:hover:bg-ink-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-tight text-xs font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" optional maxLength={70} currentLength={name.length}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              maxLength={70}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-100"
            />
          </FormField>

          <FormField
            label="WhatsApp Number"
            required
            error={phoneError}
            hint="Include country code (e.g. +91 for India)"
          >
            <div
              className={`rounded-xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 dark:bg-ink-900 ${
                phoneError
                  ? 'border-rose-400 dark:border-rose-500/60'
                  : 'border-slate-300 dark:border-ink-700'
              }`}
            >
              <PhoneInput
                international
                defaultCountry="IN"
                value={waId}
                onChange={(val) => {
                  setWaId(val);
                  setTouched((prev) => ({ ...prev, phone: true }));
                }}
                className="w-full text-sm outline-none bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>
          </FormField>

          <FormField label="Email Address" optional error={emailError}>
            <div className="relative">
              <input
                type="email"
                value={email}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className={`w-full rounded-xl border bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-ink-900 dark:text-slate-100 ${
                  emailError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500 dark:border-ink-700'
                }`}
              />
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </FormField>

          <FormField
            label="Tags"
            optional
            hint="Separate multiple tags with a comma"
          >
            <div className="relative">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Hot Lead, Retail, Mumbai"
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-100"
              />
              <Tag className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </FormField>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-ink-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-ink-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-70 disabled:hover:bg-primary-600 disabled:active:scale-100"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
