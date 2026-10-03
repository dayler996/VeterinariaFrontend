import { useState, useEffect } from 'react';

const JsonBuilder = ({ value = {}, onChange, label }) => {
  const [pairs, setPairs] = useState(() => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).map(([key, val]) => ({
        key,
        value: typeof val === 'string' ? val : JSON.stringify(val)
      }));
    }
    return [{ key: '', value: '' }];
  });

  useEffect(() => {
    const obj = pairs.reduce((acc, { key, value }) => {
      if (key.trim() !== '') {
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
        acc[key] = parsedValue;
      }
      return acc;
    }, {});
    onChange(obj);
  }, [pairs, onChange]);

  const handleAddRow = () => {
    setPairs([...pairs, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter((_, i) => i !== index));
    } else {
      setPairs([{ key: '', value: '' }]);
    }
  };

  const handleChange = (index, field, val) => {
    const newPairs = [...pairs];
    newPairs[index][field] = val;
    setPairs(newPairs);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider grid grid-cols-12 gap-2">
          <div className="col-span-5">Clave</div>
          <div className="col-span-6">Valor</div>
          <div className="col-span-1 text-right">Acción</div>
        </div>
        <div className="divide-y">
          {pairs.map((pair, index) => (
            <div key={index} className="px-3 py-2 grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={pair.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                placeholder="clave"
                className="col-span-5 px-2 py-1 border rounded text-sm"
              />
              <input
                type="text"
                value={pair.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                placeholder="valor"
                className="col-span-6 px-2 py-1 border rounded text-sm"
              />
              <button
                type="button"
                onClick={() => handleRemoveRow(index)}
                className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddRow}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <span>+</span> Agregar campo
      </button>
    </div>
  );
};

export default JsonBuilder;