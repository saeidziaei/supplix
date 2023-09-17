import React, { useState } from "react";
import { Button, Dropdown, Form, Grid, Input, Item, List, Radio, Table } from "semantic-ui-react";
import { BlockPicker } from "react-color";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import * as Yup from 'yup';



export default function FieldEditor({ value, onChange, onDelete, onDuplicate, isRegisterField, showWeight, showAggregateFunction  }) {
  const [field, setField] = useState(value);
  const [fieldErrors, setFieldErrors] = useState({});

  const Schema = Yup.object().shape({
    name: Yup.string()
      .matches(/^[^.]*$/, "Field name cannot contain a dot")
      .required("Required"),
    title: Yup.string()
      .matches(/^[^.]*$/, "Field title cannot contain a dot")
      .required("Required"),
    aggregateFunction: Yup.string(),
    weight: Yup.number(),
  });


  const [colorPickerVisible, setColorPickerVisible] = useState({})


  function handleFieldChange(element, value) {
    const updatedField = { ...field, [element]: value };
    setField(updatedField);
    onChange(updatedField);

    // Validate field name
  Schema.validateAt(element, updatedField)
  .then(() => {
    setFieldErrors((prevErrors) => ({
      ...prevErrors,
      [element]: undefined,
    }));
  })
  .catch((error) => {
    setFieldErrors((prevErrors) => ({
      ...prevErrors,
      [element]: error.message,
    }));
  });
  }
  function handleOptionChange(optionIndex, element, value) {
    const newOptions = field.options;
    newOptions[optionIndex][element] = value;
    const updatedField = { ...field, options: newOptions };
    setField(updatedField);
    onChange(updatedField);
   
  }
  function getFieldTypeText(value) {
    const fieldType = fieldTypes.find((fieldType) => fieldType.value === value);
    return fieldType ? fieldType.text : "";
  }
  function getFieldTypeHasOptions(value) {
    const fieldType = fieldTypes.find((fieldType) => fieldType.value === value);
    return fieldType ? fieldType.hasOptions : false;
  }
  const addOption = () => {
    const newOption =
      (field.type == "weightedSelect" || field.type == "weightedDropdown") ? { value: 0, weight: 0 } : 
      field.type == "aggregate" ? { valueFrom: 0, valueTo: 0, title: "OUTCOME", color:"#4266a1" } : 
      { value: "" };
    const newOptions = [...field.options, newOption];
    const updatedField = { ...field, options: newOptions };
    setField(updatedField);

    onChange(updatedField);
  };

  const removeOption = (optionIndex) => {
    const newOptions = field.options.filter(
      (_, index) => index !== optionIndex
    );

    const updatedField = { ...field, options: newOptions };
    setField(updatedField);

    onChange(updatedField);
  };
  function renderFieldAggregateFunction() {
    if (!showAggregateFunction) return;
    if (!["number", "select", "dropdown"].includes(field.type)) return;
    const options = [
      { key: 1, text: '(no aggregate)', value: "NA" },
      { key: 2, text: 'Sum', value: "SUM" },
      { key: 3, text: 'Average', value: "AVG" },
      { key: 4, text: 'Count', value: "COUNT" },
      { key: 5, text: 'Minimum', value: "MIN" },
      { key: 6, text: 'Maximum', value: "MAX" },
    ];
    return <Dropdown   inline options={options} value={field.aggregateFunction} onChange={(e, {value}) => handleFieldChange("aggregateFunction", value)} />;
  }
  function renderFieldWeight() {
    if (!showWeight) return;
    if (!["number", "select", "dropdown"].includes(field.type)) return;

    return <Form.Input
    width={4}
    label="Weight"
    type="number"
    value={field.weight}
    onChange={(e) => handleFieldChange("weight", e.target.value)}
  />
  }
  function renderFieldOptions() {
    if (!getFieldTypeHasOptions(field.type)) 
      return;

    return (
      <Grid>
        <Grid.Row>
          <Grid.Column width={2}>Optoins</Grid.Column>
          {field.type !== "aggregate" && (<>
            <Grid.Column width={3}>Value</Grid.Column>
            {field.type === "select" && <Grid.Column width={3}>Color</Grid.Column>}
            </>
          )}
          {(field.type === "weightedSelect" ||
            field.type === "weightedDropdown") && (
            <Grid.Column width={3}>Weight</Grid.Column>
          )}
          {field.type === "aggregate" && (
            <>
              <Grid.Column width={3}>From</Grid.Column>
              <Grid.Column width={3}>To</Grid.Column>
              <Grid.Column width={3}>Title</Grid.Column>
              <Grid.Column width={3}>Color</Grid.Column>
            </>
          )}
        </Grid.Row>

        {field.options.map((option, optionIndex) => (
          <Grid.Row
            verticalAlign="middle"
            key={optionIndex}
            className="no-padding"
            
          >
            <Grid.Column width={2}>
              <Button
                icon="x"
                circular
                basic
                size="mini"
                onClick={() => removeOption(optionIndex)}
              ></Button>
            </Grid.Column>
            {field.type !== "aggregate" && (
              <>
                <Grid.Column width={3}>
                  <Form.Input
                    key={`option-value-${optionIndex}`}
                    type={
                      field.type === "weightedSelect" ||
                      field.type === "weightedDropdown"
                        ? "number"
                        : "text"
                    }
                    size="mini"
                    value={option.value}
                    
                    onChange={(e) =>
                      handleOptionChange(optionIndex, "value", e.target.value)
                    }
                  />
                </Grid.Column>
                {field.type === "select" &&
                <Grid.Column width={3}>
                  <Dropdown
                    clearable
                    options={[
                      "blue",
                      "green",
                      "red",
                      "teal",
                      "yellow",
                      "brown",
                      "grey",
                      "black",
                    ].map((c, i) => ({ key: i, text: c, value: c }))}
                    selection
                    value={option.color}
                    
                    onChange={(e, d) =>
                      handleOptionChange(optionIndex, "color", d.value)
                    }
                  />
                 
                </Grid.Column>}
              </>
            )}
            {(field.type === "weightedSelect" ||
              field.type === "weightedDropdown") && (
              <Grid.Column width={3}>
                <Form.Input
                  key={`option-weight-${optionIndex}`}
                  type="number"
                  size="mini"
                  value={option.weight}
                  onChange={(e) =>
                    handleOptionChange(optionIndex, "weight", e.target.value)
                  }
                />
              </Grid.Column>
            )}
            {field.type === "aggregate" && (
              <>
                <Grid.Column width={3}>
                  <Form.Input
                    key={`option-valueFrom-${optionIndex}`}
                    type="number"
                    size="mini"
                    value={option.valueFrom}
                    onChange={(e) =>
                      handleOptionChange(
                        optionIndex,
                        "valueFrom",
                        e.target.value
                      )
                    }
                  />
                </Grid.Column>
                <Grid.Column width={3}>
                  <Form.Input
                    key={`option-valueTo-${optionIndex}`}
                    type="number"
                    size="mini"
                    value={option.valueTo}
                    onChange={(e) =>
                      handleOptionChange(optionIndex, "valueTo", e.target.value)
                    }
                  />
                </Grid.Column>
                <Grid.Column width={3}>
                  <Form.Input
                    key={`option-title-${optionIndex}`}
                    type="text"
                    size="mini"
                    value={option.title}
                    onChange={(e) =>
                      handleOptionChange(optionIndex, "title", e.target.value)
                    }
                  />
                </Grid.Column>

                <Grid.Column width={3}>
                  {colorPickerVisible[`${optionIndex}`] && (
                    <BlockPicker
                      key={`option-color-${optionIndex}`}
                      size="mini"
                      color={option.color}
                      onChange={(c) => {
                        handleOptionChange(optionIndex, "color", c.hex);
                        let newObject = { ...colorPickerVisible };
                        newObject[`${optionIndex}`] = false;
                        setColorPickerVisible(newObject);
                      }}
                    />
                  )}
                  {!colorPickerVisible[`${optionIndex}`] && (
                    <Button
                      size="tiny"
                      basic
                      onClick={() => {
                        let newObject = { ...colorPickerVisible };
                        newObject[`${optionIndex}`] = true;
                        setColorPickerVisible(newObject);
                      }}
                    >
                      Color
                    </Button>
                  )}
                </Grid.Column>
              </>
            )}
          </Grid.Row>
        ))}
        <Grid.Row>
          <Grid.Column>
            <Button
              icon="plus"
              circular
              basic
              size="mini"
              color="black"
              onClick={() => addOption()}
            ></Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
  return (
    <>
      <Form size="tiny">
        <Button
          size="mini"
          basic
          icon="x"
          style={{ float: "left" }}
          circular
          onClick={() => onDelete()}
        ></Button>
        <Button
          size="mini"
          basic
          icon="copy"
          style={{ float: "left" }}
          circular
          onClick={() => onDuplicate()}
        ></Button>
        <Form.Group inline>
          {!isRegisterField && (
            <Form.Dropdown
              label="Type"
              value={field.type}
              text={getFieldTypeText(field.type)}
            >
              <Dropdown.Menu>
                {fieldTypes.map((ft) => (
                  <Dropdown.Item
                    key={ft.value}
                    text={ft.text}
                    onClick={() => {
                      const newType = ft.value;
                      let updatedField = { ...field, type: newType };

                      if (ft.hasOptions) {
                        updatedField = {
                          ...updatedField,
                          options: field.options || [],
                        };
                      }
                      setField(updatedField);
                      onChange(updatedField);
                    }}
                  />
                ))}
              </Dropdown.Menu>
            </Form.Dropdown>
          )}
          {field.type != "info" && (
            <Form.Input
              width={8}
              label={isRegisterField ? "Header" : "Prompt"}
              type="text"
              value={field.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              error={fieldErrors.name}
            />
          )}
          {field.type === "info" && (
            <>
              <Form.Field>
                <Radio
                  label="As Form Content"
                  name="radioGroup"
                  value="content"
                  checked={field.as === "content"}
                  onChange={(e, {value }) => handleFieldChange("as", value)}
                />
              </Form.Field>
              <Form.Field>
                <Radio
                  label="As Help"
                  name="radioGroup"
                  value="help"
                  checked={field.as === "help"}
                  onChange={(e, {value }) => handleFieldChange("as", value)}
                />
              </Form.Field>
            </>
          )}
          {renderFieldWeight()}
          {renderFieldAggregateFunction()}
        </Form.Group>
        {field.type == "info" && (
          <div>
            <CKEditor
              editor={ClassicEditor}
              data={field.title}
              onChange={(event, editor) => {
                const data = editor.getData();
                handleFieldChange("title", data);
              }}
            />
          </div>
        )}
        {renderFieldOptions()}
      </Form>
    </>
  );
}

export const fieldTypes = [
  { text: "Text", value: "text" },
  { text: "Wysiwyg", value: "wysiwyg" },
  { text: "Info", value: "info" },
  { text: "Number", value: "number" },
  { text: "Date", value: "date" },
  { text: "Employee", value: "employee" },
  { text: "Multi", value: "multi", hasOptions: true },
  { text: "Select", value: "select", hasOptions: true },
  // { text: "Checkbox", value: "checkbox", hasOptions: true },
  { text: "Dropdown", value: "dropdown", hasOptions: true },
  { text: "Link", value: "link" },
  { text: "Competency", value: "competency" },
  { text: "Aggregate", value: "aggregate", hasOptions: true }, 
  // when there is an aggregate field in a section the following field types can be assigned a weight:
  //  * Number
  //  * Select
  //  * Dropdown
];
