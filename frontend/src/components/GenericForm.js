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
import placeholderImage from "../fileplaceholder.jpg";
import { useAppContext } from "../lib/contextLib";
import { DynamicFieldInput } from "./DynamicFieldInput";
import FooterButtons from "./FooterButtons";
import "./GenericForm.css";
import UserPicker from "./UserPicker";
import RiskRegister from "./systemTemplates/RiskRegister";
import SurveyViewer from "../components/SurveyViewer";

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
      <Segment basic vertical key={s.title} >
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
                    <DynamicFieldInput hideLabel="true" fieldDefinition={ {...f, name: tabularFieldName(rowIndex, f.name)} } value={values[tabularFieldName(rowIndex, f.name)]} valueSetter={setFieldValue} disabled={disabled} users={users}/>
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
      <Segment basic vertical key={s.title} >
        {s.title &&
          (<div  className="border-b border-gray-200 my-5">
          <h3>{s.title}</h3></div>)
          }
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
                  <DynamicFieldInput fieldDefinition={f} value={values[f.name]} valueSetter={setFieldValue} disabled={disabled} users={users}/>
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
              {attachments && attachments.length > 0 && attachments.map((attachment, index) => ( 
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
                  
                    <Button
                      type="button"
                      basic
                      disabled={
                        disabled || (attachments && attachments.length > 5)
                      }
                      circular
                      icon="plus"
                      size="mini"
                      className="!my-3"
                      onClick={() => push({ file: "", fileNote: "" })}
                    />
                  
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
        return <RiskRegister  values={values} setFieldValue={setFieldValue} disabled={disabled} users={users}/>;
    
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
  function renderHeader(heading, subheading, image) {
    return  <div className="w-full px-3  text-center">
    <div>
      <img
        src={image}
        className="w-48 h-48 mx-auto object-contain rounded-full mb-1"
        alt="Logo"
      />
    </div>
    <div>
      <div className="text-gray-900 font-bold mb-2" style={{ fontSize: '32px' }}>{heading}</div>
      {subheading && <span className="text-gray-500 text-sm">{subheading}</span>}
    </div>
  </div>
  
  }

  return (
    <div className="mx-auto  !pb-3 w-full  border border-gray-300 mt-5 shadow-lg rounded-[4rem]">
      <div className="bg-[#e6f3ff] rounded-t-[4rem] border-b-4 border-b-[#b3d9ff]">
        {renderHeader(formDef.title, formDef.category, tenant?.logoURL || "/iso_cloud_logo_v1.png")}
      </div>
      <div className="bg-[#F8FAFC] px-12  rounded-b-[4rem]">
      {formDef.isSurveyjs ? (
          <>
<SurveyViewer
      surveyJson={
        typeof formDef.surveyjsJSON === "string"
          ? JSON.parse(formDef.surveyjsJSON)
          : formDef.surveyjsJSON
      }
      onSubmit={handleSubmit}
      formData={formData}
      disabled={disabled}
    />

          {!disabled && handleSubmit && (
            <FooterButtons
              leftButton={
                handleCancel && {
                  label: "Cancel",
                  icon: "undo",
                  onClick: () => {
                    // Reset survey answers
                    handleCancel();
                  },
                }
              }
              
            />
          )}
          
          </> ) : 
      (<Formik
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
                <FooterButtons
                  leftButton={
                    handleCancel && {
                      label: "Cancel",
                      icon: "undo",
                      onClick: () => {
                        resetForm();
                        handleCancel();
                      },
                    }
                  }
                  rightButton={{
                    label: "Save",
                    icon: "save",
                    isSubmit: true,
                  }}
                />
              )}
            </Form>
          );
        }}
      </Formik>)}
      </div>
    </div>
  );
}
