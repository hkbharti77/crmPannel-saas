import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface FlowSubmission {
  id?: string;
  customerPhone?: string;
  createdAt: string;
  normalizedDataJson?: string;
  rawResponseJson?: string;
  [key: string]: any;
}

interface FlowResponsesTableProps {
  submissions: FlowSubmission[];
}

export function FlowResponsesTable({ submissions }: FlowResponsesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Helper to safely parse JSON strings
  const parseJson = (str?: string) => {
    if (!str) return {};
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  // Convert camelCase or snake_case to Title Case
  const formatHeader = (key: string) => {
    const result = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
  };

  // Process and flatten submissions
  const processedData = useMemo(() => {
    return submissions.map(sub => {
      const dataObj = parseJson(sub.normalizedDataJson || sub.rawResponseJson);
      return {
        _phone: sub.customerPhone || 'Unknown',
        _date: sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '-',
        ...dataObj,
      };
    });
  }, [submissions]);

  // Extract unique column keys from all processed data
  const dynamicColumns = useMemo(() => {
    const keys = new Set<string>();
    processedData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== '_phone' && k !== '_date') {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  }, [processedData]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return processedData;
    const lowerQuery = searchQuery.toLowerCase();
    
    return processedData.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }, [processedData, searchQuery]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (submissions.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center border border-dashed border-base-c rounded-xl bg-surface-c">
        <FileText className="h-10 w-10 text-muted-c/50 mb-3" />
        <p className="text-sm font-semibold text-primary-c">No responses found</p>
        <p className="text-xs text-secondary-c mt-1">There are no submissions recorded for this flow yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
          <input
            type="text"
            placeholder="Search responses, phone, or dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-c border border-base-c text-primary-c placeholder:text-muted-c rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="text-xs text-secondary-c font-medium">
          Total: {filteredData.length} records
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-base-c rounded-xl overflow-hidden bg-card-c shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-surface-c border-b border-base-c">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-primary-c uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-primary-c uppercase tracking-wider">Phone</th>
                {dynamicColumns.map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-bold text-primary-c uppercase tracking-wider whitespace-nowrap">
                    {formatHeader(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-c">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-4 py-3 text-xs text-secondary-c whitespace-nowrap">{row._date}</td>
                    <td className="px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{row._phone}</td>
                    {dynamicColumns.map(col => (
                      <td key={col} className="px-4 py-3 text-xs text-primary-c max-w-xs truncate" title={row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}>
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={dynamicColumns.length + 2} className="px-4 py-8 text-center text-sm text-secondary-c">
                    No matching results found for "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-base-c bg-surface-c">
          <div className="text-xs text-secondary-c font-medium">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-primary-c px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
