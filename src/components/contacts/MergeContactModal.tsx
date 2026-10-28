import { useState, useEffect } from 'react';
import { 
  X, 
  Loader2, 
  AlertTriangle, 
  GitMerge, 
  Check, 
  ArrowRight, 
  Search, 
  User, 
  Smartphone, 
  Mail, 
  Tag as TagIcon, 
  ShieldAlert, 
  Layers 
} from 'lucide-react';
import { 
  type ContactDTO, 
  type DuplicateCandidateDTO, 
  fetchDuplicateCandidates, 
  mergeContacts, 
  type MergeResultDTO 
} from '@/lib/contactsApi';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/primitives';

interface MergeContactModalProps {
  primaryContact: ContactDTO;
  onClose: () => void;
  onSuccess: (result: MergeResultDTO) => void;
}

type Step = 'select_candidate' | 'resolve_fields' | 'confirm_merge';

export function MergeContactModal({ primaryContact, onClose, onSuccess }: MergeContactModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('select_candidate');
  
  // Candidates and search state
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidates, setCandidates] = useState<DuplicateCandidateDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContactDTO[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected duplicate contact
  const [secondaryContact, setSecondaryContact] = useState<ContactDTO | null>(null);

  // Field resolution state (which contact wins for each field)
  const [selectedNameSource, setSelectedNameSource] = useState<'primary' | 'secondary'>('primary');
  const [selectedPhoneSource, setSelectedPhoneSource] = useState<'primary' | 'secondary'>('primary');
  const [selectedEmailSource, setSelectedEmailSource] = useState<'primary' | 'secondary'>('primary');
  const [selectedSourceOrigin, setSelectedSourceOrigin] = useState<'primary' | 'secondary'>('primary');
  const [selectedOptOutSource, setSelectedOptOutSource] = useState<'primary' | 'secondary'>('primary');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mergeNotes, setMergeNotes] = useState('');

  // Execution state
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResultDTO | null>(null);

  // 1. Fetch AI/Algorithmic duplicate candidates
  useEffect(() => {
    async function loadCandidates() {
      setLoadingCandidates(true);
      const res = await fetchDuplicateCandidates(primaryContact.id);
      if (res.data) {
        setCandidates(res.data);
      }
      setLoadingCandidates(false);
    }
    loadCandidates();
  }, [primaryContact.id]);

  // Handle searching for contacts manually
  const handleSearchContacts = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await apiFetch<ContactDTO[]>(`/api/v1/contacts?search=${encodeURIComponent(query.trim())}`);
      if (res.data) {
        // Exclude the primary contact and already merged contacts
        setSearchResults(res.data.filter(c => c.id !== primaryContact.id && !c.isMerged));
      }
    } catch (err) {
      console.error('Failed to search contacts:', err);
    } finally {
      setSearching(false);
    }
  };

  // Select a duplicate and initialize field resolution defaults
  const handleSelectSecondary = async (contact: ContactDTO | DuplicateCandidateDTO) => {
    let fullContact: ContactDTO;
    if ('tags' in contact && Array.isArray((contact as ContactDTO).tags)) {
      fullContact = contact as ContactDTO;
    } else {
      // Fetch full contact object if candidate DTO lacks some fields
      const res = await apiFetch<ContactDTO>(`/api/v1/contacts/${contact.contactId}`);
      if (res.data) {
        fullContact = res.data;
      } else {
        fullContact = {
          id: (contact as DuplicateCandidateDTO).contactId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          waId: contact.waId,
          tags: [],
          source: contact.source,
          botPaused: false
        };
      }
    }

    setSecondaryContact(fullContact);

    // Initialize resolution preferences: prefer non-empty values
    setSelectedNameSource('primary');
    setSelectedPhoneSource(primaryContact.phone || primaryContact.waId ? 'primary' : 'secondary');
    setSelectedEmailSource(primaryContact.email ? 'primary' : 'secondary');
    setSelectedSourceOrigin(primaryContact.source ? 'primary' : 'secondary');
    setSelectedOptOutSource(primaryContact.marketingOptedOut ? 'primary' : 'secondary');

    // Combine tags uniquely
    const unionTags = Array.from(new Set([...(primaryContact.tags || []), ...(fullContact.tags || [])]));
    setSelectedTags(unionTags);

    setCurrentStep('resolve_fields');
  };

  const getWinningValue = (field: 'name' | 'phone' | 'email' | 'source' | 'optOut') => {
    if (!secondaryContact) return undefined;
    switch (field) {
      case 'name':
        return selectedNameSource === 'primary' ? primaryContact.name : secondaryContact.name;
      case 'phone':
        return selectedPhoneSource === 'primary' 
          ? (primaryContact.phone || primaryContact.waId || '') 
          : (secondaryContact.phone || secondaryContact.waId || '');
      case 'email':
        return selectedEmailSource === 'primary' ? (primaryContact.email || '') : (secondaryContact.email || '');
      case 'source':
        return selectedSourceOrigin === 'primary' ? (primaryContact.source || '') : (secondaryContact.source || '');
      case 'optOut':
        return selectedOptOutSource === 'primary' ? primaryContact.marketingOptedOut : secondaryContact.marketingOptedOut;
    }
  };

  const handleExecuteMerge = async () => {
    if (!secondaryContact) return;
    setMerging(true);
    setMergeError(null);

    const winningName = getWinningValue('name') as string;
    const winningPhone = getWinningValue('phone') as string;
    const winningEmail = getWinningValue('email') as string;
    const winningSource = getWinningValue('source') as string;
    const winningOptOut = Boolean(getWinningValue('optOut'));

    const res = await mergeContacts(primaryContact.id, {
      secondaryContactId: secondaryContact.id,
      winningName: winningName || undefined,
      winningPhone: winningPhone || undefined,
      winningEmail: winningEmail || undefined,
      winningSource: winningSource || undefined,
      winningMarketingOptOut: winningOptOut,
      additionalTags: selectedTags,
      mergeNotes: mergeNotes.trim() || undefined
    });

    setMerging(false);

    if (res.error) {
      setMergeError(typeof res.error === 'string' ? res.error : 'Failed to execute merge operation.');
    } else if (res.data) {
      setMergeResult(res.data);
      onSuccess(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-base-c bg-card-c shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4 bg-subtle-c/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary-c">Merge Contacts & Deduplication</h2>
              <p className="text-xs text-muted-c">Consolidate duplicate records into a unified contact profile</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-c hover:text-primary-c hover:bg-subtle-c transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center border-b border-base-c px-6 py-2.5 bg-subtle-c/20 text-xs">
          <div className={`flex items-center gap-2 font-medium ${currentStep === 'select_candidate' ? 'text-primary-500 font-bold' : 'text-muted-c'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${currentStep === 'select_candidate' ? 'bg-primary-500 text-white' : 'bg-subtle-c border border-base-c'}`}>1</span>
            Select Duplicate Record
          </div>
          <div className="mx-3 h-px w-8 bg-base-c" />
          <div className={`flex items-center gap-2 font-medium ${currentStep === 'resolve_fields' ? 'text-primary-500 font-bold' : 'text-muted-c'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${currentStep === 'resolve_fields' ? 'bg-primary-500 text-white' : 'bg-subtle-c border border-base-c'}`}>2</span>
            Field Conflict Resolution
          </div>
          <div className="mx-3 h-px w-8 bg-base-c" />
          <div className={`flex items-center gap-2 font-medium ${currentStep === 'confirm_merge' ? 'text-primary-500 font-bold' : 'text-muted-c'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${currentStep === 'confirm_merge' ? 'bg-primary-500 text-white' : 'bg-subtle-c border border-base-c'}`}>3</span>
            Review & Execute
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Select Candidate */}
          {currentStep === 'select_candidate' && (
            <div className="space-y-6">
              
              {/* Primary Contact Reference Banner */}
              <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500">
                    Primary Contact (Record to Keep)
                  </span>
                  <Badge variant="primary">Target ID: {primaryContact.id.substring(0, 8)}...</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-primary-c">
                    <User className="h-4 w-4 text-muted-c" />
                    <span>{primaryContact.name || 'Unnamed'}</span>
                  </div>
                  {primaryContact.phone && (
                    <div className="flex items-center gap-1.5 text-secondary-c font-mono">
                      <Smartphone className="h-4 w-4 text-muted-c" />
                      <span>{primaryContact.phone}</span>
                    </div>
                  )}
                  {primaryContact.email && (
                    <div className="flex items-center gap-1.5 text-secondary-c">
                      <Mail className="h-4 w-4 text-muted-c" />
                      <span>{primaryContact.email}</span>
                    </div>
                  )}
                  {primaryContact.source && (
                    <span className="rounded bg-subtle-c px-2 py-0.5 text-[10px] text-muted-c font-medium">
                      Source: {primaryContact.source}
                    </span>
                  )}
                </div>
              </div>

              {/* Duplicate Candidates List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c mb-3 flex items-center justify-between">
                  <span>Detected Potential Duplicates</span>
                  <span className="text-[11px] font-normal text-muted-c">
                    {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
                  </span>
                </h3>

                {loadingCandidates ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    <span className="ml-2 text-xs text-muted-c">Scanning database for duplicate candidates...</span>
                  </div>
                ) : candidates.length > 0 ? (
                  <div className="space-y-2.5">
                    {candidates.map((cand) => (
                      <div 
                        key={cand.contactId}
                        className="flex items-center justify-between rounded-xl border border-base-c bg-card-c p-4 transition-all hover:border-primary-500/50 hover:shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-primary-c">{cand.name || 'Unnamed Contact'}</span>
                            <Badge variant={cand.similarityScore >= 90 ? 'danger' : 'warning'}>
                              {cand.similarityScore}% Match
                            </Badge>
                            <span className="text-[11px] text-muted-c italic">({cand.matchReason})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-c">
                            {cand.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Smartphone className="h-3 w-3" /> {cand.phone}
                              </span>
                            )}
                            {cand.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {cand.email}
                              </span>
                            )}
                            {cand.source && (
                              <span className="text-[11px]">Source: {cand.source}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectSecondary(cand)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] cursor-pointer"
                        >
                          Select <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-base-c p-6 text-center text-xs text-muted-c">
                    No automatic duplicate candidates detected based on phone, email, or name similarity.
                  </div>
                )}
              </div>

              {/* Manual Contact Search */}
              <div className="border-t border-base-c pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c mb-2">
                  Or Search Another Contact to Merge
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-c" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchContacts(e.target.value)}
                    placeholder="Search by name, phone number, email, or WA ID..."
                    className="w-full rounded-xl border border-base-c bg-card-c pl-9 pr-4 py-2 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-c" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-base-c bg-subtle-c/30 p-2">
                    {searchResults.map((contact) => (
                      <div 
                        key={contact.id}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-card-c transition-colors text-xs"
                      >
                        <div>
                          <div className="font-semibold text-primary-c">{contact.name || 'Unnamed'}</div>
                          <div className="text-[11px] text-muted-c flex gap-3 font-mono">
                            {contact.phone && <span>{contact.phone}</span>}
                            {contact.email && <span>{contact.email}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectSecondary(contact)}
                          className="rounded-md border border-base-c bg-card-c px-2.5 py-1 text-[11px] font-semibold text-primary-500 hover:bg-primary-500 hover:text-white transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 2: Field Conflict Resolution Matrix */}
          {currentStep === 'resolve_fields' && secondaryContact && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-primary-c">Field Resolution Matrix</h3>
                  <p className="text-xs text-muted-c">Choose which value to preserve on the retained primary contact record.</p>
                </div>
                <button
                  onClick={() => setCurrentStep('select_candidate')}
                  className="text-xs text-primary-500 hover:underline cursor-pointer"
                >
                  Change Secondary Contact
                </button>
              </div>

              {/* Side-by-Side Resolution Table */}
              <div className="overflow-hidden rounded-xl border border-base-c">
                <table className="w-full text-xs text-left">
                  <thead className="bg-subtle-c text-[11px] font-bold uppercase tracking-wider text-muted-c border-b border-base-c">
                    <tr>
                      <th className="py-2.5 px-4 w-1/4">Field</th>
                      <th className="py-2.5 px-4 w-3/8 text-primary-c">
                        Primary (Retained)
                        <div className="text-[10px] text-muted-c font-normal">{primaryContact.name}</div>
                      </th>
                      <th className="py-2.5 px-4 w-3/8 text-primary-c">
                        Secondary (To Archive)
                        <div className="text-[10px] text-muted-c font-normal">{secondaryContact.name}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-c bg-card-c">
                    
                    {/* Name */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-secondary-c">Full Name</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="name_source" 
                            checked={selectedNameSource === 'primary'} 
                            onChange={() => setSelectedNameSource('primary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedNameSource === 'primary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {primaryContact.name || '<empty>'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="name_source" 
                            checked={selectedNameSource === 'secondary'} 
                            onChange={() => setSelectedNameSource('secondary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedNameSource === 'secondary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {secondaryContact.name || '<empty>'}
                          </span>
                        </label>
                      </td>
                    </tr>

                    {/* Phone Number */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-secondary-c">Phone / WhatsApp</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="phone_source" 
                            checked={selectedPhoneSource === 'primary'} 
                            onChange={() => setSelectedPhoneSource('primary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={`font-mono ${selectedPhoneSource === 'primary' ? 'font-bold text-primary-c' : 'text-muted-c'}`}>
                            {primaryContact.phone || primaryContact.waId || '<empty>'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="phone_source" 
                            checked={selectedPhoneSource === 'secondary'} 
                            onChange={() => setSelectedPhoneSource('secondary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={`font-mono ${selectedPhoneSource === 'secondary' ? 'font-bold text-primary-c' : 'text-muted-c'}`}>
                            {secondaryContact.phone || secondaryContact.waId || '<empty>'}
                          </span>
                        </label>
                      </td>
                    </tr>

                    {/* Email */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-secondary-c">Email Address</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="email_source" 
                            checked={selectedEmailSource === 'primary'} 
                            onChange={() => setSelectedEmailSource('primary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedEmailSource === 'primary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {primaryContact.email || '<empty>'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="email_source" 
                            checked={selectedEmailSource === 'secondary'} 
                            onChange={() => setSelectedEmailSource('secondary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedEmailSource === 'secondary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {secondaryContact.email || '<empty>'}
                          </span>
                        </label>
                      </td>
                    </tr>

                    {/* Source */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-secondary-c">Lead Source</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="source_origin" 
                            checked={selectedSourceOrigin === 'primary'} 
                            onChange={() => setSelectedSourceOrigin('primary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedSourceOrigin === 'primary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {primaryContact.source || '<empty>'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="source_origin" 
                            checked={selectedSourceOrigin === 'secondary'} 
                            onChange={() => setSelectedSourceOrigin('secondary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedSourceOrigin === 'secondary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {secondaryContact.source || '<empty>'}
                          </span>
                        </label>
                      </td>
                    </tr>

                    {/* Marketing Opt-Out */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-secondary-c">Opt-Out Status</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="optout_source" 
                            checked={selectedOptOutSource === 'primary'} 
                            onChange={() => setSelectedOptOutSource('primary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedOptOutSource === 'primary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {primaryContact.marketingOptedOut ? 'Opted Out' : 'Active (Subscribed)'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="optout_source" 
                            checked={selectedOptOutSource === 'secondary'} 
                            onChange={() => setSelectedOptOutSource('secondary')}
                            className="text-primary-500 focus:ring-primary-500"
                          />
                          <span className={selectedOptOutSource === 'secondary' ? 'font-bold text-primary-c' : 'text-muted-c'}>
                            {secondaryContact.marketingOptedOut ? 'Opted Out' : 'Active (Subscribed)'}
                          </span>
                        </label>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Tag Union */}
              <div className="rounded-xl border border-base-c bg-subtle-c/30 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-2">
                  <TagIcon className="h-4 w-4 text-primary-500" />
                  Combined Tags (Automatic Union)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-base-c bg-card-c px-2 py-0.5 text-xs text-primary-c shadow-xs">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-c italic">No tags associated with either contact.</span>
                  )}
                </div>
              </div>

              {/* Re-parenting Guarantee Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  <Layers className="h-4 w-4" />
                  Automatic Child Entity Re-Parenting
                </div>
                <p className="text-muted-c leading-relaxed">
                  All conversational history, messages, tickets, leads, bookings, appointments, journeys, and activity logs attached to <strong className="text-primary-c">{secondaryContact.name}</strong> will be re-assigned directly to <strong className="text-primary-c">{primaryContact.name}</strong> inside a single atomic transaction.
                </p>
              </div>

              {/* Optional Merge Notes */}
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1">
                  Merge Reason / Audit Notes (Optional)
                </label>
                <textarea
                  value={mergeNotes}
                  onChange={(e) => setMergeNotes(e.target.value)}
                  placeholder="e.g., Identified customer using secondary personal mobile number for WhatsApp support."
                  rows={2}
                  className="w-full rounded-xl border border-base-c bg-card-c p-3 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
                />
              </div>

            </div>
          )}

          {/* STEP 3: Confirm & Merge */}
          {currentStep === 'confirm_merge' && secondaryContact && (
            <div className="space-y-6">
              
              {/* Caution Callout */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Irreversible Action
                </div>
                <p className="text-secondary-c leading-relaxed">
                  You are about to merge <strong className="text-primary-c">{secondaryContact.name}</strong> into <strong className="text-primary-c">{primaryContact.name}</strong>. The secondary record will be marked as merged (<code className="font-mono">isMerged = true</code>) and archived. All child entities and conversation messages will permanently point to the primary contact.
                </p>
              </div>

              {/* Review of Final Preserved Profile */}
              <div className="rounded-xl border border-base-c bg-card-c p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c border-b border-base-c pb-2">
                  Resulting Preserved Profile
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-c block">Name:</span>
                    <span className="font-semibold text-primary-c">{getWinningValue('name') || 'Unnamed'}</span>
                  </div>
                  <div>
                    <span className="text-muted-c block">Phone / WA ID:</span>
                    <span className="font-mono font-semibold text-primary-c">{getWinningValue('phone') || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-muted-c block">Email:</span>
                    <span className="font-semibold text-primary-c">{getWinningValue('email') || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-muted-c block">Source:</span>
                    <span className="font-semibold text-primary-c">{getWinningValue('source') || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-muted-c block">Marketing Consent:</span>
                    <span className="font-semibold text-primary-c">{getWinningValue('optOut') ? 'Opted Out' : 'Active (Opted In)'}</span>
                  </div>
                  <div>
                    <span className="text-muted-c block">Total Tags:</span>
                    <span className="font-semibold text-primary-c">{selectedTags.length} tags combined</span>
                  </div>
                </div>
              </div>

              {/* Error Message if merge failed */}
              {mergeError && (
                <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-xs text-danger-600 dark:text-danger-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{mergeError}</span>
                </div>
              )}

              {/* Success Result Display */}
              {mergeResult && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-primary-c">Merge Completed Successfully!</h4>
                  <p className="text-xs text-muted-c">
                    Transferred entities: {Object.entries(mergeResult.transferredEntities || {})
                      .map(([k, v]) => `${v} ${k.replace('_', ' ')}`)
                      .join(', ') || 'No child records to transfer'}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-base-c px-6 py-4 bg-subtle-c/50">
          <div>
            {currentStep === 'resolve_fields' && (
              <button
                type="button"
                onClick={() => setCurrentStep('select_candidate')}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c cursor-pointer"
              >
                Back to Selection
              </button>
            )}
            {currentStep === 'confirm_merge' && !mergeResult && (
              <button
                type="button"
                onClick={() => setCurrentStep('resolve_fields')}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c cursor-pointer"
              >
                Back to Field Resolution
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 'select_candidate' && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 'resolve_fields' && (
              <button
                type="button"
                onClick={() => setCurrentStep('confirm_merge')}
                className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Review Merge <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {currentStep === 'confirm_merge' && !mergeResult && (
              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={merging}
                className="flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {merging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing Atomic Merge...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4" />
                    Confirm & Execute Merge
                  </>
                )}
              </button>
            )}

            {mergeResult && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-primary-500 px-6 py-2 text-xs font-bold text-white shadow-soft hover:bg-primary-600 cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
