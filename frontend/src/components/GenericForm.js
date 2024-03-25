import { Field, FieldArray, Formik } from "formik";
import { Form } from "formik-semantic-ui-react";
import { useEffect, useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import SignatureCanvas from "react-signature-canvas";
import {
  Button,
  Card,
  CardGroup,
  Divider,
  Grid,
  Icon,
  Image,
  Menu,
  Segment,
  Table
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import placeholderImage from "../fileplaceholder.jpg";
import { useAppContext } from "../lib/contextLib";
import { DynamicField } from "./DynamicField";
import "./GenericForm.css";
import UserPicker from "./UserPicker";
import RiskRegister from "./systemTemplates/RiskRegister";

export function GenericForm({
  formDef,
  formData,
  handleSubmit,
  disabled,
  handleCancel,
  users, // all users
  members, // workspace members
  isSystemForm,
  systemFormName,
}) {
  const SIGNATURE_FIELD_NAME = "form-signature";

  const sigPadRef = useRef(null);
  const { tenant } = useAppContext();

  useEffect(() => {
    if (sigPadRef.current && formData) {
      sigPadRef.current.fromDataURL(formData[SIGNATURE_FIELD_NAME]);
    }
  }, [formData, disabled]);


  const tabularFieldName = (rowIndex, name) => `row${rowIndex}-${name}`;

  let defaultValues =
    formDef && formDef.sections
      ? {
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
            .reduce(
              (acc, field) => {
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
              },
              {
                attachments: [],
              }
            ),
        }
      : {};

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
      updatedValues[SIGNATURE_FIELD_NAME] = sigPadRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
    }

    handleSubmit(updatedValues, formikBag);
  };
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
                    <DynamicField fieldDefinition={ {...f, name: tabularFieldName(rowIndex, f.name)} } value={values[tabularFieldName(rowIndex, f.name)]} valueSetter={setFieldValue} disabled={disabled} users={users}/>
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
    const gridColumns = Array.from(
      { length: sectionColumns },
      (_, index) => index + 1
    );
    const sectonFields = s.fields.filter((f) => f.type !== "aggregate");
    const fieldsPerColumn = Math.ceil(sectonFields.length / sectionColumns); // Calculate fields per column

    return (
      <Segment basic vertical key={s.title} size="tiny">
        {s.title &&
          (disabled ? (
            <h1 className="title-disabled">{s.title}</h1>
          ) : (
            <Menu size="large" tabular>
              <Menu.Item active>{s.title}</Menu.Item>
            </Menu>
          ))}
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
                        className={
                          disabled ? "field-column-disabled" : "field-column"
                        }
                      >
                        {f.type === "info" ? "" : f.name}
                      </Grid.Column>
                      <Grid.Column width={12} textAlign="left">
                        <DynamicField fieldDefinition={f} value={values[f.name]} valueSetter={setFieldValue} disabled={disabled} users={users}/>
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

  function renderAttachments(attachments, setFieldValue) {
    return (
      <>
        <div>
          <Icon name="attach" />
          Attachments
        </div>
        <FieldArray name="attachments">
          {({ insert, remove, push }) => (
            <CardGroup>
              {attachments &&
                attachments.length > 0 &&
                attachments.map((attachment, index) => (
                  <Card key={index}>
                    {!disabled && (
                      <Card.Content>
                        <Button
                          className="hide-on-print"
                          size="mini"
                          type="button"
                          circular
                          icon="x"
                          basic
                          disabled={disabled}
                          onClick={() => remove(index)}
                        ></Button>
                      </Card.Content>
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

                    <Card.Content>
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

                      {disabled ? (
                        <span>{attachment.fileNote}</span>
                      ) : (
                        <Field
                          name={`attachments.${index}.fileNote`}
                          placeholder="File Note"
                          type="text"
                        />
                      )}
                    </Card.Content>
                  </Card>
                ))}
              <Grid.Row>
                <Grid.Column>
                  {!disabled && (
                    <Button
                      type="button"
                      basic
                      disabled={
                        disabled || (attachments && attachments.length > 5)
                      }
                      circular
                      icon="plus"
                      size="mini"
                      onClick={() => push({ file: "", fileNote: "" })}
                    />
                  )}
                </Grid.Column>
              </Grid.Row>
            </CardGroup>
          )}
        </FieldArray>
      </>
    );
  }

  function renderSystemForm(systemFormName, values, setFieldValue) {
    switch (systemFormName) {
      case "SYS_RSK":
        return <RiskRegister values={values} setFieldValue={setFieldValue} disabled={disabled}/>;
    
      default:
        throw new Error(`System template with ID ${systemFormName} not found`);

    }
    
  }

  function renderMain(formDef, values, setFieldValue, disabled) {
    if (isSystemForm) return renderSystemForm(systemFormName, values, setFieldValue, disabled);

    return formDef.sections.map((s) =>
      s.isTable
        ? renderSectionTabular(s, values, setFieldValue)
        : renderSection(s, values, setFieldValue)
    );
  }

  return (
    <Segment>
      <FormHeader
        heading={formDef.title}
        subheading={formDef.category}
        image={tenant?.logoURL || "/iso_cloud_logo_v1.png"}
      />
      <Formik
        initialValues={formData || defaultValues}
        onSubmit={preSubmit}
      >
        {({ isSubmitting, values, setFieldValue, resetForm }) => {
          return (
            <Form size="small">
              {renderMain(formDef, values, setFieldValue, disabled)}

              {renderAttachments(values.attachments, setFieldValue)}

              {members && (!disabled || values.assigneeId) && (
                <Segment>
                  <span>Assigned to </span>
                  <UserPicker
                    upward={true}
                    disabled={disabled}
                    users={members}
                    value={values.assigneeId}
                    onChange={(userId) => setFieldValue("assigneeId", userId)}
                  />
                </Segment>
              )}
              <Divider hidden />
              {formDef.hasSignature &&
                renderSignature(values[SIGNATURE_FIELD_NAME])}

              {!disabled && handleSubmit && (
                <div>
                  <Button primary type="submit" size="mini" floated="right">
                    Save
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
          );
        }}
      </Formik>
    </Segment>
  );
}
