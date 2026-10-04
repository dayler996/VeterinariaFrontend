// frontend/src/components/forms/ClienteForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';
import {
  User, CreditCard, Phone, MapPin, Heart, Camera,
  Check, X, AlertTriangle, Sparkles, Users as UsersIcon,
  Info, ArrowRight, CheckCircle2, XCircle, Globe,
} from 'lucide-react';
import ImageUploader from '../common/ImageUploader';
import { getImageUrl } from '../../utils/imageUtils';

/* ═══════════════════════════════════════════════════
   HELPERS — Formato de teléfono (VE + internacional)
   ═══════════════════════════════════════════════════
   Reglas:
   • Si empieza con "0"          → formato venezolano: 0424-6324325
   • Si empieza con "+"          → formato internacional: +58 424-6324325
   • Si empieza con otros dígitos → se muestra crudo pero agrupado
   ═══════════════════════════════════════════════════ */

/**
 * Formatea el valor visual del teléfono según su tipo
 */
const formatPhone = (value) => {
  const str = String(value || '');

  // Caso internacional: empieza con +
  if (str.startsWith('+')) {
    const digits = str.replace(/\D/g, '');
    if (!digits) return '+';
    // +XX XXX-XXXXXXX (agrupa código + área + resto)
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 13)}`;
  }

  // Caso venezolano: empieza con 0
  const digits = str.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
  }

  // Caso mixto (sin + ni 0 al inicio): mostrar crudo
  return digits.slice(0, 15);
};

/**
 * Extrae solo los dígitos (para enviar al backend)
 */
const unformat = (value) => String(value || '').replace(/\D/g, '');

/**
 * Determina el tipo de teléfono basado en el valor visual
 */
const getPhoneType = (value) => {
  const str = String(value || '');
  if (str.startsWith('+')) return 'international';
  if (str.replace(/\D/g, '').startsWith('0')) return 'venezolano';
  return 'other';
};

/* ═══════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════ */
const schema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .refine((v) => v.trim().length >= 3, 'No puede ser solo espacios'),
  cedula: z
    .string()
    .min(1, 'La cédula es obligatoria')
    .regex(/^\d+$/, 'Solo números, sin puntos ni guiones')
    .min(6, 'Debe tener al menos 6 dígitos')
    .max(10, 'Máximo 10 dígitos'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .refine(
      (v) => {
        const digits = unformat(v);
        return digits.length >= 7 && digits.length <= 15;
      },
      'El teléfono debe tener entre 7 y 15 dígitos'
    ),
  sexo: z.enum(['M', 'F'], { required_error: 'Selecciona el sexo' }),
  direccion: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  foto: z.string().nullable().optional(),
});

/* ═══════════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════════ */
const ClienteForm = ({ initialData, onSave, onCancel }) => {
  const isEditing = !!initialData;

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors, isSubmitting, isValid, touchedFields, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: initialData || {},
  });

  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  /* Watchers */
  const foto = watch('foto');
  const nombreWatch = watch('nombre');
  const sexoWatch = watch('sexo');
  const direccionWatch = watch('direccion');

  /* Cargar datos iniciales */
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      // Al cargar, si el teléfono empieza con + o 0, formatearlo
      const telefonoRaw = initialData.telefono || '';
      const digits = unformat(telefonoRaw);
      if (telefonoRaw.startsWith('+')) {
        setPhoneDisplay(formatPhone(`+${digits}`));
      } else {
        setPhoneDisplay(formatPhone(digits));
      }
      setCedulaDisplay(initialData.cedula || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  /* ── Handler teléfono — preserva el "+" si el usuario lo escribe ── */
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;

    // Si el usuario empieza con +, tratamos como internacional
    if (rawValue.startsWith('+')) {
      const digits = rawValue.replace(/\D/g, '').slice(0, 15);
      const formatted = formatPhone(`+${digits}`);
      setPhoneDisplay(formatted);
      setValue('telefono', formatted, { shouldValidate: true, shouldDirty: true });
      return;
    }

    // Caso venezolano: solo dígitos, máx 11
    const digits = rawValue.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digits);
    setPhoneDisplay(formatted);
    setValue('telefono', formatted, { shouldValidate: true, shouldDirty: true });
  };

  /* ── Handler cédula ── */
  const handleCedulaChange = (e) => {
    const raw = unformat(e.target.value).slice(0, 10);
    setValue('cedula', raw, { shouldValidate: true, shouldDirty: true });
    setCedulaDisplay(raw);
  };

  /* ── Estado de cada campo ── */
  const fieldState = (name, value) => {
    const touched = touchedFields[name] || dirtyFields[name];
    if (errors[name]) return 'error';
    if (touched && value && String(value).trim()) return 'valid';
    return 'idle';
  };

  /* ── Progreso ── */
  const progreso = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (nombreWatch?.trim()) filled++;
    if (cedulaDisplay?.trim()) filled++;
    if (phoneDisplay?.trim()) filled++;
    if (sexoWatch) filled++;
    if (direccionWatch?.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [nombreWatch, cedulaDisplay, phoneDisplay, sexoWatch, direccionWatch]);

  const initials = (nombreWatch || '').trim().charAt(0).toUpperCase() || '?';
  const phoneType = getPhoneType(phoneDisplay);
  const phoneDigits = unformat(phoneDisplay);

  const onSubmit = (data) => {
    onSave({
      ...data,
      telefono: unformat(data.telefono),
      cedula: unformat(data.cedula),
    });
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ═══ Vista previa + Progreso ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-cyan-50/60 via-white to-white overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              {foto ? (
                <img
                  src={getImageUrl(foto)}
                  alt="Preview"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                                bg-gradient-to-br from-cyan-100 to-cyan-50
                                border-2 border-white shadow-md
                                flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-500">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider">
                {isEditing ? 'Editando cliente' : 'Vista previa'}
              </p>
              <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
                {nombreWatch?.trim() || 'Nuevo cliente'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                {cedulaDisplay && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                    <CreditCard className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    {cedulaDisplay}
                  </span>
                )}
                {phoneDisplay && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                    {phoneType === 'international' ? (
                      <Globe className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    ) : (
                      <Phone className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                    )}
                    {phoneDisplay}
                  </span>
                )}
                {sexoWatch && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                    text-[10px] font-bold uppercase tracking-wide
                    ${sexoWatch === 'M'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-pink-100 text-pink-700'}`}>
                    {sexoWatch === 'M' ? '♂ Masc' : '♀ Fem'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-4 pt-4 border-t border-cyan-100/60">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-500" strokeWidth={2.5} />
                Progreso del formulario
              </p>
              <span className={`text-[11px] font-bold tabular-nums ${
                progreso === 100 ? 'text-emerald-600' : 'text-cyan-700'
              }`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-cyan-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progreso === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600'
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Datos personales ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
          <UsersIcon className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Datos personales</h3>
        </div>

        <div className="space-y-4">

          {/* Nombre */}
          <FormField
            icon={User}
            label="Nombre completo"
            required
            state={fieldState('nombre', nombreWatch)}
            error={errors.nombre?.message}
            hint={
              fieldState('nombre', nombreWatch) === 'valid'
                ? 'Nombre válido'
                : 'Nombre y apellido del cliente'
            }
          >
            <input
              autoFocus
              placeholder="Ej: Juan Pérez García"
              {...register('nombre')}
              className={inputCls(fieldState('nombre', nombreWatch))}
            />
          </FormField>

          {/* Cédula + Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              icon={CreditCard}
              label="Cédula"
              required
              state={fieldState('cedula', cedulaDisplay)}
              error={errors.cedula?.message}
              hint={
                fieldState('cedula', cedulaDisplay) === 'valid'
                  ? 'Cédula válida'
                  : `${cedulaDisplay.length}/10 dígitos`
              }
            >
              <input
                type="text"
                inputMode="numeric"
                value={cedulaDisplay}
                onChange={handleCedulaChange}
                placeholder="12345678"
                className={`${inputCls(fieldState('cedula', cedulaDisplay))} tabular-nums`}
              />
              <input type="hidden" {...register('cedula')} />
            </FormField>

            <FormField
              icon={phoneType === 'international' ? Globe : Phone}
              label="Teléfono"
              required
              state={fieldState('telefono', phoneDisplay)}
              error={errors.telefono?.message}
              hint={
                fieldState('telefono', phoneDisplay) === 'valid'
                  ? phoneType === 'international'
                    ? 'Teléfono internacional válido'
                    : 'Teléfono válido'
                  : 'Nacional: 0424-6324325 · Internacional: +58 424-6324325'
              }
            >
              <input
                type="tel"
                inputMode="tel"
                value={phoneDisplay}
                onChange={handlePhoneChange}
                placeholder="0424-6324325 o +58..."
                className={`${inputCls(fieldState('telefono', phoneDisplay))} tabular-nums`}
              />
              <input type="hidden" {...register('telefono')} />
            </FormField>
          </div>

          {/* Chips de ejemplo rápido (solo cuando está vacío) */}
          {!phoneDisplay && (
            <div className="flex items-center gap-1.5 flex-wrap -mt-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Ejemplos:
              </span>
              {[
                { label: '🇻🇪 Nacional', value: '0424-6324325' },
                { label: '🌎 EE.UU.', value: '+1 555-1234567' },
                { label: '🇪🇸 España', value: '+34 612-345678' },
                { label: '🇨🇴 Colombia', value: '+57 300-1234567' },
              ].map((ex) => (
                <button
                  key={ex.value}
                  type="button"
                  onClick={() => {
                    setPhoneDisplay(ex.value);
                    setValue('telefono', ex.value, { shouldValidate: true, shouldDirty: true });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                             bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-700
                             text-[10px] font-medium transition
                             border border-slate-200 hover:border-cyan-300"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}

          {/* Chip indicador del tipo detectado */}
          {phoneDisplay && fieldState('telefono', phoneDisplay) === 'valid' && (
            <div className="flex items-center gap-2 -mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                            text-[10px] font-bold uppercase tracking-wide border
                  ${phoneType === 'international'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : phoneType === 'venezolano'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                {phoneType === 'international' ? (
                  <>
                    <Globe className="w-3 h-3" strokeWidth={2.5} />
                    Internacional
                  </>
                ) : phoneType === 'venezolano' ? (
                  <>
                    <Phone className="w-3 h-3" strokeWidth={2.5} />
                    Venezuela
                  </>
                ) : (
                  <>
                    <Phone className="w-3 h-3" strokeWidth={2.5} />
                    Número
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {phoneDigits.length} dígitos
              </span>
            </div>
          )}

          {/* Sexo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-cyan-500" strokeWidth={2.2} />
              Sexo <span className="text-red-500">*</span>
              {sexoWatch && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                  Válido
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'M', label: 'Masculino', symbol: '♂', tone: 'blue' },
                { value: 'F', label: 'Femenino',  symbol: '♀', tone: 'pink' },
              ].map((opt) => {
                const isActive = sexoWatch === opt.value;
                const toneCls = opt.tone === 'blue'
                  ? {
                      active: 'bg-blue-500 border-blue-500 text-white shadow-blue-500/30',
                      hover: 'hover:border-blue-300 hover:bg-blue-50',
                    }
                  : {
                      active: 'bg-pink-500 border-pink-500 text-white shadow-pink-500/30',
                      hover: 'hover:border-pink-300 hover:bg-pink-50',
                    };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('sexo', opt.value, { shouldValidate: true, shouldDirty: true })}
                    className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-lg
                               border-2 text-sm font-semibold transition-all
                               ${isActive
                                 ? `${toneCls.active} shadow-md`
                                 : `bg-white border-slate-200 text-slate-600 ${toneCls.hover}`}`}
                  >
                    <span className="text-lg leading-none">{opt.symbol}</span>
                    <span>{opt.label}</span>
                    {isActive && (
                      <Check className="w-4 h-4 absolute top-1.5 right-1.5 opacity-90" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('sexo')} />
            {errors.sexo && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                {errors.sexo.message}
              </p>
            )}
          </div>

          {/* Dirección */}
          <FormField
            icon={MapPin}
            label="Dirección"
            optional
            state={fieldState('direccion', direccionWatch)}
            error={errors.direccion?.message}
            hint={`${direccionWatch?.length || 0}/200 caracteres`}
          >
            <textarea
              rows="3"
              placeholder="Ej: Av. Bolívar, Casa #45, Sector Centro, Caracas"
              {...register('direccion')}
              className={`${inputCls(fieldState('direccion', direccionWatch))} resize-none`}
            />
          </FormField>
        </div>
      </section>

      {/* ═══ Foto ═══ */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-cyan-600 rounded-full"></span>
          <Camera className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2.2} />
          <h3 className="text-base font-semibold text-slate-800">Foto de perfil</h3>
          <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={2.5} />
          Ayuda a identificar al cliente rápidamente en el sistema
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <ImageUploader
            value={foto}
            onChange={(url) => setValue('foto', url, { shouldDirty: true })}
            folder="cliente"
            label="Subir imagen"
          />
        </div>
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
                     px-5 py-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-semibold
                     hover:from-cyan-600 hover:to-cyan-700 active:from-cyan-700 active:to-cyan-800
                     transition disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-md shadow-cyan-600/25
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
              {isEditing ? 'Guardar cambios' : 'Crear cliente'}
              <ArrowRight className="w-4 h-4 opacity-70" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════
   FormField — con indicador de estado
   ═══════════════════════════════════════════════════ */
const FormField = ({ icon: Icon, label, required, optional, state, error, hint, children }) => {
  const stateCls = {
    idle:  { bg: 'bg-cyan-100',    text: 'text-cyan-600',    hintIcon: Info },
    valid: { bg: 'bg-emerald-100', text: 'text-emerald-600', hintIcon: CheckCircle2 },
    error: { bg: 'bg-red-100',     text: 'text-red-600',     hintIcon: XCircle },
  }[state] || { bg: 'bg-cyan-100', text: 'text-cyan-600', hintIcon: Info };

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
        {state === 'valid' && (
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
  return `${base} border-slate-300 hover:border-slate-400 focus:ring-cyan-500`;
};

export default ClienteForm;