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
}
