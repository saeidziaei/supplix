import React from "react";
import { Input } from "semantic-ui-react";

const TextInput = ({
  label,
  isMandatory,
  name,
  value,
  onChange,
  miniLabel,
  error,
  ...restProps
}) => {
  return (
    <div className="w-full ">
      <label className="w-full  flex flex-row items-center justify-start">
        {label}
        {miniLabel && (
          <span className="text-[#000]/40 text-[0.9rem] ml-2">{miniLabel}</span>
        )}
        {isMandatory && <span className="text-[#DA2A29]">*</span>}
        
      </label>
      <Input
        focus
        placeholder={""}
        name={name}
        className="w-full p-1 !rounded-xl !mt-1 *:!bg-[#E9EFF6] !bg-[#E9EFF6] *:!border-none *:!rounded-2xl hover:!shadow-lg transition duration-300"
        value={value}
        onChange={onChange}
      />
        
      
      {error?.message?.length > 1 && (
        <span className="text-[#DA2A29] !w-full  flex flex-row items-center justify-start text-[0.7rem]">
          {error?.message}
        </span>
      )}
    </div>
  );
};

export default TextInput;
