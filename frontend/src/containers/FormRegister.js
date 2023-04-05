import React, { useEffect, useState } from "react";
import {
  Button, Icon, Message
} from "semantic-ui-react";
import { parseISO } from "date-fns";
import { NumericFormat } from "react-number-format";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Header, Loader, Table } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";

export default function FormRegister({formDefInput, formsInput, isHistory}) {
  const { templateId } = useParams();
  const [formDef, setFormDef] = useState(formDefInput);
  const [forms, setForms] = useState(formsInput);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  
  useEffect(() => {
    async function onLoad() {
      if (formDef) {// all data have been passed from another component, we are just checking formDef
        setIsLoading(false);
        return; 
      }
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
  function getAggregateFiledValue(data, field, fields) {
    
    const sum = fields
      .filter(f => f.type === "weightedSelect" || f.type === "weightedDropdown")
      .reduce((acc, currentField) => {
        // get value of current field
        const fieldValue = data.formValues[currentField.name];
        const fieldWeigth = currentField.options.find(o => o.value == fieldValue)?.weight ?? 0;
        
        return acc + parseFloat(fieldValue) * parseFloat(fieldWeigth);
      }, 0);

      let result = null;
      field.options.forEach(option => {
        
        if (sum >= parseFloat(option.valueFrom) && sum <= parseFloat(option.valueTo) && !result) {
          result = option;
        }
      });

      
      return result || {color: "white", title: "-"};
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
      
      case "wysiwyg":
        return <div dangerouslySetInnerHTML={{ __html: fieldValue }}/>;

      default:
        return fieldValue;
    }
  }
  function renderActionInfo(ts, user) {
    const date = new Date(ts);
    
    return <>
    {user ? `${user.firstName} ${user.lastName}` : "-"}
    <p>{ts ? date.toLocaleString() : ""}</p>
    </>
  }
  function renderRegister() {
    const hasEntries = forms && forms.length > 0;
    
    return (
      <>
        {!isHistory && <Header>{formDef.title}</Header>}
        {!hasEntries && (
          <Message
            header={isHistory ? "No old versions of this record exist" : "No Record found for this form"}
            content={isHistory ? "" : "Start by creating your first record!"}
            icon="exclamation"
          />
        )}
        {hasEntries && (
          <Table compact celled>
            <Table.Header>
              <Table.Row>
                {formDef.sections
                  .filter((s) => !s.isTable)
                  .map((s) =>
                    s.fields
                      .filter((f) => f.type !== "info")
                      .map((f) => (
                        <Table.HeaderCell key={f.name}>
                          {f.name}
                        </Table.HeaderCell>
                      ))
                  )}
                <Table.HeaderCell width={1}>Create</Table.HeaderCell>
                <Table.HeaderCell width={1}>Update</Table.HeaderCell>
                {!isHistory && (
                  <Table.HeaderCell width={1} textAlign="center">
                    Action
                  </Table.HeaderCell>
                )}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {forms.map((d) => (
                <Table.Row key={d.formId}>
                  {formDef.sections
                    .filter((s) => !s.isTable)
                    .map((s) =>
                      s.fields
                        .filter((f) => f.type !== "info")
                        .map((f) => {
                          if (f.type === "aggregate") {
                            const { color, title } = getAggregateFiledValue(
                              d,
                              f,
                              s.fields
                            );
                            return (
                              <Table.Cell
                                key={f.name}
                                style={{ backgroundColor: color }}
                              >
                                {title}
                              </Table.Cell>
                            );
                          } else
                            return (
                              <Table.Cell key={f.name}>
                                {getFiledValue(d, f)}
                              </Table.Cell>
                            );
                        })
                    )}
                  <Table.Cell width={1}>
                    {renderActionInfo(d.createdAt, d.createdByUser)}
                  </Table.Cell>
                  <Table.Cell width={1}>
                    {renderActionInfo(d.updatedAt, d.updatedByUser)}
                  </Table.Cell>

                  {!isHistory && (
                    <Table.Cell textAlign="center">
                      <LinkContainer to={`/form/${d.templateId}/${d.formId}`}>
                        <Button circular size="mini" basic icon="eye" />
                      </LinkContainer>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        {!isHistory && (
          <>
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
        )}
      </>
    );
  }



  if (isLoading) return <Loader active />;
  if (hasError) return <Message>:/</Message>
  return renderRegister();
}
