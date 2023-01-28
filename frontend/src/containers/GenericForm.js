import React, { useState, useEffect } from 'react';
import { Formik } from 'formik';
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, FormikDebug, Radio, Select, Checkbox } from 'formik-semantic-ui-react';
import FormHeader from "../components/FormHeader";
import { Grid, Header, Icon, Segment, Table, Button, Label, Loader } from 'semantic-ui-react';
import  formConfig  from "../components/forms/formConfig"
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import LoaderButton from '../components/LoaderButton';
import Competency from '../components/Competency';

export default function GenericForm() {
  const { formKey, formId } = useParams();
  const customerIsoId = "iso-123";
  const callJwtAPI = JwtApi();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const formDef = formConfig[formKey];
  const nav = useNavigate();

  

  useEffect(() => {
    function loadForm() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/forms/${formId}`
      );
    }

    async function onLoad() {
      try {
        if (formId) {
          const item = await loadForm();

          setFormData(item.formValues);
        } 

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);
  
  async function handleSubmit(values) {
    setIsLoading(true);
    try {
      let newFormId;
      if (formId) {
        await updateForm(values);
      } else {
        const ret = await createForm(values);
        newFormId = ret.formId;
      }
      nav(`/forms`);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }

  function createForm(values) {
    return callJwtAPI("POST", `/customer-isos/${customerIsoId}/forms`, {
      formKey: formKey,
      formValues: values,
    });
  }

  function updateForm(values) {
    return callJwtAPI(
      "PUT",
      `/customer-isos/${customerIsoId}/forms/${formId}`,
      {
        formValues: values,
      }
    );
  }
  if (!formDef) {
    return <Segment><Header as="h3">Form definition does not exist.</Header></Segment>
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
  
  function renderField(f) {
    const name = f.name;
    const id = `input-${f.name}`;
    switch (f.type) {
      case "info":
        return (
          <Label as="a" color="teal" pointing="below">
            {f.description}
          </Label>
        );

      case "text":
        return <Input size="small" name={name} id={id} />;

      case "email":
        return <Input name={name} id={id} icon="at" fluid errorPrompt />;
      // code block to be executed if expression === value2

      case "radio":
        return (
          <Button.Group>
            {f.options.map((o) => (
              <Button basic color="blue" key={o}>
                <Radio label={o} name={name} value={o} />
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
        const options = f.options.map((o) => ({value: o, text: o}));
        return <Select options={options} name={name} id={id} />;


      case "competency":
        return <Competency name={name} />
      default:
        return <div>Unsupported Field</div>;
    }
  }

  if (isLoading) return <Loader active />;
  return (
    <Segment>
      <FormHeader heading={formDef.title} />
      <Formik initialValues={formData || defaultValues} onSubmit={handleSubmit} >
        <Form size="small">
          {formDef.sections.map((section) => (
            <Segment  key={section.title}>
              <Grid>
                <Grid.Column width={14}>
                  <Table celled striped compact stackable>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell colSpan="5">
                          {section.title}
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {section.fields.map((f, i) => (
                        <Table.Row key={f.name}>
                          <Table.Cell width={4}>{f.title}</Table.Cell>
                          <Table.Cell width={8} textAlign="center">
                            {renderField(f)}
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
          <LoaderButton
            type="submit"
            className="ms-auto hide-in-print"
            isLoading={isLoading}
          >
            Submit
          </LoaderButton>
          {/* <Button secondary>Back</Button> */}
          <FormikDebug />
        </Form>
        
      </Formik>
    </Segment>
  );
}
