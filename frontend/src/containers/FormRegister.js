import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
  List,
  Segment,
  Card,
  Divider,
  Item,
  Message,
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import { Loader, Header, Table } from "semantic-ui-react";
import { useParams } from "react-router-dom";
import { parseISO } from "date-fns";
import { NumericFormat } from "react-number-format";

export default function FormRegister() {
  const { templateId } = useParams();
  const [formDef, setFormDef] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [forms, setForms] = useState(null);
  const customerIsoId = "iso-123";
  const [isLoading, setIsLoading] = useState(true);
  const callJwtAPI = JwtApi();

  useEffect(() => {
    async function onLoad() {
      setIsLoading(true);
      try {
        if (templateId) {
          // todo: how do we avoid two roundtrips?
          const template = await loadTemplate(templateId);
          setFormDef(template.templateDefinition);

          const forms = await loadTemplateForms(templateId);
          setForms(forms);
        } else {
          const templates = await loadTemplates();

          setTemplates(templates);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, [templateId]);

  function loadTemplates() {
    return callJwtAPI("GET", `/customer-isos/${customerIsoId}/templates`);
  }
  function loadTemplate(templateId) {
    return callJwtAPI(
      "GET",
      `/customer-isos/${customerIsoId}/templates/${templateId}`
    );
  }
  function loadTemplateForms(templateId) {
    return callJwtAPI(
      "GET",
      `/customer-isos/${customerIsoId}/templates/${templateId}/forms`
    );
  }

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
  function getFiledValue(data, field) {
    
    const fieldValue = data.formValues[field.name];
    
    if (!fieldValue) return ""; // TODO should it be missing or N/A or somethign like that?
    switch (field.type) {
      case "competency":
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
      case "date":
        return parseISO(fieldValue).toDateString();

      case "number":
        return <NumericFormat displayType={'text'} thousandSeparator={true} value={fieldValue} />;

      default:
        return fieldValue;
    }
  }

  function renderRegister() {
    const hasEntries = forms && forms.length > 0;
    
    return (
      <>
      <Header>{formDef.title}</Header>
        {!hasEntries && (
          <Message
            header="No Form found for this template"
            content="Start by creating your first form!"
            icon="exclamation"
          />
        )}
        {hasEntries && (
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Edit</Table.HeaderCell>
                {formDef.sections.map((s) =>
                  s.fields.map((f) => (
                    <Table.HeaderCell key={f.name}>{f.name}</Table.HeaderCell>
                  ))
                )}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {forms.map((d) => (
                <Table.Row key={d.formId}>
                  <Table.Cell>
                    <LinkContainer to={`/form/${d.templateId}/${d.formId}`}>
                      <Button
                        circular
                        size="mini"
                        basic
                        icon="pencil alternate"
                      />
                    </LinkContainer>
                  </Table.Cell>
                  {formDef.sections.map((s) =>
                    s.fields.map((f) => (
                      <Table.Cell key={f.name}>
                        {getFiledValue(d, f)}
                      </Table.Cell>
                    ))
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        <LinkContainer to={`/form/${templateId}`}>
          <Button basic primary>
            Create New Form
          </Button>
        </LinkContainer>
      </>
    );
  }

  function renderTemplatesList() {
    return (
      <>
        {(!templates || templates.length == 0) && (
          <Message
            header="No Template found"
            content="Start by creating your first template!"
            icon="exclamation"
          />
        )}
        <List divided relaxed>
          {templates &&
            templates.map((t) => {
              const def = t.templateDefinition;
              return (
                <List.Item key={t.templateId}>
                  <List.Icon
                    name="folder open outline"
                    color="blue"
                    size="large"
                    verticalAlign="middle"
                  />
                  <List.Content>
                    <LinkContainer to={`/register/${t.templateId}`}>
                      <List.Header as="a">{def.title}</List.Header>
                    </LinkContainer>
                    <List.Description>{`used by ${t.formCount}`}</List.Description>
                  </List.Content>
                </List.Item>
              );
            })}
          <Divider />
          <LinkContainer to={`/template`}>
            <Button basic primary>
              Create New Template
            </Button>
          </LinkContainer>
        </List>
      </>
    );
  }

  if (isLoading) return <Loader active />;

  if (templateId) {
    return renderRegister();
  } else {
    return renderTemplatesList();
  }
}
