import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown'
import Form from 'react-bootstrap/Form';
import FloatingLabel from "react-bootstrap/FloatingLabel";
import LoaderButton from "../components/LoaderButton";


export default function DisplayText({ text, editable }) {
  if (!editable) 
    return <ReactMarkdown children={text} />;

    
  const [value, setValue] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  function handleEdit() {
    setIsEditing(true);
  }

  function handleSave() {
    setIsEditing(false);
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div>
      {isEditing ? (
        <FloatingLabel label="Edit" className="mb-1">
          <Form.Control
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            placeholder="Edit"
            as="textarea" rows={3}
          />
        </FloatingLabel>
      ) : (
        <div onClick={handleEdit}>
          <ReactMarkdown children={value || "*(editable)*"} />
        </div>
      )}
      {
        isEditing &&    <LoaderButton block="true" size="sm" variant="primary" onClick={handleSave}>Save</LoaderButton>
      }
      
      
    </div>
  );
}
