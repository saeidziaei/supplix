import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { parseISO, format } from "date-fns";
import { Checkbox, Input } from "formik-semantic-ui-react";
import DateInput from "./DateInput";
import SelectInput from "./SelectInput";
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

export function DynamicFieldInput({fieldDefinition, value, valueSetter, disabled, users, error}) {
    function renderField(f, value, setFieldValue, disabled) {
        return (
<div className="w-full my-2">
      <label className="w-full  flex flex-row items-center justify-start ">
        <div className={disabled && "border-b border-dotted border-gray-400"}>{f.name}</div>
        {f.miniLabel && (
          <span className="text-[#000]/40 text-[0.9rem] ml-2">{f.miniLabel}</span>
        )}
        {f.isMandatory && <span className="text-[#DA2A29]">*</span>}
        
      </label>
      {renderFieldInput(f, value, setFieldValue, disabled)}
      
        
      
      {error?.message?.length > 1 && (
        <span className="text-[#DA2A29] !w-full  flex flex-row items-center justify-start text-[0.7rem]">
          {error?.message}
        </span>
      )}
    </div>


          
        );

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
              placeholder="(number)"
                displayType={disabled ? "text" : "input"}
                className={disabled ? "font-bold text-lg" : "w-full md:max-w-[300px] p-1 !rounded-xl !mt-1 *:!bg-[#E9EFF6] !bg-[#E9EFF6] *:!border-none *:!rounded-2xl hover:!shadow-lg transition duration-300"}
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
                compact={f.compact}
              />
            );
    
          case "text":
            return disabled ? (
              <div className="font-bold text-lg">
                {typeof value === "object" ? JSON.stringify(value) : value}
              </div>
            ) : (
              <TextareaAutosize
                className="w-full p-1 !rounded-xl !mt-1 *:!bg-[#E9EFF6] !bg-[#E9EFF6] *:!border-none *:!rounded-2xl hover:!shadow-lg transition duration-300"
                rows={1}
                size={size}
                name={name}
                id={id}
                value={value}
                onChange={(ev) => setFieldValue(name, ev.target.value)}
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
            if (selected == "Invalid Date") selected = ""; 
            return disabled ? (
              <div className="font-bold text-lg">{selected ? format(selected, "dd-MM-yyyy") : ""}</div>
            ) : (
              <DateInput
                placeholderText="Select"
                isClearable={!disabled}
                size={size}
                name={name}
                id={id}
                value={selected}
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
                      return <div className="font-bold text-lg mr-5">{o.value}</div>;
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
            const options = f.options ? f.options.map((o) => ({
              value: o.value,
              text: o.text || o.value,
            })) : [];
            const displayText = options.find((o) => o.value === value)?.text || value;

            return disabled ? (
              <div className="font-bold text-lg">{displayText}</div>
            ) : (
              <SelectInput
                compact
                placeholder="Select"
                clearable
                size={size}
                options={options}
                name={name}
                id={id}
                onChange={(_, data) => setFieldValue(name, data.value)}
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


