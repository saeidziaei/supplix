import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { parseISO } from "date-fns";
import { Formik } from "formik";
import {
  Checkbox,
  Form,
  Input,
  Select
} from "formik-semantic-ui-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { NumericFormat } from "react-number-format";
import {
  Button,
  Grid,
  Header, Segment,
  Table
} from "semantic-ui-react";
import Competency from "../components/Competency";
import FormHeader from "../components/FormHeader";

export function GenericForm({ formDef, formData, handleSubmit, disabled, handleCancel }) {
  function renderField(f, values, setFieldValue) {
    const size = "mini";
    const name = f.name;
    const id = `input-${f.name}`;
    switch (f.type) {
      case "info":
        return (
          <Header as="h4" color="grey">
            {f.title}
          </Header>
        );
      case "number":
        return (
          <NumericFormat
            disabled={disabled}
            name={name}
            thousandSeparator={true}
            value={values[name]}
            onValueChange={(v) => setFieldValue(name, v.floatValue)}
          />
        );

      case "text":
        return <Input disabled={disabled} size={size} name={name} id={id} value={values[name]} />;

      case "wysiwyg":
        return (
          <CKEditor
            disabled={disabled}
            editor={ClassicEditor}
            data={values[name]}
            onChange={(event, editor) => {
              const data = editor.getData();
              setFieldValue(name, data);
            }}
          />
        );

      case "date":
        let selected = null;
        try {
          selected = parseISO(values[name]);
        } catch (e) {
          // incompatible data had been saved, just ignore it
        }
        if (selected == "Invalid Date") selected = ""; // new Date();
        return (
          <DatePicker
          disabled={disabled}
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

      case "email":
        return (
          <Input disabled={disabled} size={size} name={name} id={id} icon="at" fluid errorPrompt />
        );

      case "select":
      case "weightedSelect":
        return (
          <Button.Group size={size}>
            {f.options.map((o, optionIndex) => (
              <Button
              disabled={disabled}
                key={optionIndex}
                positive={o.value == values[name]}
                onClick={(e) => {
                  e.preventDefault();
                  if (o.value == values[name])
                    // if already selected, clear
                    setFieldValue(name, "");
                  else setFieldValue(name, o.value);
                }}
              >
                {o.value}
              </Button>
            ))}
          </Button.Group>
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
      case "weightedDropdown":
        const options = f.options.map((o) => ({
          value: o.value,
          text: o.value,
        }));
        return (
          <Select
          disabled={disabled}
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
  const tabularFieldName = (rowIndex, name) => `row${rowIndex}-${name}`;

  const defaultValues = {
    ...formDef.sections
      .reduce((acc, section) => {
        return acc.concat(
          section.isTable // explode the fields. Repeat the fields for every row
            ? section.rows.map((_, rowIndex) =>
                section.fields.map((f) => ({
                  ...f,
                  name: tabularFieldName(rowIndex, f.name),
                }))
              )
            : section.fields
        );
      }, [])
      .reduce((acc, field) => {
        if (field.type == "checkbox") {
          // each checkbox is a quesiton!
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
        } else {
          acc[field.name] = "";
        }
        return acc;
      }, {}),
  };

  return (
    <Segment>
      <FormHeader heading={formDef.title} />
      <Formik initialValues={formData || defaultValues} onSubmit={handleSubmit} >
        {({ isSubmitting, values, setFieldValue, resetForm }) => (
          <Form size="small">
            {formDef.sections.map((s) =>
              s.isTable
                ? renderSectionTabular(s, values, setFieldValue)
                : renderSection(s, values, setFieldValue)
            )}
            {!disabled && handleSubmit && (
              <>
                <Button
                  positive
                  type="submit"
                  className="ms-auto hide-in-print"
                >
                  Submit
                </Button>
                <Button onClick={(e) => {e.preventDefault(); resetForm(); handleCancel();}}>Cancel</Button>
              </>
            )}
            {/* <Button secondary>Back</Button> */}
          </Form>
        )}
      </Formik>
    </Segment>
  );

  function renderSectionTabular(s, values, setFieldValue) {
    const fields = s.fields.filter((f) => f.type !== "aggregate");
    return (
      <Segment basic vertical key={s.title} size="tiny">
        <Table celled compact stackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan="5">{s.title}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Items</Table.HeaderCell>
              {fields.map((f, i) => (
                <Table.HeaderCell key={i}>{f.name}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {s.rows.map((row, rowIndex) => (
              <Table.Row key={rowIndex}>
                <Table.Cell>{row.value}</Table.Cell>
                {fields.map((f, i) => (
                  <Table.Cell key={i}>
                    {" "}
                    {renderField(
                      { ...f, name: tabularFieldName(rowIndex, f.name) },
                      values,
                      setFieldValue
                    )}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Segment>
    );
  }
  function renderSection(s, values, setFieldValue) {
    return (
      <Segment basic vertical key={s.title} size="tiny">
        <Grid>
          <Grid.Column width={14}>
            <Table celled compact stackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell colSpan="5">{s.title}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {s.fields
                  .filter((f) => f.type !== "aggregate")
                  .map((f, i) => (
                    <Table.Row key={f.guid}>
                      <Table.Cell width={4}>
                        {f.type === "info" ? "" : f.title}
                      </Table.Cell>
                      <Table.Cell width={8} textAlign="center">
                        {renderField(f, values, setFieldValue)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table>
          </Grid.Column>
          <Grid.Column width={2} verticalAlign="middle" textAlign="center">
            Owner
          </Grid.Column>
        </Grid>
      </Segment>
    );
  }
}
