import { Formik } from "formik";
import LoaderButton from "../components/LoaderButton";
import Competency from "../components/Competency";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";
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

export function NGenericForm({ formDef, formData, handleSubmit }) {
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
            onValueChange={(v) => setFieldValue(name, v.floatValue)}
          />
        );

      case "text":
        return <Input size={size} name={name} id={id} />;

      case "date":
        let selected = null;
        try {
          selected = parseISO(values[name]);
        } catch (e) {
          // incompatible data had been saved, just ignore it
        }
        if (selected == "Invalid Date") selected = new Date();
        return (
          <DatePicker
            size={size}
            name={name}
            id={id}
            selected={selected}
            dateFormat="dd-MMM-yy"
            onChange={(date) => setFieldValue(name, date.toISOString())}
          />
        );

      case "multi":
        return (
          <div>
            {f.options.map((o) => {     
              let newValues = values[name];
              const selected = Array.isArray(newValues) && newValues.includes(o);// check to see newValues is actually an array as the type might have changed.
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
                      newValues = newValues.filter(item => item !== o);
                    }
                    else {
                      if (!Array.isArray(newValues))
                        newValues =[];
                      newValues.push(o);
                    }
                    setFieldValue(name, newValues);
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
                }}
              >
                {o}
              </Button>
            ))}
          </Button.Group>
        );

      case "checkbox":
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
        return <Select size={size} options={options} name={name} id={id} />;

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
          acc[field.guid] = [];
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
      <Formik initialValues={formData || defaultValues} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form size="small">
            {formDef.sections.map((s) => (
              <Item.Group key={s.title}>
                <Item.Header>{s.title}</Item.Header>
                {s.fields.map((f, i) => (
                  <Item key={f.guid}><Label pointing="right" color="teal">{f.title}</Label> {renderField(f, values, setFieldValue)}</Item>
                  ))}
                <Item></Item>
              </Item.Group>
             
            ))}
            {handleSubmit && (
              <LoaderButton type="submit" className="ms-auto hide-in-print">
                Submit
              </LoaderButton>
            )}
            {/* <Button secondary>Back</Button> */}
            <FormikDebug />
          </Form>
        )}
      </Formik>
    </Segment>
  );
}
