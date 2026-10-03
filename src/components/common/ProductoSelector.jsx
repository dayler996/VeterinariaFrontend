import { useState, useRef, useEffect } from 'react';

const ProductoSelector = ({ productos, onSelect, value, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(productos);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search) {
      setFiltered(productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())));
    } else {
      setFiltered(productos);
    }
  }, [search, productos]);

  const handleSelect = (producto) => {
    setSelectedProducto(producto);
    setSearch(producto.nombre);
    onSelect(producto);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (selectedProducto && e.target.value !== selectedProducto.nombre) {
      setSelectedProducto(null);
      onSelect(null);
    }
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder || "Buscar producto..."}
        className="w-full border rounded p-2 text-sm"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-auto shadow-lg">
          {filtered.map(p => (
            <li
              key={p.id}
              onClick={() => handleSelect(p)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
            >
              {p.nombre} - ${p.precioVenta}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filtered.length === 0 && (
        <div className="absolute z-10 w-full bg-white border rounded mt-1 p-2 text-sm text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  );
};

export default ProductoSelector;