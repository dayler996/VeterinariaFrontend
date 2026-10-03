import React from 'react';
import Select from 'react-select';
import { useController } from 'react-hook-form';

const SearchSelect = ({ control, name, options, label, placeholder, isLoading, isDisabled, onChange: externalOnChange, ...props }) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error }
  } = useController({
    name,
    control,
    rules: { required: props.required },
    defaultValue: props.defaultValue
  });

  const handleChange = (selected) => {
    onChange(selected ? selected.value : null);
    if (externalOnChange) externalOnChange(selected);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Select
        ref={ref}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder || 'Seleccione...'}
        isClearable
        isSearchable
        isLoading={isLoading}
        isDisabled={isDisabled}
        className="react-select-container"
        classNamePrefix="react-select"
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default SearchSelect;