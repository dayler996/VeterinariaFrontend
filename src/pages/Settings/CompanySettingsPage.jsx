import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanySettings, updateCompanySettings } from '../../services/companyService';
import ImageUploader from '../../components/common/ImageUploader';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import {
  Building2, Image as ImageIcon, Save, X, Check,
  AlertTriangle, Heart, Sparkles,
} from 'lucide-react';

const CompanySettingsPage = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name);
      setCompanyLogo(settings.logo);
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName?.trim()) {
      toast.error('El nombre de la empresa es requerido');
      return;
    }
    setLoading(true);
    try {
      await updateCompanySettings(companyName, companyLogo);
      toast.success('Configuración guardada');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-spin w-8 h-8 mx-auto border-2 border-slate-200 border-t-slate-600 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Cargando...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 pb-24 sm:pb-4">
      <PageHeader
        icon="🏢"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Configuración de la Empresa' },
        ]}
        title="Configuración de la Empresa"
        subtitle="Datos que se muestran en el login y el dashboard"
      />

      {/* ═══ Banner info ═══ */}
      <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-600/25 shrink-0">
          <Building2 className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Identidad de la empresa
          </p>
          <p className="text-base font-bold text-slate-800 mt-0.5 truncate">
            {companyName || 'Sin nombre'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Estos datos personalizan la experiencia de tus usuarios
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">

        {/* ═══ Card: Nombre ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <Building2 className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Nombre de la veterinaria
            </h2>
            <span className="ml-auto text-[11px] text-red-500 font-medium">Requerido</span>
          </div>

          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ej. Veterinaria Central"
            maxLength={80}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Aparecerá en el login, dashboard y documentos generados.
          </p>
        </section>

        {/* ═══ Card: Logo ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-slate-700 rounded-full"></span>
            <ImageIcon className="w-4 h-4 text-slate-700 shrink-0" strokeWidth={2.2} />
            <h2 className="text-base font-semibold text-slate-800">
              Logo de la empresa
            </h2>
            <span className="ml-auto text-[11px] text-slate-400 font-normal">Opcional</span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <ImageUploader
              value={getImageUrl(companyLogo)}
              onChange={setCompanyLogo}
              folder="company"
              label="Seleccionar logo"
            />
          </div>

          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              El logo se mostrará en la pantalla de login, el dashboard y los PDFs generados.
              Recomendado: <strong>PNG con fondo transparente, mínimo 200×200 px</strong>.
            </p>
          </div>
        </section>

        {/* ═══ Botones (sticky móvil) ═══ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3
                        flex gap-2 z-30
                        sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium
                       hover:bg-slate-200 active:bg-slate-300 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2
                       px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium
                       hover:bg-slate-900 active:bg-black transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm shadow-slate-600/20"
          >
            {loading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2.5} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettingsPage;