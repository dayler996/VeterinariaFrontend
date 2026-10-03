import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import ImageUploader from '../common/ImageUploader';

// Formato de teléfono venezolano: 04246324325 -> 0424-6324325 (un solo guion)
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0,4)}-${digits.slice(4,11)}`;
};

const unformat = (value) => value.replace(/\D/g, '');

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cedula: z.string()
    .min(1, 'Cédula requerida')
    .regex(/^\d+$/, 'Solo números')
    .max(10, 'Máximo 10 dígitos'), // ← límite de 10 dígitos
  telefono: z.string()
    .min(1, 'Teléfono requerido')
    .regex(/^\d+$/, 'Solo números'),
  sexo: z.enum(['M', 'F'], { required_error: 'Sexo requerido' }),
  direccion: z.string().optional(),
  foto: z.string().nullable().optional(),
});

const ClienteForm = ({ initialData, onSave, onCancel }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  const foto = watch('foto');

  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [cedulaDisplay, setCedulaDisplay] = useState('');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setPhoneDisplay(formatPhone(initialData.telefono || ''));
      setCedulaDisplay(initialData.cedula || '');
    }
  }, [initialData, reset]);

  const handlePhoneChange = (e) => {
    const raw = unformat(e.target.value);
    setValue('telefono', raw, { shouldValidate: true });
    setPhoneDisplay(formatPhone(raw));
  };

  const handleCedulaChange = (e) => {
    const raw = unformat(e.target.value);
    // Opcional: limitar a 10 dígitos visualmente
    if (raw.length <= 10) {
      setValue('cedula', raw, { shouldValidate: true });
      setCedulaDisplay(raw);
    }
  };

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input {...register('nombre')} className="mt-1 block w-full border rounded p-2" />
        {errors.nombre && <p className="text-red-600 text-sm">{errors.nombre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Cédula</label>
        <input
          type="text"
          value={cedulaDisplay}
          onChange={handleCedulaChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder=""
        />
        <input type="hidden" {...register('cedula')} />
        {errors.cedula && <p className="text-red-600 text-sm">{errors.cedula.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Teléfono</label>
        <input
          type="text"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="1234-1234556"
        />
        <input type="hidden" {...register('telefono')} />
        {errors.telefono && <p className="text-red-600 text-sm">{errors.telefono.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Sexo</label>
        <select {...register('sexo')} className="mt-1 block w-full border rounded p-2">
          <option value="">Seleccione</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        {errors.sexo && <p className="text-red-600 text-sm">{errors.sexo.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Dirección</label>
        <textarea {...register('direccion')} rows="2" className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <ImageUploader
          value={foto}
          onChange={(url) => setValue('foto', url)}
          folder="cliente"
          label="Foto del cliente"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded order-2 sm:order-1">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded order-1 sm:order-2">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default ClienteForm;