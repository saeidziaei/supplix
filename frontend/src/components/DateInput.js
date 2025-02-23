import React from "react";
import DatePicker from "react-datepicker";

const DateInput = ({
  label,
  isMandatory,
  name,
  value,
  onChange,
  error,
  ...restProps
}) => {
  return (
    <div className="w-full md:max-w-[300px] ">
      <label className="w-full  flex flex-row items-center justify-start">
        {label} {isMandatory && <span className="text-[#DA2A29]">*</span>}
      </label>
      <DatePicker
        placeholderText="Select"
        isClearable="true"
        name="startDate"
        dateFormat="dd-MMM-yy"
        selected={value}
        onChange={onChange}
        className="w-full p-2 rounded-lg border bg-white text-gray-700 hover:!shadow-lg transition duration-300"
      />
      {error?.message?.length > 1 && (
        <span className="text-[#DA2A29]   !w-full  flex flex-row items-center justify-start text-[0.7rem]">
          {error?.message}
        </span>
      )}
    </div>
  );
};

export default DateInput;