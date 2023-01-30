import React, { useState, useEffect } from "react";
import  { Icon, Button, List, Segment, Card, Divider } from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import  formConfig from "../components/forms/formConfig"
import { Loader, Header, Table } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";


export default function ISOForms() {
  const [forms, setForms] = useState([]);
  const customerIsoId = "iso-123";
  const [isLoading, setIsLoading] = useState(true);
  const callJwtAPI = JwtApi();

  useEffect(() => {
    async function onLoad() {
      try {
        const forms = await loadForms();
        
        setForms(forms);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function loadForms() {
    return callJwtAPI("GET", `/customer-isos/${customerIsoId}/forms`);
  }

  function renderFormList() {
    return (
      <Table celled striped compact stackable attached>
        <Table.Body>
          {forms.map(({ formId, formKey, createdAt, formValues }, i) => (
            <Table.Row key={formId}>
              <Table.Cell width={4}> 
              <LinkContainer key={formId} to={`/form/${formKey}/${formId}`} as='a'>
              <Header 
              as='h5'
              content={formConfig[formKey].title}
              subheader={formConfig[formKey] &&
                formConfig[formKey].keyAttributes &&
                formConfig[formKey].keyAttributes.map((f) => (
                  <div key={`${f}.${formId}`}>
                    <span className="font-weight-bold">{formValues[f]}</span>
                  </div>
                ))} 
          /></LinkContainer>
              </Table.Cell>
              <Table.Cell width={1}>
                Created: {new Date(createdAt).toLocaleString()}
              </Table.Cell>
                 
              <Table.Cell width={1} textAlign="center">
                <LinkContainer key={formId} to={`/form/${formKey}/${formId}`}>
                  <Button animated="vertical" size="mini">
                    <Button.Content hidden>Edit</Button.Content>
                    <Button.Content visible><Icon name="edit"  /></Button.Content>
                  </Button>
                </LinkContainer>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }
  function renderForms() {
    return (
      <>
        <FormHeader heading="Forms" />

        {isLoading && <Loader active />}
        {!isLoading && renderFormList()}

        <Segment>
          <Header>
            <Icon name="add" color="green" />
            Create New
          </Header>
          <List horizontal>
            {Object.keys(formConfig).map((f) => (
              <LinkContainer key={f} to={`/form/${f}`}>
                <Button primary>{formConfig[f].title}</Button>
              </LinkContainer>)
            )}
          </List>
        </Segment>
      </>
    );
  }
  return renderForms();
  const requiredOptions = [
    {
      key: "required",
      icon: "circle thin",
      color: "green",
      text: "Required",
    },
    {
      key: "recommended",
      icon: "registered",
      color: "yellow",
      text: "Recommended",
    },
    {
      key: "notApplicable",
      icon: "minus",
      color: "grey",
      text: "Not Applicable",
    },
  ];
  const competencyOptions = [
    {
      key: "competent",
      icon: "checkmark",
      color: "green",
      text: "Competent",
    },
    {
      key: "workingUnderSupervision",
      icon: "exclamation",
      color: "yellow",
      text: "Working under supervision",
    },
    {
      key: "notCompetent",
      icon: "x",
      color: "red",
      text: "Not competent",
    },
  ];
  function getOptionbyName(options, name) {
    return options.find((option) => option.key === name);
  }
  const formKey = 'Tender';
  const data = forms.filter(f => f.formKey == formKey)
  const formDef = formConfig[formKey];
  function getFiledValue(data, field){
    const fieldValue = data.formValues[field.name];
    if (field.type == 'competency') {
      const r = getOptionbyName(requiredOptions, fieldValue.required);
      const c = getOptionbyName(competencyOptions, fieldValue.competency);

      return (
        <>
          {r && <Icon name={r.icon} color={r.color} size="large" />}

          {r && c && r.key != "notApplicable" && (
            <Icon name={c.icon} color={c.color} size="large" />
          )}
        </>
      );
    }
    return fieldValue;
  }
  return (
    <Table compact>
      <Table.Header>
        <Table.Row>
        <Table.HeaderCell>Edit</Table.HeaderCell>
          {formDef.sections[0].fields.map((f) => (
            <Table.HeaderCell key={f.name}>{f.title}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {data.map((d) => (
          <Table.Row key={d.formId}>
            <Table.Cell>
              <LinkContainer to={`/form/${d.formKey}/${d.formId}`} as="a">
                <a href="#"  >+</a>
              </LinkContainer>
            </Table.Cell>

            {formDef.sections[0].fields.map((f) => (
              <Table.Cell key={f.name}>{getFiledValue(d, f)}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );

}
