import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { parseISO } from "date-fns";
import { Field, FieldArray, Formik } from "formik";
import { Checkbox, Form, Input, Select } from "formik-semantic-ui-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { NumericFormat } from "react-number-format";
import TextareaAutosize from 'react-textarea-autosize';
import {
  Button,
  Divider,
  Grid,
  Icon,
  Image,
  Menu,
  Popup,
  Segment,
  Table
} from "semantic-ui-react";
import Competency from "../components/Competency";
import FormHeader from "../components/FormHeader";
import placeholderImage from '../fileplaceholder.jpg';
import "./GenericForm.css";
import SignatureCanvas from "react-signature-canvas";
import { useEffect, useRef } from "react";
import { useAppContext } from "../lib/contextLib";
import UserPicker from "./UserPicker";


export function GenericForm({
  formDef,
  formData,
  handleSubmit,
  disabled,
  handleCancel,
  users
}) {
  const SIGNATURE_FIELD_NAME = "form-signature";

  const sigPadRef = useRef(null);
  const { tenant } = useAppContext();


  useEffect(() => {
    if (sigPadRef.current && formData) {
      sigPadRef.current.fromDataURL(formData[SIGNATURE_FIELD_NAME]);
    }
  }, [formData, disabled]);



  function renderField(f, values, setFieldValue) {
    return renderFieldInput(f, values, setFieldValue);
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

  function renderFieldInput(f, values, setFieldValue) {
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
        ) : (
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
            disabled={disabled}
            name={name}
            thousandSeparator={true}
            value={values[name]}
            onValueChange={(v) => setFieldValue(name, v.floatValue)}
          />
        );

      case "employee":
        return (
          <UserPicker 
            users={users}
            disabled={disabled}
            name={name}
            value={values[name]}
            onChange={(userId) => setFieldValue(name, userId)}
          />
        );

      case "text":
        return (
          <TextareaAutosize
            disabled={disabled}
            rows={1}
            size={size}
            name={name}
            id={id}
            value={values[name]}
            onChange={(ev) => setFieldValue(name, ev.target.value)}
          />
        );

      case "link":
        return disabled ? (
          values[name] ? (
            <a href={values[name]}>Link</a>
          ) : (
            <span>(empty)</span>
          )
        ) : (
          <Input
            size={size}
            name={name}
            id={id}
            placeholder="Paste link here"
            value={values[name]}
          />
        );

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
          <Input
            disabled={disabled}
            size={size}
            name={name}
            id={id}
            icon="at"
            fluid
            errorPrompt
          />
        );

      case "multi":
      case "select":
        let newValues = values[name];
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
        return (
          <Select
            disabled={disabled}
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
  const tabularFieldName = (rowIndex, name) => `row${rowIndex}-${name}`;

  let defaultValues = {
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
      }, {
        attachments: []
      }),
  };

  defaultValues[SIGNATURE_FIELD_NAME] = "";

  // const generateValidationSchema = (formDef) => {
  //   const schema = {};

  //   // Iterate through each section in the form definition
  //   formDef.sections.forEach((section) => {
  //     // Iterate through each field in the section
  //     section.fields.forEach((field) => {
  //       schema[field.name] = Yup.string().required(
  //         `${field.name} is required`
  //       );
  //     });
  //   });

  //   return Yup.object().shape(schema);

  // }
  // const validationSchema = generateValidationSchema(formDef);

  const preSubmit = (values, formikBag) => {
    const updatedValues = { ...values };
    if (sigPadRef.current) {
      updatedValues[SIGNATURE_FIELD_NAME] = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");
    }
    
    handleSubmit(updatedValues, formikBag);
  }
  
  
  return (
    <Segment style={{ overflowX: "auto" }}>
      <FormHeader heading={formDef.title} subheading={formDef.category} image={tenant?.logoURL || "/iso_cloud_logo_v1.png"} />
      <Formik initialValues={formData || defaultValues} onSubmit={preSubmit}>
        {({ isSubmitting, values, setFieldValue, resetForm }) => {
          // setSignature(values[SIGNATURE_FIELD_NAME]);
          
          return (
          <Form size="small">
            {formDef.sections.map((s) =>
              s.isTable
                ? renderSectionTabular(s, values, setFieldValue)
                : renderSection(s, values, setFieldValue)
            )}

            <div>
              <Icon name="attach" />
              Attachments
            </div>
            <FieldArray name="attachments">
              {({ insert, remove, push }) => (
                <Grid>
                  {values.attachments &&
                    values.attachments.length > 0 &&
                    values.attachments.map((attachment, index) => (
                      <Grid.Row key={index} verticalAlign="middle">
                        <Grid.Column width={1}>
                          <Button
                            circular
                            size="mini"
                            icon="x"
                            basic
                            disabled={disabled}
                            onClick={() => remove(index)}
                          />
                        </Grid.Column>
                        <Grid.Column width={5}>
                          {!disabled && !attachment.fileURL && (
                            <input
                              id="file"
                              name={`attachments.${index}.file`}
                              type="file"
                              onChange={(event) => {
                                setFieldValue(
                                  `attachments.${index}.file`,
                                  event.currentTarget.files[0]
                                );
                              }}
                            />
                          )}
                          {attachment.fileURL && (
                            <a href={attachment.fileURL} target="_blank">
                              <Image
                                src={attachment.fileURL}
                                wrapped
                                alt={attachment.fileName}
                                onError={(e) => {
                                  e.target.src = placeholderImage;
                                }}
                              />
                            </a>
                          )}
                        </Grid.Column>
                        <Grid.Column width={10}>
                          {disabled ? (
                            <span>{attachment.fileNote}</span>
                          ) : (
                            <Field
                              name={`attachments.${index}.fileNote`}
                              placeholder="File Note"
                              type="text"
                            />
                          )}
                        </Grid.Column>
                      </Grid.Row>
                    ))}
                  <Grid.Row>
                    <Grid.Column>
                      <Button
                        type="button"
                        basic
                        disabled={
                          disabled ||
                          (values.attachments && values.attachments.length > 5)
                        }
                        circular
                        icon="plus"
                        size="mini"
                        onClick={() => push({ file: "", fileNote: "" })}
                      />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              )}
            </FieldArray>

            <Divider hidden />
            {formDef.hasSignature && renderSignature(values[SIGNATURE_FIELD_NAME])}
            {!disabled && handleSubmit && (
              <div>
                <Button primary type="submit" size="mini" floated="right">
                  Submit
                </Button>
                {handleCancel && (
                  <Button
                    size="mini"
                    onClick={(e) => {
                      e.preventDefault();
                      resetForm();
                      handleCancel();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
            
            
          </Form>
        )}}
      </Formik>
    </Segment>
  );


  function renderSignature(signature) {
    return (
      <Table compact basic="very">
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <Icon name="pencil" /> Signature
            </Table.Cell>
            <Table.Cell>
              {disabled ? (
                <img src={signature} />
              ) : (
                <>
                  <SignatureCanvas
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: "signature-canvas",
                    }}
                    ref={sigPadRef}
                  />
                  <br />
                  <Button
                    size="mini"
                    basic
                    onClick={(e) => {
                      e.preventDefault();
                      if (sigPadRef.current) {
                        sigPadRef.current.clear();
                      }
                    }}
                  >
                    Clear
                  </Button>
                </>
              )}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    );
  
  
  }

  function renderSectionTabular(s, values, setFieldValue) {
    const fields = s.fields.filter((f) => f.type !== "aggregate");
    return (
      <Segment basic vertical key={s.title} size="tiny">
      
        
        <Table celled compact stackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{s.title}</Table.HeaderCell>
              {fields.map((f, i) => (
                <Table.HeaderCell key={i}>{f.name}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {s.rows.map((row, rowIndex) => (
              <Table.Row key={rowIndex}>
                <Table.Cell style={{ backgroundColor: "#eee" }}>
                  {row.value}
                </Table.Cell>
                {fields.map((f, i) => (
                  <Table.Cell key={i}>
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
    const sectionColumns = s.sectionColumns || 1;
    const gridColumns = Array.from({ length: sectionColumns }, (_, index) => index + 1);
    const sectonFields = s.fields.filter((f) => f.type !== "aggregate");
    const fieldsPerColumn = Math.ceil(sectonFields.length / sectionColumns); // Calculate fields per column

    return (
      <Segment basic vertical key={s.title} size="tiny">
        
        {s.title && (
          <Menu size="large" tabular>
            <Menu.Item active>{s.title}</Menu.Item>
          </Menu>
        )}
        <Grid divided columns={sectionColumns} doubling>
          {gridColumns.map((column) => (
            <Grid.Column key={column}>
              <Grid stackable>
                {sectonFields
                  .slice(
                    (column - 1) * fieldsPerColumn,
                    column * fieldsPerColumn
                  ) // Extract fields for current column

                  .map((f, i) => (
                    <Grid.Row
                      stretched
                      key={f.guid}
                      style={{ paddingTop: "0.1rem", paddingButtom: "0.1rem" }}
                    >
                      <Grid.Column 
                        width={4}
                        className="field-column"
                      >
                        {f.type === "info" ? "" : f.name}
                      </Grid.Column>
                      <Grid.Column width={12} textAlign="left">
                        {renderField(f, values, setFieldValue)}
                      </Grid.Column>
                    </Grid.Row>
                  ))}
              </Grid>
            </Grid.Column>
          ))}
        </Grid>
      </Segment>
    );
  }
}
