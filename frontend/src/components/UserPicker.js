import React from "react";
import { Dropdown } from "semantic-ui-react";
import User from "./User";
import { getUserById } from "../lib/helpers";

export default function UserPicker({ users, value, onChange, disabled = false, upward = false, compact = false }) {

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
    <Dropdown
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
    />
  );
}
