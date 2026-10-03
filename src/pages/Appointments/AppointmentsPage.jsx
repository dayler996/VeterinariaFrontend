import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { getCitas, updateCita, deleteCita } from '../../services/citaService'; // ← Agregado deleteCita
import { getTrabajadores } from '../../services/trabajadorService';
import { getMascotas } from '../../services/mascotaService';
import { getEstadosCita } from '../../services/estadoCitaService';
import { Modal } from '../../components/common/Modal';
import CitaForm from '../../components/forms/CitaForm';
import toast from 'react-hot-toast';

// Importar arrays con nombres en español
import { daysOfWeek, daysOfWeekAbbr, monthsOfYear } from '../../utils/calendarSpanish';

// Configurar moment (por si acaso, aunque no lo usaremos para nombres)
import 'moment/locale/es';
moment.locale('es');

const localizer = momentLocalizer(moment);

// Traducciones para los textos del calendario
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
  showMore: total => `+ Ver más (${total})`
};

// Formatos personalizados usando nuestros arrays
const formats = {
  // Día completo (ej: "Lunes")
  weekdayFormat: (date) => {
    const day = date.getDay();
    return daysOfWeek[day];
  },
  // Abreviatura (ej: "Lun")
  dayFormat: (date) => {
    const day = date.getDay();
    return daysOfWeekAbbr[day];
  },
  // Encabezado del mes (ej: "Febrero 2026")
  monthHeaderFormat: (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return `${monthsOfYear[month]} ${year}`;
  },
  // Encabezado del día (ej: "Lunes, 16 Febrero")
  dayHeaderFormat: (date) => {
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = monthsOfYear[date.getMonth()];
    return `${dayOfWeek}, ${dayOfMonth} ${month}`;
  },
  // Rango de fechas (ej: "16 Febrero - 22 Febrero")
  dayRangeHeaderFormat: ({ start, end }) => {
    const startDay = start.getDate();
    const startMonth = monthsOfYear[start.getMonth()];
    const endDay = end.getDate();
    const endMonth = monthsOfYear[end.getMonth()];
    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  },
};

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    loadCitas();
    loadDoctores();
    loadMascotas();
    loadEstados();
  }, []);

  const loadCitas = async () => {
    try {
      const res = await getCitas();
      const mapped = res.data.map(cita => ({
        id: cita.id,
        title: `${cita.mascota.nombre} - Dr. ${cita.doctor.nombre}`,
        start: new Date(cita.fechaHora),
        end: new Date(new Date(cita.fechaHora).getTime() + 30 * 60000),
        resource: cita
      }));
      setEvents(mapped);
    } catch (error) {
      toast.error('Error al cargar citas');
    }
  };

  const loadDoctores = async () => {
    try {
      const res = await getTrabajadores(); // sin parámetro
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

  // Nueva función para eliminar
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

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Agenda de Citas</h1>
        <button
          onClick={() => navigate('/citas/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Nueva Cita
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
        messages={messages}
        formats={formats}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Editar Cita"
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