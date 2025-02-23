import React from "react";
import { Dropdown } from "semantic-ui-react";

const SelectInput = ({
  label,
  isMandatory,
  name,
  onChange,
  error,
  options,
  className,
  ...restProps
}) => {
  return (
    <div className="w-full md:max-w-[300px]">
      {label && (
        <label className="w-full flex flex-row items-center justify-start">
          {label} {isMandatory && <span className="text-[#DA2A29]">*</span>}
        </label>
      )}
      <Dropdown
        selection
        options={options}
        onChange={onChange}
        clearable
        placeholder="Select"
        className={`w-full !bg-white !border !border-gray-200 !rounded-lg hover:!border-gray-300 focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-200 !transition-shadow ${className || ''}`}
        {...restProps}
      />
      {error?.message?.length > 1 && (
        <span className="text-[#DA2A29] !w-full flex flex-row items-center justify-start text-[0.7rem]">
          {error?.message}
        </span>
      )}
    </div>
  );
};

export default SelectInput;
