import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  breadcrumbs = [], // [{ label, to }] — el último sin 'to' es el actual
  title,
  icon,
  subtitle,
  actions, // Nodos JSX de botones
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">/</span>}
              {bc.to ? (
                <button
                  type="button"
                  onClick={() => navigate(bc.to)}
                  className="hover:text-gray-700 transition-colors"
                >
                  {bc.label}
                </button>
              ) : (
                <span className="text-gray-700 font-semibold">{bc.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Título + acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 truncate">
            {icon && <span className="text-2xl shrink-0">{icon}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;