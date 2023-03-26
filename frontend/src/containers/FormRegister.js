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
import { Loader, Header, Table } from "semantic-ui-react";
import { useParams } from "react-router-dom";
import { parseISO } from "date-fns";
import { NumericFormat } from "react-number-format";
import { makeApiCall } from "../lib/apiLib";

export default function FormRegister() {
  const { templateId } = useParams();
  const [formDef, setFormDef] = useState(null);
  const [forms, setForms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function onLoad() {
      setIsLoading(true);
      try {
          // todo: how do we avoid two roundtrips?
          const template = await loadTemplate(templateId);
          setFormDef(template.templateDefinition);

          const forms = await loadTemplateForms(templateId);
          setForms(forms);
      } catch (e) {
        setHasError(true);
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, []);

  async function loadTemplate(templateId) {
    return await makeApiCall(
      "GET",
      `/templates/${templateId}`
    );
  }
  async function loadTemplateForms(templateId) {
    return await makeApiCall(
      "GET",
      `/templates/${templateId}/forms`
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
            header="No Record found for this form"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
        {hasEntries && (
          <Table compact celled >
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
        <LinkContainer to={`/registers`}>
          <Button basic secondary>
            Back
          </Button>
        </LinkContainer>
        <LinkContainer to={`/form/${templateId}`}>
          <Button basic primary>
            Create New Record
          </Button>
        </LinkContainer>

      </>
    );
  }



  if (isLoading) return <Loader active />;
  if (hasError) return <Message>:/</Message>
  return renderRegister();
}
