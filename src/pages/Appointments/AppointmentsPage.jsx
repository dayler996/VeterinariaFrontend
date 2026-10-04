import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { getCitas, updateCita, deleteCita } from '../../services/citaService';
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascotas } from '../../services/mascotaService';
import { getEstadosCita } from '../../services/estadoCitaService';
import { Modal } from '../../components/common/Modal';
import CitaForm from '../../components/forms/CitaForm';
import toast from 'react-hot-toast';
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight,
  Stethoscope, Scissors, Activity, XCircle,
  CheckCircle2, Clock, Filter, Calendar as CalendarIcon,
} from 'lucide-react';

import { daysOfWeek, daysOfWeekAbbr, monthsOfYear } from '../../utils/calendarSpanish';
import 'moment/locale/es';
moment.locale('es');

const localizer = momentLocalizer(moment);

/* ── Traducciones ── */
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (total) => `+ Ver más (${total})`,
};

/* ── Formatos personalizados ── */
const formats = {
  weekdayFormat: (date) => daysOfWeek[date.getDay()],
  dayFormat: (date) => daysOfWeekAbbr[date.getDay()],
  monthHeaderFormat: (date) => `${monthsOfYear[date.getMonth()]} ${date.getFullYear()}`,
  dayHeaderFormat: (date) =>
    `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${monthsOfYear[date.getMonth()]}`,
  dayRangeHeaderFormat: ({ start, end }) => {
    const sD = start.getDate();
    const sM = monthsOfYear[start.getMonth()];
    const eD = end.getDate();
    const eM = monthsOfYear[end.getMonth()];
    if (start.getMonth() === end.getMonth()) return `${sD} - ${eD} ${sM}`;
    return `${sD} ${sM} - ${eD} ${eM}`;
  },
};

/* ── Toolbar personalizada ── */
const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  const viewOptions = [
    { key: 'month', label: 'Mes' },
    { key: 'week', label: 'Semana' },
    { key: 'day', label: 'Día' },
    { key: 'agenda', label: 'Agenda' },
  ];

  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Fila 1: navegación + label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200
                       text-slate-700 hover:bg-slate-50 transition"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate capitalize">
          {label}
        </h2>
      </div>

      {/* Fila 2: switch de vistas */}
      <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {viewOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onView(opt.key)}
            className={`flex-1 min-w-[70px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition
              ${view === opt.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'week' : 'month'
  );
  const [calendarHeight, setCalendarHeight] = useState('calc(100vh - 260px)');

  useEffect(() => {
    const computeHeight = () => {
      const w = window.innerWidth;
      if (w < 640) setCalendarHeight('calc(100vh - 300px)');
      else if (w < 1024) setCalendarHeight('calc(100vh - 280px)');
      else setCalendarHeight('calc(100vh - 240px)');
    };
    computeHeight();
    window.addEventListener('resize', computeHeight);
    return () => window.removeEventListener('resize', computeHeight);
  }, []);

  useEffect(() => {
    loadCitas();
    loadDoctores();
    loadMascotas();
    loadEstados();
  }, []);

  const loadCitas = async () => {
    setLoading(true);
    try {
      const res = await getCitas();
      const mapped = res.data.map((cita) => {
        const start = new Date(cita.fechaHora);
        const end = new Date(start.getTime() + 30 * 60000);
        const estado = (cita.estado?.nombre || '').toUpperCase();
        let color = 'bg-blue-500';
        if (estado.includes('CANCEL')) color = 'bg-red-500';
        else if (estado.includes('COMPLET') || estado.includes('ATENDID')) color = 'bg-emerald-500';
        else if (estado.includes('PENDIENT')) color = 'bg-amber-500';

        return {
          id: cita.id,
          title: `${cita.mascota?.nombre || ''} - Dr. ${cita.doctor?.nombre || ''}`,
          start,
          end,
          resource: cita,
          color,
        };
      });
      setEvents(mapped);
    } catch {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores();
      setDoctores(res.data);
    } catch {
      toast.error('Error al cargar doctores');
    }
  };

  const loadMascotas = async () => {
    try {
      const res = await getMascotas();
      setMascotas(res.data);
    } catch {
      toast.error('Error al cargar mascotas');
    }
  };

  const loadEstados = async () => {
    try {
      const res = await getEstadosCita();
      setEstados(res.data);
    } catch {
      toast.error('Error al cargar estados');
    }
  };

  const handleSelectSlot = (slotInfo) => {
    navigate(`/citas/nueva?fechaHora=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setShowModal(true);
  };

  const handleSave = async (citaData) => {
    try {
      await updateCita(selectedEvent.id, citaData);
      toast.success('Cita actualizada');
      setShowModal(false);
      loadCitas();
    } catch {
      toast.error('Error al actualizar cita');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCita(selectedEvent.id);
      toast.success('Cita eliminada');
      setShowModal(false);
      loadCitas();
    } catch {
      toast.error('Error al eliminar cita');
    }
  };

  /* ── Estilos para eventos del calendario ── */
  const eventPropGetter = (event) => ({
    className: `!${event.color} !text-white !border-none !rounded-md !px-1.5 !text-xs !font-medium`,
  });

  /* Contadores por estado */
  const totalCitas = events.length;
  const pendientes = events.filter((e) => {
    const estado = (e.resource?.estado?.nombre || '').toUpperCase();
    return estado.includes('PENDIENT');
  }).length;
  const atendidas = events.filter((e) => {
    const estado = (e.resource?.estado?.nombre || '').toUpperCase();
    return estado.includes('COMPLET') || estado.includes('ATENDID');
  }).length;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="p-3 sm:p-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
            <CalendarDays className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Agenda de Citas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {totalCitas} {totalCitas === 1 ? 'cita registrada' : 'citas registradas'}
              {pendientes > 0 && (
                <span className="text-amber-600 font-medium"> · {pendientes} pendiente{pendientes === 1 ? '' : 's'}</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/citas/nueva')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium
                     hover:bg-blue-700 active:bg-blue-800 transition
                     shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Cita
        </button>
      </div>

      {/* ═══ Stats cards ═══ */}
      {totalCitas > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <StatCard
            icon={Clock}
            label="Total"
            value={totalCitas}
            tone="blue"
          />
          <StatCard
            icon={CalendarIcon}
            label="Pendientes"
            value={pendientes}
            tone="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Atendidas"
            value={atendidas}
            tone="emerald"
          />
        </div>
      )}

      {/* ═══ Card del calendario ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: calendarHeight, minHeight: 420 }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          defaultView={view}
          messages={messages}
          formats={formats}
          components={{ toolbar: CustomToolbar }}
          eventPropGetter={eventPropGetter}
          popup
          longPressThreshold={100}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-3">
          <span className="animate-spin w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full" />
          Cargando citas...
        </div>
      )}

      {/* ═══ Modal de edición ═══ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Editar Cita"
        size="md"
      >
        <CitaForm
          initialData={selectedEvent}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          onDelete={handleDelete}
          doctores={doctores}
          mascotas={mascotas}
          estados={estados}
        />
      </Modal>
    </div>
  );
};

/* ── Stat card reutilizable ── */
const StatCard = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const toneCls = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', value: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', value: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', value: 'text-emerald-700' },
  }[tone];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 sm:p-4 flex items-center gap-3 min-w-0">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${toneCls.bg}`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${toneCls.text}`} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className={`text-lg sm:text-xl font-bold tabular-nums ${toneCls.value}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default AppointmentsPage;