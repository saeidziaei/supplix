import React, { useState } from "react";
import { Button, Dropdown, Form, Grid, Input, Item, List, Table } from "semantic-ui-react";
import { BlockPicker } from "react-color";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";


export default function FieldEditor({ value, onChange, onDelete, onDuplicate }) {
  const [field, setField] = useState(value);
  const [colorPickerVisible, setColorPickerVisible] = useState({})

  function handleFieldChange(element, value) {
    const updatedField = { ...field, [element]: value };
    setField(updatedField);
    onChange(updatedField);
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
  function renderFieldOptions() {
    return (
      <Grid  >
        <Grid.Row >
          <Grid.Column width={2}>Optoins</Grid.Column>
          {field.type !== "aggregate" && (
            <Grid.Column width={3}>Value</Grid.Column>
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
          

          <Grid.Row verticalAlign="middle"
            key={optionIndex}
            className="no-padding"
            style={{ backgroundColor: `${option.color}` }}
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
                  {colorPickerVisible[`${optionIndex}`] && 
                    <BlockPicker
                      key={`option-color-${optionIndex}`}
                      size="mini"
                      color={option.color}
                      onChange={(c) => {
                        handleOptionChange(optionIndex, "color", c.hex);
                        let newObject = {...colorPickerVisible};
                        newObject[`${optionIndex}`] = false;
                        setColorPickerVisible(newObject);
                      }}
                    />
                  }
                  {!colorPickerVisible[`${optionIndex}`] && (
                    <Button
                      size="tiny"
                      basic
                      onClick={() => {
                        let newObject = {...colorPickerVisible};
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

          {field.type != "info" && (
            <Form.Input
              width={8}
              label="Prompt"
              type="text"
              value={field.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
          )}
          {field.type == "info" && (
            <div style={{width: "70%"}}>
            <CKEditor
              editor={ClassicEditor}
              data={field.title}
              onChange={(event, editor) => {
                const data = editor.getData();
                handleFieldChange("title", data)
              }}
            /></div>
          )}
          {/* <Form.Input
            width={8}
            label="Question"
            type="text"
            value={field.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
          /> */}
        </Form.Group>
        {getFieldTypeHasOptions(field.type) && renderFieldOptions()}
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
  { text: "Multi", value: "multi", hasOptions: true },
  { text: "Select", value: "select", hasOptions: true },
  { text: "Select (Weighted)", value: "weightedSelect", hasOptions: true },
  { text: "Dropdown", value: "dropdown", hasOptions: true },
  { text: "Dropdown (Weighted)", value: "weightedDropdown", hasOptions: true },
  { text: "Competency", value: "competency" },
  { text: "Aggregate", value: "aggregate", hasOptions: true },
];
