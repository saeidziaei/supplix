import { Formik } from "formik";
import LoaderButton from "../components/LoaderButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import { NumericFormat } from "react-number-format";
import {
  Form,
  Input,
  FormikDebug,
  Radio,
  Select,
  Checkbox,
  Field,
} from "formik-semantic-ui-react";
import FormHeader from "../components/FormHeader";
import {
  Grid,
  Header,
  Icon,
  Segment,
  Table,
  Button,
  Label,
  Loader,
  List,
  Item,
} from "semantic-ui-react";
import ContentEditable from "react-contenteditable";
import { useState } from "react";

export function NGenericForm({ formDef, formData, handleSubmit }) {
  const [content, setContent] = useState({ html: "" });


  const handleChange = (e) => {
    console.log('changing', e);
    const {guid, title } = e.field;
    let note = "";
    if (e.field.type === 'multi') {
      if (e.newValues && e.newValues.length) {
        note = e.newValues.join(", ");
      }
    } else {
      note = e.newValue;
    }
    const line = note ? `<span><strong>${title}: </strong>${note}</span>` : "";
    const container = document.createElement("div");
    container.innerHTML = content.html;
    
    const element = container.querySelector(`div[data-guid='${guid}']`);
    if (element) {
      element.innerHTML = line;
    } else {
      const newElement = document.createElement("div");
      newElement.setAttribute("data-guid", guid);
      newElement.innerHTML = line;
      container.appendChild(newElement);
    }

    setContent({ html: container.innerHTML });    
  }

  function renderField(f, values, setFieldValue) {
    const size = "mini";
    const name = f.guid;
    const id = `input-${f.name}`;
    switch (f.type) {
      case "info":
        return (
          <Label as="a" color="teal" pointing="below">
            {f.description}
          </Label>
        );
      case "number":
        return (
          <NumericFormat
            name={name}
            thousandSeparator={true}
            value={values[name]}
            onValueChange={(v) => { setFieldValue(name, v.floatValue); handleChange({field: f, newValue: v.floatValue})  }}
            
          />
        );

      case "text":
        return <Input size={size} name={name} id={id} onChange={e => handleChange({field: f, newValue: e.target.value})} />;

      case "date":
        let selected = null;
        try {
          selected = parseISO(values[name]);
        } catch (e) {
          // incompatible data had been saved, just ignore it
        }
        // if (selected == "Invalid Date") selected = new Date();
        return (<div style={{ width: "200px" }}>
          <DatePicker
            
            name={name}
            id={id}
            selected={selected == "Invalid Date"? null : selected}
            dateFormat="dd-MMM-yy"
            onChange={(date) => { setFieldValue(name, date.toISOString()); handleChange({field: f, newValue: format(date, "eeee dd/MMM/yyyy")}) }}
          /></div>
        );

      case "multi":
        let newValues = values[name];
        if (!Array.isArray(newValues)) {// check to see newValues is actually an array as the type might have changed.
          newValues =[{freeText: ""}]; // just an empty freeText with no options selected
        }
        
        const freeText = newValues.filter(n => n.freeText != undefined)[0].freeText;
        const optionValues = newValues.filter(n => n.option != undefined);
        
        return (
          <div>
            {f.options.map((o) => {     
              
              const selected = optionValues.map(x => x.option).includes(o);
              return (
                <Button
                  key={o}
                  basic
                  
                  color={selected ? "green" : "grey"}
                  size={size}
                  style={{ marginBottom: "2px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    
                    if (selected) {
                      newValues = newValues.filter(item => item.option !== o);
                    }
                    else {
                      if (!Array.isArray(newValues))
                        newValues =[{freeText: ""}]; 
                      newValues.push({ option: o } );
                    }
                    setFieldValue(name, newValues);
                    handleChange({field: f, newValues: newValues.map(v => v.option || v.freeText)});
                  }}
                >
                  <Icon
                    name={selected ? "check" : ""}
                    color="green"
                  />
                  {o}
                </Button>
              );
            })}
            {

            <Input size={size}  value={freeText} name={`${name}-other`} style={{maxWidth: "200px"}}  placeholder="Other... specify"
              onChange={(evt, data) => {
                // all the selected options, add another freeText and abandon the existing one!
                optionValues.push({freeText: data.value});
                setFieldValue(name, optionValues);
                handleChange({field: f, newValues: optionValues.map(v => v.option || v.freeText)});
                
              }} />
            }
          </div>
        );

      case "radio":
        return (
          <Button.Group size={size}>
            {f.options.map((o) => (
              <Button
                key={o}
                primary={o == values[name]}
                onClick={(e) => {
                  e.preventDefault();
                  setFieldValue(name, o);
                  handleChange({field: f, newValue: o});
                }}
              >
                {o}
              </Button>
            ))}
          </Button.Group>
        );

      case "checkbox": // TODO handleChange
        return (
          <Button.Group>
            {f.options.map((o) => (
              <Button basic color="teal" key={o}>
                <Checkbox label={o} name={name + o} />
              </Button>
            ))}
          </Button.Group>
        );

      case "select":
        const options = f.options.map((o) => ({ value: o, text: o }));
        return <Select size={size} options={options} name={name} id={id} onChange={(event, data) => handleChange({field: f, newValue: data.value})} />;

      default:
        return <div>Unsupported Field</div>;
    }
  }
  const defaultValues = {
    ...formDef.sections
      .reduce((acc, section) => {
        return acc.concat(section.fields);
      }, [])
      .reduce((acc, field) => {
        if (field.type == "checkbox") {
          // each checkbox is a quesiton!
          field.options.map((o) => {
            acc[field.guid + o] = false;
          });
        } else if (field.type == "multi") { 
          acc[field.guid] = [{freeText: ""}];
        }
        else {
          acc[field.guid] = "";
        }
        return acc;
      }, {}),
  };

  return (
    <Segment>
      <FormHeader heading={formDef.title} />
      <Formik
        initialValues={formData || defaultValues}
        onSubmit={handleSubmit}
        onChange={(e) => console.log(e)}
      >
        {({ isSubmitting, values, setFieldValue, handleChange }) => (
          <Form size="small">
            {formDef.sections.map((s) => (
              <Item.Group key={s.title}>
                <Item.Header>{s.title}</Item.Header>
                {s.fields.map((f, i) => (
                  <Item key={f.guid}>
                    <Label pointing="right" color="teal">
                      {f.title}
                    </Label>
                    {renderField(f, values, setFieldValue)}
                  </Item>
                ))}
              </Item.Group>
            ))}
            {handleSubmit && (
              <LoaderButton type="submit" className="ms-auto hide-in-print">
                Submit
              </LoaderButton>
            )}
            
            <ContentEditable
              html={content.html} // innerHTML of the editable div
              disabled={false} // use true to disable edition
              onChange={(evt) => setContent({ html: evt.target.value })} // handle innerHTML change
            />
            <FormikDebug />
          </Form>
        )}
      </Formik>
    </Segment>
  );
}
