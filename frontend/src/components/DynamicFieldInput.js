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

export function DynamicFieldInput({fieldDefinition, value, valueSetter, disabled, users, error, hideLabel=false}) {
    function renderField(f, value, setFieldValue, disabled) {
        return (
          <div className="w-full my-2">
            <label className="w-full  flex flex-row items-center justify-start ">
              {!hideLabel && (
                <>
                  <div
                    className={`font-medium text-gray-700 ${
                      disabled ? "opacity-75" : "opacity-100"
                    }`}
                  >
                    {f.name}
                  </div>
                  {f.miniLabel && (
                    <span className="text-[#000]/40 text-[0.9rem] ml-2">
                      {f.miniLabel}
                    </span>
                  )}
                </>
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

        const disabledClass = disabled ? "bg-gray-50 text-gray-700 cursor-not-allowed border-gray-200" : "bg-white";

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
                className={`w-full md:max-w-[300px] p-2 rounded-lg border ${disabledClass} transition-colors`}
                name={name}
                thousandSeparator={true}
                value={value}
                disabled={disabled}
                onValueChange={(v) => !disabled && setFieldValue(name, v.floatValue)}
              />
            );
    
          case "employee":
            return (
              <>
              <UserPicker
                users={users}
                disabled={disabled}
                name={name}
                value={value}
                onChange={(userId) => setFieldValue(name, userId)}
                compact={f.compact}
              />
              {f.isEmployeeRecord && <div className="font-thin text-sm italic">This record will be shown in this employee's records</div>
}
              </>
            );
    
          case "text":
            return (
              <TextareaAutosize
                className={`w-full md:max-w-[350px] p-2 rounded-lg border ${disabledClass} transition-colors`}
                rows={1}
                size={size}
                name={name}
                id={id}
                value={value || ""}
                disabled={disabled}
                onChange={(ev) => !disabled && setFieldValue(name, ev.target.value)}
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
              <div
                className="w-full  p-2 rounded-lg border bg-white text-gray-700"
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
              <div className="w-full md:max-w-[300px] p-2 rounded-lg border bg-white text-gray-700">{selected ? format(selected, "dd MMM yyyy") : ""}</div>
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
            let newValues = Array.isArray(value) ? value : [];

            return (
              <div className="flex flex-wrap gap-2">
                {f.options.map((o, i) => {
                  const selected = newValues.includes(o.value);
                  
                  return (
                    <Button
                      key={i}
                      basic={!selected}
                      color={selected ? "blue" : "gray"} 
                      size={size}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full
                        ${disabled ? 'opacity-85' : 'hover:shadow-sm'}
                        ${selected ? 'bg-blue-50' : ''}
                      `}
                      onClick={(e) => {
                        if (disabled) return;
                        e.preventDefault();

                        let updatedValues;
                        if (selected) {
                          updatedValues = newValues.filter(item => item !== o.value);
                        } else {
                          updatedValues = f.type === "multi" 
                            ? [...newValues, o.value]  // Multi-select: add to existing
                            : [o.value];               // Single-select: replace existing
                        }
                        setFieldValue(name, updatedValues);
                      }}
                    >
                      {selected && <Icon name="check" size="small" />}
                      <span className={selected ? 'font-medium' : ''}>
                        {o.value}
                      </span>
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
            
            return disabled ? (
              <div className="w-full md:max-w-[300px] p-2 rounded-lg border bg-white text-gray-700">{value}</div>
            ) : (
              <SelectInput
                compact
                placeholder="Select"
                clearable={!disabled}
                size={size}
                options={options}
                name={name}
                id={id}
                value={value}
                disabled={disabled}
                onChange={(_, data) => !disabled && setFieldValue(name, data.value)}
                className={disabledClass}
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


