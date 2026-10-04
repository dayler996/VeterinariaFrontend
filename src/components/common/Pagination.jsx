const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Genera array con números y "..." (ellipsis)
  const getPageNumbers = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }

    if (start > 2) pages.push('start-ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('end-ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();
  const btnBase = "inline-flex items-center justify-center min-w-[36px] h-9 px-3 text-sm border rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed";
  const btnNormal = "border-gray-300 text-gray-700 bg-white hover:bg-gray-50";
  const btnActive = "border-blue-600 bg-blue-600 text-white font-medium shadow-sm";

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnNormal}`}
        aria-label="Anterior"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline ml-1">Anterior</span>
      </button>

      {/* Móvil: "3 / 12" compacto */}
      <span className="sm:hidden px-3 text-sm text-gray-600 whitespace-nowrap font-medium">
        {currentPage} / {totalPages}
      </span>

      {/* Desktop: números */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'start-ellipsis' || p === 'end-ellipsis') {
            return <span key={p + idx} className="px-2 text-gray-400 select-none">…</span>;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === currentPage ? btnActive : btnNormal}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnNormal}`}
        aria-label="Siguiente"
      >
        <span className="hidden sm:inline mr-1">Siguiente</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;