import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

/* ── Icono de ordenamiento ── */
const SortIndicator = ({ direction }) => {
  if (direction === 'asc') {
    return (
      <svg className="w-3 h-3 text-blue-600 shrink-0" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 3l4 5H2z" />
      </svg>
    );
  }
  if (direction === 'desc') {
    return (
      <svg className="w-3 h-3 text-blue-600 shrink-0" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 9l-4-5h8z" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 opacity-30 group-hover:opacity-70 shrink-0" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 2l3 3H3zM6 10l-3-3h6z" />
    </svg>
  );
};

export const DataTable = ({
  columns,
  data,
  onRowClick,
  showGlobalFilter = true,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  rowClassName,
  emptyMessage = 'No hay registros para mostrar',
  pagination,        // opcional: paginación externa (server-side)
  hidePagination = false,  
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const isExternal = !!pagination;

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      ...(isExternal
        ? { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }
        : {}),
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: isExternal ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isExternal ? undefined : getPaginationRowModel(),
    manualPagination: isExternal,
    pageCount: isExternal ? pagination.pageCount : undefined,
    initialState: { pagination: { pageSize: defaultPageSize } },
  });

  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  // Totales para "1–10 de 50"
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = isExternal
    ? pagination.pageCount * pagination.pageSize  // aprox
    : table.getFilteredRowModel().rows.length;

  const showStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const showEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  const handlePageSizeChange = (newSize) => {
    if (isExternal) pagination.onPageSizeChange?.(newSize);
    else table.setPageSize(newSize);
  };

  return (
    <div className="w-full space-y-3">
      {/* ── Buscador ── */}
      {showGlobalFilter && (
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`group px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-gray-600
                          uppercase tracking-wider whitespace-nowrap
                          ${canSort ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIndicator direction={sorted} />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {isEmpty ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`transition-colors
                      ${onRowClick ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-gray-50'}
                      ${rowClassName ? rowClassName(row.original) : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}
                          className="px-3 sm:px-4 py-3 text-sm text-gray-800 max-w-xs">
                        <div className="truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer con paginación ── */}
      {!isEmpty && !hidePagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          {/* Info + page size */}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="whitespace-nowrap text-xs sm:text-sm">
              {showStart}–{showEnd} de {totalRows}
            </span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded-lg text-xs px-2 py-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} / pág</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => isExternal ? pagination.onPageChange(0) : table.setPageIndex(0)}
              disabled={isExternal ? pageIndex === 0 : !table.getCanPreviousPage()}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Primera página"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => isExternal ? pagination.onPageChange(pageIndex - 1) : table.previousPage()}
              disabled={isExternal ? pageIndex === 0 : !table.getCanPreviousPage()}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Página anterior"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1.5 text-sm font-medium text-gray-700 whitespace-nowrap">
              {pageIndex + 1} / {table.getPageCount() || 1}
            </span>

            <button
              onClick={() => isExternal ? pagination.onPageChange(pageIndex + 1) : table.nextPage()}
              disabled={isExternal ? pageIndex >= table.getPageCount() - 1 : !table.getCanNextPage()}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Página siguiente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => isExternal ? pagination.onPageChange(table.getPageCount() - 1) : table.setPageIndex(table.getPageCount() - 1)}
              disabled={isExternal ? pageIndex >= table.getPageCount() - 1 : !table.getCanNextPage()}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Última página"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;