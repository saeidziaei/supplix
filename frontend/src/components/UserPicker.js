import React from "react";
import { Select } from "semantic-ui-react";
import User from "./User";
import { getUserById } from "../lib/helpers";

export default function UserPicker({ label="", users, value, onChange, disabled = false, upward = false, compact = false, isMandatory = false }) {

  if (!users) return <p>No users available</p>;
  
  const options = users.map((u) => {
    return {
      key: u.Username,
      value: u.Username,
      content: (<User user={u}/>),
      text: u.Username,
    };
  });
  const handleChange = (e, {value}) => {
    onChange(value);
  } 
  const selected = value ? getUserById(users, value) :  null;

  return disabled ? (
    selected && <User user={selected} compact={compact} />
  ) : (
    <div className='w-full md:max-w-[300px]'>
            <label className='w-full  flex flex-row items-center justify-start'>
                {label} {isMandatory && <span className='text-[#DA2A29]'>*</span>}
            </label>
    <Select
      upward={upward}
      clearable
      value={value}
      trigger={
        selected ? (
          <User user={selected} compact={compact} />
        ) : (
          <span>Select User</span>
        )
      }
      options={options}
      onChange={handleChange}
      className='w-full p-1 !rounded-xl !mt-1 *:!bg-[#E9EFF6] !bg-[#E9EFF6] !border-none  *:!border-none *:!rounded-2xl *:!outline-none hover:!shadow-lg transition duration-300'
    /></div>
  );
}
