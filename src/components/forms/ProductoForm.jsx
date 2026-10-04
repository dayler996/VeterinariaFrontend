// frontend/src/components/forms/ProductoForm.jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import SelectField from '../common/SelectField';
import {
  Package, FileText, Boxes, AlertTriangle, DollarSign,
  TrendingUp, Check, X, Sparkles, CheckCircle2, XCircle,
  Info, ArrowRight, Syringe, Tag, Percent, Warehouse,
  AlertCircle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
const formatCurrency = (value) => {
  const n = Number(value) || 0;
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    descripcion: z
      .string()
      .max(300, 'Máximo 300 caracteres')
      .optional()
      .or(z.literal('')),
    stock: z
      .number({ invalid_type_error: 'Ingresa un número válido' })
      .min(0, 'El stock no puede ser negativo')
      .max(999999, 'Valor demasiado alto'),
    stockMinimo: z
      .number({ invalid_type_error: 'Ingresa un número válido' })
      .min(0, 'El stock mínimo no puede ser negativo')
      .max(999999, 'Valor demasiado alto'),
    precioCosto: z
      .number({ invalid_type_error: 'Ingresa un número válido' })
      .min(0, 'El precio no puede ser negativo'),
    precioVenta: z
      .number({ invalid_type_error: 'Ingresa un número válido' })
      .min(0, 'El precio no puede ser negativo'),
    vacunaId: z.number().optional().nullable(),
  })
  .refine(
    (data) => !data.precioVenta || !data.precioCosto || data.precioVenta >= data.precioCosto,
    {
      message: 'El precio de venta debe ser mayor o igual al costo',
      path: ['precioVenta'],
    }
  );

/* ═══════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════ */
const ProductoForm = ({ initialData, onSave, onCancel, vacunas = [] }) => {
  const isEditing = !!initialData;

  const {
    register, handleSubmit, watch, setValue, reset, control,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: initialData || { stock: 0, stockMinimo: 5 },
  });

  /* Watchers */
  const nombreWatch = watch('nombre');
  const descripcionWatch = watch('descripcion');
  const stockWatch = watch('stock');
  const stockMinimoWatch = watch('stockMinimo');
  const precioCostoWatch = watch('precioCosto');
  const precioVentaWatch = watch('precioVenta');
  const vacunaIdWatch = watch('vacunaId');

  /* Reset al editar */
  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = (data) => onSave(data);

  /* ── Cálculos derivados ── */
  const margen = useMemo(() => {
    const costo = Number(precioCostoWatch) || 0;
    const venta = Number(precioVentaWatch) || 0;
    if (!venta) return 0;
    return Math.round(((venta - costo) / venta) * 100);
  }, [precioCostoWatch, precioVentaWatch]);

  const gananciaUnidad = useMemo(() => {
    const costo = Number(precioCostoWatch) || 0;
    const venta = Number(precioVentaWatch) || 0;
    return venta - costo;
  }, [precioCostoWatch, precioVentaWatch]);

  const stockStatus = useMemo(() => {
    const stock = Number(stockWatch) || 0;
    const min = Number(stockMinimoWatch) || 0;
    if (stock === 0) return { tone: 'red', label: 'Sin stock', Icon: XCircle };
    if (stock <= min) return { tone: 'amber', label: 'Stock bajo', Icon: AlertTriangle };
    return { tone: 'emerald', label: 'Stock OK', Icon: CheckCircle2 };
  }, [stockWatch, stockMinimoWatch]);

  /* Opciones para SelectField */
  const vacunaOptions = useMemo(
    () => vacunas.map((v) => ({
      value: v.id,
      label: v.nombre,
      icon: Syringe,
    })),
    [vacunas]
  );

  /* ── Estado por campo ── */
  const fieldState = (name, value, { allowZero = false } = {}) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (!touched) return 'idle';
    if (allowZero && value === 0) return 'valid';
    if (value !== undefined && value !== null && String(value).trim() !== '' && value !== 0)
      return 'valid';
    return 'idle';
  };

  /* ── Progreso ── */
  const progreso = useMemo(() => {
    let filled = 0;
    if (nombreWatch?.trim()) filled++;
    if (Number(stockWatch) >= 0 && stockWatch !== undefined && stockWatch !== '') filled++;
    if (Number(stockMinimoWatch) >= 0 && stockMinimoWatch !== undefined && stockMinimoWatch !== '') filled++;
    if (Number(precioCostoWatch) >= 0 && precioCostoWatch) filled++;
    if (Number(precioVentaWatch) >= 0 && precioVentaWatch) filled++;
    return Math.round((filled / 5) * 100);
  }, [nombreWatch, stockWatch, stockMinimoWatch, precioCostoWatch, precioVentaWatch]);

  const initials = (nombreWatch || '').trim().charAt(0).toUpperCase() || '?';
  const stockTone = {
    red:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
    amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  }[stockStatus.tone];
  const StockIcon = stockStatus.Icon;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-amber-50/60 via-white to-white overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                              bg-gradient-to-br from-amber-100 to-amber-50
                              border-2 border-white shadow-md
                              flex items-center justify-center">
                {nombreWatch ? (
                  <span className="text-2xl font-bold text-amber-600">{initials}</span>
                ) : (
                  <Package className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500" strokeWidth={2} />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                {isEditing ? 'Editando producto' : 'Vista previa'}
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || 'Nuevo producto'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {Number(stockWatch) >= 0 && stockWatch !== undefined && stockWatch !== '' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border
                    ${stockTone.bg} ${stockTone.text} ${stockTone.border}`}>
                    <StockIcon className="w-3 h-3" strokeWidth={2.5} />
                    {stockStatus.label}
                  </span>
                )}
                {precioVentaWatch > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                    <DollarSign className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {formatCurrency(precioVentaWatch)}
                  </span>
                )}
                {margen > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <Percent className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {margen}% margen
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-amber-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" strokeWidth={2.5} />
                Progreso del formulario
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-amber-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-amber-400 to-amber-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Información básica ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
          <Package className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Información básica</h3>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <FormField
            icon={Tag}
            label="Nombre del producto"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={
              fieldState('nombre', nombreWatch) === 'valid'
                ? 'Nombre válido'
                : 'Ej: Alimento premium, Antibiótico, Shampoo...'
            }
          >
            <input
              autoFocus
              placeholder="Ej: Alimento premium para perros"
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Descripción */}
          <FormField
            icon={FileText}
            label="Descripción"
            optional
            state={fieldState('descripcion', descripcionWatch)}
            error={errors.descripcion?.message}
            hint={`${descripcionWatch?.length || 0}/300 caracteres`}
          >
            <textarea
              rows="3"
              placeholder="Detalles del producto, presentación, marca..."
              {...register('descripcion')}
              className={`${inputCls(fieldState('descripcion', descripcionWatch))} resize-none`}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Inventario ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
          <Warehouse className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Inventario</h3>
          {Number(stockWatch) >= 0 && stockWatch !== undefined && stockWatch !== '' && (
            <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border
              ${stockTone.bg} ${stockTone.text} ${stockTone.border}`}>
              <StockIcon className="w-3 h-3" strokeWidth={2.5} />
              {stockStatus.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stock */}
          <FormField
            icon={Boxes}
            label="Stock actual"
            required
            state={fieldState('stock', stockWatch, { allowZero: true })}
            error={errors.stock?.message}
            hint={`${Number(stockWatch) || 0} unidades disponibles`}
          >
            <input
              type="number"
              min="0"
              placeholder="0"
              {...register('stock', { valueAsNumber: true })}
              className={`${inputCls(fieldState('stock', stockWatch, { allowZero: true }))} tabular-nums`}
            />
          </FormField>

          {/* Stock mínimo */}
          <FormField
            icon={AlertCircle}
            label="Stock mínimo"
            required
            state={fieldState('stockMinimo', stockMinimoWatch, { allowZero: true })}
            error={errors.stockMinimo?.message}
            hint="Se avisará cuando el stock baje de este valor"
          >
            <input
              type="number"
              min="0"
              placeholder="5"
              {...register('stockMinimo', { valueAsNumber: true })}
              className={`${inputCls(fieldState('stockMinimo', stockMinimoWatch, { allowZero: true }))} tabular-nums`}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Precios ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
          <DollarSign className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Precios</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Precio costo */}
          <FormField
            icon={DollarSign}
            label="Precio de costo"
            required
            state={fieldState('precioCosto', precioCostoWatch)}
            error={errors.precioCosto?.message}
            hint={precioCostoWatch > 0 ? formatCurrency(precioCostoWatch) : 'Lo que pagas al proveedor'}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('precioCosto', { valueAsNumber: true })}
              className={`${inputCls(fieldState('precioCosto', precioCostoWatch))} tabular-nums`}
            />
          </FormField>

          {/* Precio venta */}
          <FormField
            icon={TrendingUp}
            label="Precio de venta"
            required
            state={fieldState('precioVenta', precioVentaWatch)}
            error={errors.precioVenta?.message}
            hint={precioVentaWatch > 0 ? formatCurrency(precioVentaWatch) : 'Precio al público'}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('precioVenta', { valueAsNumber: true })}
              className={`${inputCls(fieldState('precioVenta', precioVentaWatch))} tabular-nums`}
            />
          </FormField>
        </div>

        {/* Card de margen (solo si hay precios válidos) */}
        {precioCostoWatch > 0 && precioVentaWatch > 0 && !errors.precioVenta && (
          <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 ${
            margen >= 30
              ? 'bg-emerald-50 border-emerald-200'
              : margen >= 15
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              margen >= 30
                ? 'bg-emerald-100'
                : margen >= 15
                ? 'bg-amber-100'
                : 'bg-red-100'
            }`}>
              <Percent className={`w-5 h-5 ${
                margen >= 30
                  ? 'text-emerald-600'
                  : margen >= 15
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${
                margen >= 30
                  ? 'text-emerald-700'
                  : margen >= 15
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}>
                Margen: {margen}%
              </p>
              <p className={`text-[11px] mt-0.5 ${
                margen >= 30
                  ? 'text-emerald-600'
                  : margen >= 15
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}>
                Ganancia por unidad: <span className="font-semibold tabular-nums">{formatCurrency(gananciaUnidad)}</span>
                {margen < 15 && ' · Considera revisar el precio'}
                {margen >= 30 && ' · Excelente margen'}
              </p>
            </div>
          </div>
        )}

        {/* Aviso si venta < costo */}
        {precioVentaWatch > 0 && precioCostoWatch > 0 && errors.precioVenta && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-900">
                El precio de venta es menor al costo
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Estarías vendiendo con pérdida. Ajusta el precio de venta para cubrir el costo.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ═══ Vacuna asociada ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
          <Syringe className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Vacuna asociada</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Si este producto es una vacuna, asígnala aquí para vincular su stock
        </p>

        <Controller
          name="vacunaId"
          control={control}
          render={({ field }) => (
            <SelectField
              value={field.value}
              onChange={field.onChange}
              options={vacunaOptions}
              placeholder="Buscar vacuna..."
              emptyMessage="No hay vacunas registradas"
              state={vacunaIdWatch ? 'valid' : 'idle'}
              tone="amber"
              searchable={vacunas.length > 8}
            />
          )}
        />
      </section>

      {/* ═══ Footer sticky ═══ */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pt-3 pb-3 sm:pb-0
                      bg-white/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none
                      border-t border-slate-200 sm:border-0
                      flex flex-col sm:flex-row justify-end gap-2 z-10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium
                     hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition
                     disabled:opacity-50 order-2 sm:order-1"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-5 py-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold
                     hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800
                     transition disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-md shadow-amber-600/25
                     order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              {isEditing ? 'Guardar cambios' : 'Crear producto'}
              <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════
   FormField reutilizable
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls = {
    idle:  { bg: 'bg-amber-100',   text: 'text-amber-600',   hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-amber-100', text: 'text-amber-600', hintIcon: Info };

  const HintIcon = stateCls.hintIcon;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${stateCls.bg}`}>
          <Icon className={`w-3 h-3 ${stateCls.text}`} strokeWidth={2.5} />
        </span>
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        )}
        {state === 'valid' && !optional && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
            Válido
          </span>
        )}
      </label>

      <div className="relative">
        {children}
        {state === 'valid' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        {error ? (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {error}
          </p>
        ) : hint ? (
          <p className={`text-[11px] flex items-center gap-1 ${
            state === 'valid' ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            <HintIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        ) : <span />}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Clases input
   ═══════════════════════════════════════════════════ */
const inputCls = (state) => {
  const base = 'w-full rounded-lg px-3.5 py-2.5 text-sm bg-white border transition-colors ' +
               'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 pr-10';
  if (state === 'error') return `${base} border-red-400 focus:ring-red-500`;
  if (state === 'valid') return `${base} border-emerald-300 focus:ring-emerald-500`;
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-amber-500`;
};

export default ProductoForm;