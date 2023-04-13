import React from "react";
import { Dropdown } from "semantic-ui-react";
import User from "./User";

export default function UserPicker({ users, value, onChange, disabled = false }) {

  const options = users.map((u) => {
    return {
      key: u.Username,
      value: u.Username,
      content: (<User user={u}/>)
    };
  });

  return (
    <Dropdown
      disabled={disabled}
      selection
      fluid
      value={value}
      options={options}
      onChange={(e, {value}) => onChange(value)}
      placeholder="Choose a user to add to the team"
    />
  );
}
