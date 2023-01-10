import { useState } from "react";

export function useFormFields(initialState) {
  const [fields, setValues] = useState(initialState);
  return [
    fields,
    function (event) { // handles single field change
      setValues({
        ...fields,
        [event.target.id]: event.target.value,
      });
    },
    setValues
  ];
}
