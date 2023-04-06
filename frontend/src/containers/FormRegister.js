import React, { useEffect, useState } from "react";
import { Button, Divider, Icon, Label, Message, Popup } from "semantic-ui-react";
import { parseISO } from "date-fns";
import { NumericFormat } from "react-number-format";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Header, Loader, Table } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

export default function FormRegister({ formDefInput, formsInput, isHistory }) {
  const { templateId } = useParams();
  const [formDef, setFormDef] = useState(formDefInput);
  const [forms, setForms] = useState(formsInput);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [columnDefs, setColumnDefs] = useState(null);

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  useEffect(() => {
    async function onLoad() {
      if (formDef) {
        // all data have been passed from another component, we are just checking formDef
        setColumnDefs(getColumnDefs(formDef));
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

        setColumnDefs(getColumnDefs(template.templateDefinition));
      } catch (e) {
        setHasError(true);
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, []);

  async function loadTemplate(templateId) {
    return await makeApiCall("GET", `/templates/${templateId}`);
  }
  async function loadTemplateForms(templateId) {
    return await makeApiCall("GET", `/templates/${templateId}/forms`);
  }

  const getColumnDefs = (def) => {
    if (!def) return [];
    const valueColumns = def.sections
      .filter((s) => !s.isTable)
      .map((s) =>
        s.fields
          .filter((f) => f.type !== "info")
          .map((f) => ({
            field: f.name,
            resizable: true,
            filter: true,
            sortable: true,
            autoHeight: true,
            autoWidth: true,
            valueGetter: formValueGetter,
            cellRenderer: formValueRenderer(f.type),
          }))
      )
      .flat();

    return [
      ...valueColumns,
      {
        field: "created",
        sortable: true,
        width: 120,
        valueGetter: () => "create",
        cellRenderer: auditRenderer,
      },
      {
        field: "updated",
        sortable: true,
        width: 150,
        valueGetter: () => "update",
        cellRenderer: auditRenderer,
      },
      ...(isHistory
        ? []
        : [{ field: "action", width: 100, cellRenderer: actionRenderer }]),
    ];
  };

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
      .filter(
        (f) => f.type === "weightedSelect" || f.type === "weightedDropdown"
      )
      .reduce((acc, currentField) => {
        // get value of current field
        const fieldValue = data.formValues[currentField.name];
        const fieldWeigth =
          currentField.options.find((o) => o.value == fieldValue)?.weight ?? 0;

        return acc + parseFloat(fieldValue) * parseFloat(fieldWeigth);
      }, 0);

    let result = null;
    field.options.forEach((option) => {
      if (
        sum >= parseFloat(option.valueFrom) &&
        sum <= parseFloat(option.valueTo) &&
        !result
      ) {
        result = option;
      }
    });

    return result || { color: "white", title: "-" };
  }

  const competencyRenderer = (params) => {
    const fieldValue = params.value;
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
  };
  const dateRenderer = (params) => {
    return parseISO(params.value).toDateString();
  };
  const wysiwygRenderer = (params) => {
    let value = params.value;
    
    return (
      <Popup
        hoverable
        content={<div dangerouslySetInnerHTML={{ __html: value }} />}
        header={params.colDef.field}
        trigger={<span>...</span>}
      />
    );
  };
  const defaultRenderer = (params) => {
    return params.value;
  };
  const numberRenderer = (params) => {
    return (
      <NumericFormat
        displayType={"text"}
        thousandSeparator={true}
        value={params.value}
      />
    );
  };
  const actionRenderer = (params) => {
    const d = params.data;

    return (
      <LinkContainer to={`/form/${d.templateId}/${d.formId}`}>
        <a  size="mini" basic as="a" >Details</a>
      </LinkContainer>
    );
  };
  const auditRenderer = (params) => {
    const d = params.data;
    return params.value === "create" ? (
      <Popup
        content={renderActionInfo(d.createdAt, d.createdByUser)}
        header="Created"
        trigger={<span>{new Date(d.createdAt).toLocaleDateString()}</span>}
      />
    ) : (
      <Popup
        content={renderActionInfo(d.updatedAt, d.updatedByUser)}
        header="Updated"
        trigger={<span>{new Date(d.updatedAt).toLocaleDateString()}</span>}
      />
    );
  };

  const formValueRenderer = (fieldType) => {
    switch (fieldType) {
      case "competency":
        return competencyRenderer;
      case "date":
        return dateRenderer;
      case "number":
        return numberRenderer;
      case "wysiwyg":
        return wysiwygRenderer;
      default:
        return defaultRenderer;
    }
  };
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
        return (
          <NumericFormat
            displayType={"text"}
            thousandSeparator={true}
            value={fieldValue}
          />
        );

      case "wysiwyg":
        return <div dangerouslySetInnerHTML={{ __html: fieldValue }} />;

      default:
        return fieldValue;
    }
  }
  const firstLetter = (word) => (word ? word.charAt(0) : 0);
  function renderUserInitial(user) {
    if (user)
      return (
        <Label circular color="grey">{`${firstLetter(
          user.firstName
        )}${firstLetter(user.lastName)}`}</Label>
      );
    else return <Label>-</Label>;
  }
  function renderActionInfo(ts, user) {
    const date = new Date(ts);

    return (
      <>
        {user ? `${user.firstName} ${user.lastName}` : "-"}
        <p>{ts ? date.toLocaleString() : ""}</p>
      </>
    );
  }

  const formValueGetter = (params) => {
    return params.data.formValues[params.colDef.field];
  };

  function renderRegister() {
    const hasEntries = forms && forms.length > 0;

    return (
      <>
        {!isHistory && <Header>{formDef.title}</Header>}
        {!hasEntries && (
          <Message
            header={
              isHistory
                ? "No old versions of this record exist"
                : "No Record found for this form"
            }
            content={isHistory ? "" : "Start by creating your first record!"}
            icon="exclamation"
          />
        )}
        {hasEntries && (
          <div
            className="ag-theme-alpine"
            style={{
              height: "500px",
              width: "100%",
            }}
          >
            <AgGridReact
              columnDefs={columnDefs}
              rowData={forms}
              rowHeight="25"
              animateRows={true}
            ></AgGridReact>
          </div>
        )}
        <Divider hidden />
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
  if (hasError) return <Message>:/</Message>;
  return renderRegister();
}
