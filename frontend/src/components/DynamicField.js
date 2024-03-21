import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { parseISO } from "date-fns";
import { Checkbox, Input, Select } from "formik-semantic-ui-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { NumericFormat } from "react-number-format";
import TextareaAutosize from "react-textarea-autosize";
import {
  Button,
  Icon,
  Popup,
} from "semantic-ui-react";
import Competency from "../components/Competency";
import UserPicker from "./UserPicker";

export function DynamicField({fieldDefinition, value, valueSetter, disabled, users}) {
    function renderField(f, value, setFieldValue, disabled) {
        return (
          <div className="dynamic-field">
            {renderFieldInput(f, value, setFieldValue, disabled)}
          </div>
        );
        // return (
        //   <>
        //     {renderFieldInput(f, values, setFieldValue)}
        //     <ErrorMessage
        //       name={f.name}
        //       component="div"
        //       className="ui red pointing above prompt label basic"
        //     />
        //   </>
        // );
      }
    
      function renderFieldInput(f, value, setFieldValue, disabled) {
        const size = "mini";
        const name = f.name;
        const id = `input-${f.name}`;
        switch (f.type) {
          case "info":
            return f.as === "content" ? (
              <div
                style={{ textAlign: "left" }}
                className="markdown"
                dangerouslySetInnerHTML={{ __html: f.title }}
              />
            ) : disabled ? null : (
              <div style={{ textAlign: "left" }}>
                <Popup
                  hoverable
                  flowing
                  trigger={<Icon name="question" color="blue" circular />}
                  position="bottom center"
                >
                  <div
                    style={{ textAlign: "left" }}
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: f.title }}
                  />
                </Popup>
              </div>
            );
          case "number":
            return (
              <NumericFormat
                displayType={disabled ? "text" : "input"}
                className={disabled ? "disabledNumericFormat" : ""}
                name={name}
                thousandSeparator={true}
                value={value}
                onValueChange={(v) => setFieldValue(name, v.floatValue)}
              />
            );
    
          case "employee":
            return (
              <UserPicker
                users={users}
                disabled={disabled}
                name={name}
                value={value}
                onChange={(userId) => setFieldValue(name, userId)}
              />
            );
    
          case "text":
            return disabled ? (
              f.basic ? (
                <div>
                  {typeof value === "object" ? JSON.stringify(value) : value}
                </div>
              ) : (
                <h4>
                  {typeof value === "object" ? JSON.stringify(value) : value}
                </h4>
              )
            ) : (
              <TextareaAutosize
                rows={1}
                size={size}
                name={name}
                id={id}
                value={value}
                onChange={(ev) =>  setFieldValue(name, ev.target.value)}
              />
            );
    
          case "link":
            return disabled ? (
              value ? (
                <a href={value}>Link</a>
              ) : (
                <span>(empty)</span>
              )
            ) : (
              <Input
                size={size}
                name={name}
                id={id}
                placeholder="Paste link here"
                value={value}
              />
            );
    
          case "wysiwyg":
            return disabled ? (
              <span
                className="disabledWysiwygFormat"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <CKEditor
                editor={ClassicEditor}
                data={value}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFieldValue(name, data);
                }}
              />
            );
    
          case "date":
            let selected = null;
            try {
              selected = parseISO(value);
            } catch (e) {
              // incompatible data had been saved, just ignore it
            }
            if (selected == "Invalid Date") selected = ""; // new Date();
            return disabled ? (
              <h3>{selected}</h3>
            ) : (
              <DatePicker
                placeholderText="Select"
                isClearable={!disabled}
                size={size}
                name={name}
                id={id}
                selected={selected}
                dateFormat="dd-MMM-yy"
                onChange={(date) =>
                  setFieldValue(name, date ? date.toISOString() : "")
                }
              />
            );
    

    
          case "multi":
          case "select":
            let newValues = value;
            if (!Array.isArray(newValues)) {
              // check to see newValues is actually an array as the type might have changed.
              newValues = [];
            }
    
            return (
              <div
                key={f.name}
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}
              >
                {f.options.map((o, i) => {
                  const selected = newValues.includes(o.value);
                  if (disabled) {
                    if (!selected) {
                      return null;
                    } else {
                      return <h3>{o.value}</h3>;
                    }
                  }
    
                  return (
                    <Button
                      key={i}
                      basic={f.type == "multi" || !selected}
                      disabled={disabled}
                      color={selected ? "blue" : ""}
                      size={size}
                      style={{ marginBottom: "2px" }}
                      onClick={(e) => {
                        e.preventDefault();
    
                        if (selected) {
                          newValues = newValues.filter((item) => item !== o.value);
                        } else {
                          if (!Array.isArray(newValues)) newValues = [];
    
                          if (f.type !== "multi") newValues = []; // for single value, empty the answers. For multi keep the existing ones and add the new one
    
                          newValues.push(o.value);
                        }
    
                        setFieldValue(name, newValues);
                      }}
                    >
                      {f.type == "multi" && (
                        <Icon name={selected ? "check" : ""} color="blue" />
                      )}
                      {o.value}
                    </Button>
                  );
                })}
              </div>
            );
    
          case "checkbox":
            return (
              <Button.Group>
                {f.options.map((o) => (
                  <Button disabled={disabled} basic color="teal" key={o.value}>
                    <Checkbox label={o.value} name={name + o.value} />
                  </Button>
                ))}
              </Button.Group>
            );
    
          case "dropdown":
            const options = f.options.map((o) => ({
              value: o.value,
              text: o.value,
            }));
            return disabled ? (
              <h3>{value}</h3>
            ) : (
              <Select
                compact
                placeholder="Select"
                clearable
                size={size}
                options={options}
                name={name}
                id={id}
              />
            );
    
          case "competency":
            return <Competency disabled={disabled} name={name} />; // todo: this is not consistent with  Formik model (use values[] and setFieldValue)
    
          default:
            return <div>Unsupported Field</div>;
        }
      }


    return renderField(fieldDefinition, value, valueSetter, disabled);
}


