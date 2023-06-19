import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { parseISO } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Button, Divider, Header, Icon, Label, Loader, Message, Popup } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { cloneDeep } from 'lodash'; // Import the cloneDeep function from the lodash library


import "./FormRegisters.css";


export default function FormRegister({ formDefInput, formsInput, isHistory, isPreview }) {
  const gridRef = useRef();
  const { workspaceId, templateId } = useParams();
  const [formDef, setFormDef] = useState(formDefInput);
  const [forms, setForms] = useState(formsInput);
  const [originalForms, setOriginalForms] = useState(formsInput);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState({isSaving: false});
  const [hasError, setHasError] = useState(false);
  const [columnDefs, setColumnDefs] = useState(null);
  const { loadAppWorkspace } = useAppContext();
  const [hasChanges, setHasChanges] = useState(false);


  ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);
  
  useEffect(() => {
    setFormDef(formDefInput);
    if (formDefInput) {
      // all data have been passed from another component, we are just checking formDef
      setColumnDefs(getColumnDefs(formDefInput));
      return;
    }

  }, [formDefInput]);

  useEffect(() => {
    async function onLoad() {
      try {
        setIsLoading(false);
        if (formDef) {
          // all data have been passed from another component, we are just checking formDef
          setColumnDefs(getColumnDefs(formDef));
          return;
        }
        if (isPreview) {
          return;
        }

        setIsLoading(true);
        
        // todo: how do we avoid two roundtrips?
        const template = await loadTemplate(templateId);
        setFormDef(template.templateDefinition);

        const forms = await loadTemplateForms(templateId);
        
        setForms(forms);
        const formsCopy = cloneDeep(forms);

        setOriginalForms(formsCopy);

        setColumnDefs(getColumnDefs(template.templateDefinition));

        loadAppWorkspace(workspaceId);


      } catch (e) {
        setHasError(true);
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, []);

  
const handleCellValueChanged = useCallback(() => {
  setHasChanges(true);
}, []);


  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);

  }, []);

  async function loadTemplate(templateId) {
    return await makeApiCall("GET", `/templates/${templateId}`);
  }
  async function loadTemplateForms(templateId) {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/templates/${templateId}/forms`);
  }


  
  const handleSave = async () => {
    async function processChangedForms() {
      try {
        for (let index = 0; index < changedForms.length; index++) {
          const form = changedForms[index];
          setSavingStatus({ current: index + 1 });
          await updateForm(form.formId, form.formValues);
        }
        console.log('All forms have been updated successfully.');
      } catch (error) {
        console.error('Error updating forms:', error);
        onError(error);
      }
    }
    function objectsAreEqual(obj1, obj2) {
      if (!obj1) {
        return !obj2;
      }
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (let key of keys1) {
        if (obj1[key] !== obj2[key]) {
          return false;
        }
      }

      return true;
    }
    const changedForms = forms.filter((form) => {
      // Find the corresponding original form based on formId
      const originalForm = originalForms.find(
        (originalForm) => originalForm.formId === form.formId
      );

      return !objectsAreEqual(originalForm.formValues.register, form.formValues.register);
    });

    console.log(changedForms);
    setSavingStatus({isSaving: true, current: 0, total: changedForms.length});
    processChangedForms(changedForms);
    setSavingStatus({isSaving: false});

    setHasChanges(false);
  };

  async function updateForm(formId, values) {
    return await makeApiCall("PUT", `/workspaces/${workspaceId}/forms/${formId}`, {
      formValues: values,
      isRevision: false // or should it be true?
    });
  }

  const getColumnDefs = (def) => {
    if (!def) return [];
    const formColumns = def.sections
      .map((s) => ({
        headerName: s.title,
        children: s.fields
          .filter((f) => f.type !== "info")
          .filter((f) => !s.isTable || ["SUM", "AVG", "COUNT", "MIN", "MAX"].includes(f.aggregateFunction)) // in Table sections only show fields with aggegate 
          .map((f) => ({
            field: f.name,
            headerName: !s.isTable ? f.name : `${f.aggregateFunction}(${f.name})`,
            cellClass: "ag-cell-bordered ag-cell-readonly",
            valueGetter: (params) =>
              s.isTable ? tableAggregateFieldValueGetter(params, f)
              :
              f.type === "aggregate"
                ? aggregateFiledValueGetter(params, s, f)
                : formValueGetter(params),
            cellStyle: (params) =>
              f.type === "aggregate"
                ? { backgroundColor: params.value.color }
                : null,
            cellRenderer: formValueRenderer(f.type),
          })),
      }))
      .flat();

    const registerColumns = !def.registerFields
      ? []
      : [{
          headerName: "Register",
          children: def.registerFields.map((f) => ({
            field: f.name,
            editable: !isHistory,
            singleClickEdit: true,
            onCellValueChanged: handleCellValueChanged,
            valueGetter: registerValueGetter,
            valueSetter: registerValueSetter,
          })),
        }];
    const auditColums = [{headerName: "", children: [{
      field: "created",
      sortable: true,
      width: 80,
      valueGetter: () => "create",
      cellRenderer: auditRenderer,
      cellClass: "ag-cell-bordered ag-cell-readonly"
    },
    {
      field: "updated",
      sortable: true,
      width: 80,
      valueGetter: () => "update",
      cellRenderer: auditRenderer,
      cellClass: "ag-cell-bordered ag-cell-readonly"
    },]}];
    return [
      ...(isHistory
        ? []
        : [{ field: "", width: 100, cellRenderer: actionRenderer, cellClass: "ag-cell-bordered ag-cell-readonly", }]),
      ...formColumns,
      ...registerColumns,
      ...auditColums
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
  const formValueGetter = (params) => {
    return params.data.formValues[params.colDef.field];
  };

  const registerValueGetter = (params) => {
    return params.data.formValues.register ? params.data.formValues.register[params.colDef.field] : undefined;
  };
  const registerValueSetter = (params) => {
    params.data.formValues.register = params.data.formValues.register || {};
    params.data.formValues.register[params.colDef.field] = params.newValue;
    return true;
  };

  const tableAggregateFieldValueGetter = (params, field) => {
    const formValues = params.data.formValues;

    let sumOfVal = 0;
    let countOfVal = 0;
    let minValue = Infinity;
    let maxValue = -Infinity;

    const targetPattern = new RegExp(`^row\\d+-${field.name}$`); // for instance "row##-Score"

    for (const key in formValues) {
      if (targetPattern.test(key)) {
        const val = parseFloat(formValues[key]);
        countOfVal++;
        if (!isNaN(val)) {
          sumOfVal += val;
          minValue = Math.min(minValue, val);
          maxValue = Math.max(maxValue, val);
        }
      }
    }

    switch (field.aggregateFunction) {
      case "SUM":
        return sumOfVal || 0;
    
      case "AVG":
        return countOfVal > 0 ? sumOfVal / countOfVal : 0;
    
      case "COUNT":
        return countOfVal;

      case "MAX":
          return maxValue !== -Infinity ? maxValue : undefined;
    
      case "MIN":
          return minValue !== Infinity ? minValue : undefined;    
          
      default:
        return undefined;
    }

  };
  const aggregateFiledValueGetter = (params, section, field) =>  {
    const data = params.data;
    const fields = section.fields;

    const sum = fields
      .filter(
        (f) => ["number", "select", "dropdown"].includes(f.type) 
      )
      .reduce((acc, currentField) => {
        // get value of current field
        const fieldValue = data.formValues[currentField.name];
        const fieldWeight = currentField.weight || 0; // Consider field weight as 0 if not present

        const numericFieldValue = parseFloat(fieldValue) || 0;
        const numericFieldWeight = parseFloat(fieldWeight) || 0;

        return acc + parseFloat(fieldValue) * parseFloat(field.weigth);
      }, 0);

    let result = null;
    field.options.forEach((option) => {
      if (
        sum >= parseFloat(option.valueFrom) &&
        sum <= parseFloat(option.valueTo) &&
        !result
      ) {
        result = option;
        result["sum"] = sum;
      }
    });

    return result || { color: "white", title: "-" };
  }

  const aggregationRenderer = (params) => {
    return <span>{params.value.title}</span>
  }
  const linkRenderer = (params) => {
    return params.value ? <a href={params.value}>Link</a> : <></>;
  }
  
  const competencyRenderer = (params) => {
    const fieldValue = params.value;
    if (!fieldValue) return <></>;
    
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
      <LinkContainer to={`/workspace/${workspaceId}/form/${d.templateId}/${d.formId}`}>
        <a  size="mini"  as="a" >Details</a>
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
      d.updatedAt ? 
      <Popup
        content={renderActionInfo(d.updatedAt, d.updatedByUser)}
        header="Updated"
        trigger={<span>{new Date(d.updatedAt).toLocaleDateString()}</span>}
      />
      :
      <></>
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
      case "aggregate":
        return aggregationRenderer;
      case "link":
        return linkRenderer;
      default:
        return defaultRenderer;
    }
  };

  function renderActionInfo(ts, user) {
    const date = new Date(ts);

    return (
      <>
        {user ? `${user.firstName} ${user.lastName}` : "-"}
        <p>{ts ? date.toLocaleString() : ""}</p>
      </>
    );
  }

  const exportGridToCSV = useCallback(() => {
    gridRef.current.api.exportDataAsCsv();
  }, []);

  function renderRegister() {
    const hasEntries = forms && forms.length > 0;
    return (
      <>
        {!isHistory && <Header>{formDef?.title}</Header>}
        {!isPreview && !hasEntries && (
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
        {!isPreview && (
          <>
            <Button basic size="tiny" onClick={() => autoSizeAll(true)}>
              Auto Size
            </Button>
            <Button basic size="tiny" onClick={exportGridToCSV}>
              <Icon name="file excel" color="green" /> Export to Excel
            </Button>
          </>
        )}
        <div
          className="ag-theme-balham"
          style={{
            height: `${isPreview ? "200px" : "500px"}`,
            width: "100%",
            overflowX: "auto",
          }}
        >
          <AgGridReact
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={forms}
            rowHeight="25"
            animateRows={true}
            stopEditingWhenCellsLoseFocus={true}
            defaultColDef={{
              cellClass: "ag-cell-bordered",
              resizable: true,
              width: 110,
              filter: true,
              sortable: true,
              autoHeight: true,
            }}
          ></AgGridReact>
        </div>

        <Divider hidden />
        {!isHistory && !isPreview && (
          <>
            <LinkContainer to={`/workspace/${workspaceId}/registers`}>
              <Button basic secondary size="mini">
                Back
              </Button>
            </LinkContainer>
            <LinkContainer to={`/workspace/${workspaceId}/form/${templateId}`}>
              <Button basic primary size="mini">
                <Icon name="plus" />
                Record
              </Button>
            </LinkContainer>
            {hasChanges && <Button basic color="blue" floated="right" onClick={handleSave} ><Icon name="save"/>Save</Button>}
          </>
        )}
      </>
    );
  }

  if (isLoading) return <Loader active />;
  if (savingStatus.isSaving) return <Loader active>{`Savign ${savingStatus.current} of ${savingStatus.total}`}</Loader>;
  if (hasError) return <Message>:/</Message>;
  return renderRegister();
}
