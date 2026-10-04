import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getParametrosFactura,
  upsertParametroFactura,
} from '../../services/parametroFacturaService';
import { getBCVRate } from '../../services/configuracionService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const FacturaConfigPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol?.nombre === 'ADMIN';

  /* Valores */
  const [factor, setFactor] = useState('');
  const [iva, setIva] = useState('');
  const [autoBCV, setAutoBCV] = useState(false);

  /* Estado BCV */
  const [bcvLoading, setBcvLoading] = useState(false);
  const [bcvInfo, setBcvInfo] = useState(null); // { ok, rate, date, source, message }
  const [bcvError, setBcvError] = useState(null); // string con mensaje de error

  /* Estado general */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParametros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadParametros = async () => {
    try {
      const res = await getParametrosFactura();
      const data = res.data || {};
      setFactor(data.factor_cambio || '');
      setIva(data.iva_porcentaje || '');
      const autoActivo =
        data.factor_cambio_auto === 'true' || data.factor_cambio_auto === true;
      setAutoBCV(autoActivo);

      if (autoActivo) {
        consultarBCV(true);
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  /* ── Consulta BCV ───────────────────────────────────────── */
  const consultarBCV = async (silencioso = false) => {
    setBcvLoading(true);
    setBcvError(null);
    try {
      const data = await getBCVRate();

      // El backend responde 200 siempre. Revisamos `ok`.
      if (!data?.ok || !data?.rate) {
        setBcvInfo(null);
        setBcvError(
          data?.message ||
            'No se pudo obtener la tasa del BCV. Ingresa el valor manualmente.'
        );
        if (!silencioso) {
          toast.error('No se pudo obtener la tasa del BCV');
        }
        return;
      }

      setBcvInfo(data);
      setFactor(String(data.rate));

      if (!silencioso) {
        toast.success(`Tasa BCV: Bs. ${Number(data.rate).toFixed(2)}`);
      }
    } catch (error) {
      // Error de red / timeout
      setBcvInfo(null);
      setBcvError(
        error?.response?.data?.message ||
          'Error de conexión al consultar el BCV. Ingresa el valor manualmente.'
      );
      if (!silencioso) {
        toast.error('Error al consultar el BCV');
      }
    } finally {
      setBcvLoading(false);
    }
  };

  /* ── Toggle auto/manual ─────────────────────────────────── */
  const handleToggleAuto = async (nuevoValor) => {
    if (!isAdmin) return;
    setAutoBCV(nuevoValor);

    if (nuevoValor) {
      // Al activar, intenta consultar. Si falla, deja el input manual
      // y muestra mensaje amigable (no rompe nada).
      await consultarBCV(true);
    } else {
      // Al desactivar limpiamos el error/estado
      setBcvError(null);
    }
  };

  /* ── Guardar ────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Solo administradores pueden modificar esta configuración');
      return;
    }

    if (!factor || isNaN(parseFloat(factor))) {
      toast.error('Ingrese un valor numérico válido para el factor de cambio');
      return;
    }
    if (!iva || isNaN(parseFloat(iva))) {
      toast.error('Ingrese un valor numérico válido para el IVA');
      return;
    }

    setSaving(true);
    try {
      await upsertParametroFactura({
        clave: 'factor_cambio',
        valor: factor,
        descripcion: 'Tasa de cambio USD a Bs',
      });

      await upsertParametroFactura({
        clave: 'iva_porcentaje',
        valor: iva,
        descripcion: 'Porcentaje de IVA',
      });

      await upsertParametroFactura({
        clave: 'factor_cambio_auto',
        valor: autoBCV ? 'true' : 'false',
        descripcion: 'Modo automático del factor de cambio (BCV)',
      });

      toast.success('Configuración guardada');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al guardar:', error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <svg
            className="animate-spin w-8 h-8 mx-auto text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-gray-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <PageHeader
        icon="⚙️"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Configuración de Facturación' },
        ]}
        title="Configuración de Facturación"
        subtitle={
          isAdmin
            ? 'Modifica la tasa de cambio y el IVA'
            : 'Solo lectura — Contacta a un administrador para modificar'
        }
      />

      {/* Aviso para no-admin */}
      {!isAdmin && (
        <div className="mb-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <svg
            className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Estás en modo solo lectura
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Solo los administradores pueden modificar la configuración de
              facturación.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* ═══════ MODO AUTOMÁTICO BCV ═══════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  autoBCV ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    autoBCV ? 'text-green-600' : 'text-gray-500'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800">
                  Tasa automática BCV
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Obtiene la tasa oficial del dólar desde bcv.org.ve
                </p>
              </div>
            </div>

            {/* Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={autoBCV}
              disabled={!isAdmin}
              onClick={() => handleToggleAuto(!autoBCV)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${autoBCV ? 'bg-green-600' : 'bg-gray-200'}
                ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition
                  ${autoBCV ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Estado: cargando */}
          {autoBCV && bcvLoading && !bcvInfo && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-xs text-gray-500">
                Consultando tasa del BCV...
              </p>
            </div>
          )}

          {/* Estado: éxito */}
          {autoBCV && bcvInfo?.ok && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Tasa actual
                  </p>
                  <p className="text-2xl font-bold text-green-700 mt-0.5 tabular-nums">
                    Bs. {Number(bcvInfo.rate).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-green-700 mt-1">
                    Fuente: {bcvInfo.source}
                    {bcvInfo.date && (
                      <>
                        {' · '}
                        {(() => {
                          try {
                            return new Date(bcvInfo.date).toLocaleDateString(
                              'es-ES'
                            );
                          } catch {
                            return bcvInfo.date;
                          }
                        })()}
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => consultarBCV()}
                  disabled={bcvLoading || !isAdmin}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                             text-green-700 bg-white border border-green-300 rounded-lg
                             hover:bg-green-100 transition disabled:opacity-50"
                  title="Refrescar tasa"
                >
                  {bcvLoading ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  Refrescar
                </button>
              </div>
              <p className="text-[10px] text-green-600 mt-2 leading-relaxed">
                💡 El BCV publica la tasa los días hábiles. Los fines de semana y
                feriados se mantiene vigente la última tasa publicada.
              </p>
            </div>
          )}

          {/* Estado: error BCV (página NO se rompe) */}
          {autoBCV && bcvError && !bcvLoading && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M4.062 20h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.33 17c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-800">
                    No se pudo obtener la tasa del BCV
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {bcvError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => consultarBCV()}
                disabled={bcvLoading || !isAdmin}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                           text-amber-700 bg-white border border-amber-300 rounded-lg
                           hover:bg-amber-100 transition disabled:opacity-50"
              >
                Reintentar
              </button>
            </div>
          )}
        </section>

        {/* ═══════ VALORES ═══════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            <h2 className="text-base font-semibold text-gray-800">Valores</h2>
          </div>

          <div className="space-y-4">
            {/* Factor de cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Factor de cambio (1 USD = ? Bs)
                {autoBCV && bcvInfo?.ok && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    AUTO
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={factor}
                onChange={(e) => setFactor(e.target.value)}
                readOnly={!isAdmin || (autoBCV && bcvInfo?.ok)}
                tabIndex={!isAdmin || (autoBCV && bcvInfo?.ok) ? -1 : 0}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${
                    !isAdmin || (autoBCV && bcvInfo?.ok)
                      ? 'bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200'
                      : 'border-gray-300'
                  }`}
                placeholder="Ej. 60.50"
              />
              {autoBCV && bcvInfo?.ok && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Se actualiza automáticamente desde el BCV.
                </p>
              )}
              {autoBCV && !bcvInfo?.ok && isAdmin && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Modo automático activo pero sin tasa disponible — ingresa el
                  valor manualmente.
                </p>
              )}
            </div>

            {/* IVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Porcentaje de IVA (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                readOnly={!isAdmin}
                tabIndex={!isAdmin ? -1 : 0}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${
                    !isAdmin
                      ? 'bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200'
                      : 'border-gray-300'
                  }`}
                placeholder="Ej. 16"
              />
            </div>
          </div>
        </section>

        {/* ═══════ BOTONES ═══════ */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transition order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition disabled:opacity-50
                         inline-flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar configuración
                </>
              )}
            </button>
          </div>
        )}

        {!isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                       hover:bg-gray-200 transition"
          >
            Volver al dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default FacturaConfigPage;