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
  showMore: total => `+ Ver más (${total})`,
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
  const isMobileView = view === 'month';
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
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            aria-label="Siguiente"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate capitalize">
          {label}
        </h2>
      </div>

      {/* Fila 2: switch de vistas */}
      <div className="flex items-center justify-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {viewOptions.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onView(opt.key)}
            className={`flex-1 min-w-[70px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition
              ${view === opt.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'}`}
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

  // Vista y altura dinámicas según pantalla
  const [view, setView] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'week' : 'month'
  );
  const [calendarHeight, setCalendarHeight] = useState('calc(100vh - 260px)');

  useEffect(() => {
    const computeHeight = () => {
      const w = window.innerWidth;
      if (w < 640) setCalendarHeight('calc(100vh - 280px)');
      else if (w < 1024) setCalendarHeight('calc(100vh - 260px)');
      else setCalendarHeight('calc(100vh - 220px)');
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
      const mapped = res.data.map(cita => {
        const start = new Date(cita.fechaHora);
        const end = new Date(start.getTime() + 30 * 60000);
        // Color según estado
        const estado = (cita.estado?.nombre || '').toUpperCase();
        let color = 'bg-blue-500';
        if (estado.includes('CANCEL')) color = 'bg-red-500';
        else if (estado.includes('COMPLET') || estado.includes('ATENDID')) color = 'bg-green-500';
        else if (estado.includes('PENDIENT')) color = 'bg-yellow-500';

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
    } catch (error) {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores();
      setDoctores(res.data);
    } catch (error) {
      toast.error('Error al cargar doctores');
    }
  };

  const loadMascotas = async () => {
    try {
      const res = await getMascotas();
      setMascotas(res.data);
    } catch (error) {
      toast.error('Error al cargar mascotas');
    }
  };

  const loadEstados = async () => {
    try {
      const res = await getEstadosCita();
      setEstados(res.data);
    } catch (error) {
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
    } catch (error) {
      toast.error('Error al actualizar cita');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCita(selectedEvent.id);
      toast.success('Cita eliminada');
      setShowModal(false);
      loadCitas();
    } catch (error) {
      toast.error('Error al eliminar cita');
    }
  };

  /* Estilos custom para eventos */
  const eventPropGetter = (event) => ({
    className: `!${event.color} !text-white !border-none !rounded-md !px-1.5 !text-xs !font-medium`,
  });

  return (
    <div className="p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Agenda de Citas</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {events.length} {events.length === 1 ? 'cita registrada' : 'citas registradas'}
          </p>
        </div>
        <button
          onClick={() => navigate('/citas/nueva')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                     hover:bg-blue-700 active:bg-blue-800 transition shadow-sm shadow-blue-600/20
                     w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cita
        </button>
      </div>

      {/* Card del calendario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
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
        <div className="text-center text-sm text-gray-500 mt-2">Cargando citas...</div>
      )}

      {/* Modal de edición */}
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

export default AppointmentsPage;