import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Inbox,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './Input';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys,
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize = 10,
  emptyMessage = 'No records found',
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = (item as any)[k];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(item).some(
        (val) => val !== undefined && val !== null && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const startEntry = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Search Toolbar */}
      {searchable && (
        <div className="flex items-center justify-end">
          <div className="max-w-xs w-full">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-[#E5DFD3] bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5DFD3] bg-[#F7F4EE] text-xs font-semibold text-[#4A5D6E] uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      'px-5 py-3.5',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1] text-[#223447]">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-[#7189A0]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[#2B4257]" />
                      <span className="text-sm font-medium">Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-[#7189A0]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-[#97ABBD] stroke-[1.5]" />
                      <span className="text-sm font-medium text-[#5A6D80]">{emptyMessage}</span>
                      {searchTerm && (
                        <p className="text-xs text-[#889AA9]">
                          Try adjusting your search criteria
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors duration-100',
                      onRowClick ? 'cursor-pointer hover:bg-[#E9EFF5]/60' : 'hover:bg-[#FBF9F5]',
                      rowIdx % 2 === 1 ? 'bg-[#FCFAF6]/60' : 'bg-white'
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      const cellContent = col.cell
                        ? col.cell(row, rowIdx)
                        : col.accessorKey
                        ? (row as any)[col.accessorKey]
                        : null;

                      return (
                        <td
                          key={colIdx}
                          className={cn('px-5 py-3.5 text-sm', alignClass, col.className)}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalItems > 0 && (
          <div className="px-5 py-3 border-t border-[#E5DFD3] bg-[#FAF7F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6D80]">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-[#101E2B]">{startEntry}</span> to{' '}
                <span className="font-semibold text-[#101E2B]">{endEntry}</span> of{' '}
                <span className="font-semibold text-[#101E2B]">{totalItems}</span> results
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[#7189A0]">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-[#E5DFD3] bg-white py-1 px-2 text-xs font-medium text-[#2B4257] focus:outline-none focus:ring-1 focus:ring-[#2B4257]"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded border border-[#E5DFD3] bg-white text-[#2B4257] hover:bg-[#F5F0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded border border-[#E5DFD3] bg-white text-[#2B4257] hover:bg-[#F5F0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-[#101E2B]">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded border border-[#E5DFD3] bg-white text-[#2B4257] hover:bg-[#F5F0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded border border-[#E5DFD3] bg-white text-[#2B4257] hover:bg-[#F5F0E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
