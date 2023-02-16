import { Formik } from 'formik';
import LoaderButton from '../components/LoaderButton';
import Competency from '../components/Competency';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";
import { NumericFormat } from 'react-number-format';
import { Form, Input, FormikDebug, Radio, Select, Checkbox, Field } from 'formik-semantic-ui-react';
import FormHeader from "../components/FormHeader";
import { Grid, Header, Icon, Segment, Table, Button, Label, Loader, List } from 'semantic-ui-react';

export function GenericForm({formDef, formData, handleSubmit}) {
    function renderField(f, values, setFieldValue) {
      const size = "mini";
      const name = f.name;
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
          return <Input size={size} name={name} id={id} value={values[name]} />;
  
        case "date":
          let selected = null;
          try {
            selected = parseISO(values[name]);
          } catch (e) { 
            // incompatible data had been saved, just ignore it 
          }
          if (selected == "Invalid Date")
            selected = new Date();
          return <DatePicker size={size} name={name} id={id} selected={selected} dateFormat="dd-MMM-yy" onChange={date => setFieldValue(name, date.toISOString())}/>;
  
        case "email":
          return (
            <Input size={size} name={name} id={id} icon="at" fluid errorPrompt />
          );
  
        case "radio":
          return (
            <Button.Group size={size} >
              {f.options.map((o) => (
              <Button key={o} positive={o == values[name]} onClick={(e) => {
                e.preventDefault(); 
                if (o == values[name]) // if already selected, clear
                  setFieldValue(name, "");
                else
                  setFieldValue(name, o);
              }}>{o}</Button>
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
  
        case "competency":
          return <Competency name={name} />;// todo: this is not consistent with  Formik model (use values[] and setFieldValue)
  
        default:
          return <div>Unsupported Field</div>;
      }
    }
    const defaultValues = {
      ...formDef.sections.reduce((acc, section) => {
        return acc.concat(section.fields);
      }, []).reduce((acc, field) => {
          if (field.type == "checkbox") { // each checkbox is a quesiton!
            field.options.map((o) => {
              acc[field.name + o] = false;
            });
          } else if (field.type == "competency") {
            acc[field.name] = {
              required: "",
              competency: "",
              courseName: "",
              plannedFor: "",
              conductedOn: "",
              trainingProvider: "",
            };
          }
          else {
            acc[field.name] = "";
          }
          return acc;
        }, {})
    
      };
  
    
    return <Segment>
      <FormHeader heading={formDef.title} />
      <Formik initialValues={formData || defaultValues} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form size="small">
            {formDef.sections.map((s) => (
              <Segment basic vertical key={s.title} size="tiny">
                <Grid>
                  <Grid.Column width={14}>
                    <Table celled compact stackable>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell colSpan="5">
                            {s.title}
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {s.fields.map((f, i) => (
                          <Table.Row key={f.name}>
                            <Table.Cell width={4}>{f.title}</Table.Cell>
                            <Table.Cell width={8} textAlign="center">
                              {renderField(f, values, setFieldValue)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
  
                      </Table.Body>
                    </Table>
                  </Grid.Column>
                  <Grid.Column
                    width={2}
                    verticalAlign="middle"
                    textAlign="center"
                  >
                    Owner
                  </Grid.Column>
                </Grid>
              </Segment>
            ))}
            {handleSubmit && <LoaderButton
              type="submit"
              className="ms-auto hide-in-print">
              Submit
            </LoaderButton>}
            {/* <Button secondary>Back</Button> */}
            <FormikDebug />
          </Form>)}
      </Formik>
    </Segment>;
     
  
  }
  