import React, { useEffect, useState } from "react";
import {
  Button,
  Confirm,
  Divider,
  Dropdown,
  Form,
  Grid,
  GridColumn,
  Header,
  Icon,
  Input,
  Item,
  Label,
  List,
  Loader,
  Segment,
  SegmentGroup,
} from "semantic-ui-react";

import "./FormTemplate.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "../components/SortableItem";
import { useParams, useNavigate } from "react-router-dom";
import { onError } from "../lib/errorLib";
import { v4 as uuidv4 } from 'uuid';
import { GenericForm } from "../components/GenericForm";
import { makeApiCall } from "../lib/apiLib";

export default function FormTemplate() {
  const {templateId} = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    async function loadTemplate() {
      return await makeApiCall(
        "GET",
        `/templates/${templateId}`
      );
    }

    async function onLoad() {
      try {
        if (templateId) {
          const item = await loadTemplate();
          const formDef = item.templateDefinition;
          // inject a new guid for each field to use for drag&drop, other attributes can change
          formDef.sections.forEach(section => {
            section.fields.forEach(field => {
              field.guid = uuidv4();
            });
          });
          setTitle(formDef.title);
          setSections(formDef.sections)
        } 

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function handleSubmit() {
    setIsLoading(true);
    try {
      // clear guid as it was only needed for drag&drop
      sections.forEach(section => {
        section.fields.forEach(field => {
          delete field.guid;
        });
      });
      if (templateId) {
        await updateTemplate({title, sections});
      } else {
        await createTemplate({title, sections});
      }
      nav(`/templates`);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function createTemplate(def) {
    return await makeApiCall("POST", `/templates`, {
      templateDefinition: def,
    });
  }

  async function updateTemplate(def) {
    return await makeApiCall(
      "PUT",
      `/templates/${templateId}`,
      {
        templateDefinition: def,
      }
    );
  }


  const [removeFieldConfirm, setRemoveFieldConfirm] = useState({
    open: false,
    sectionIndex: 0,
    fieldIndex: 0,
  });
  const [removeSectionConfirm, setRemoveSectionConfirm] = useState({
    open: false,
    sectionIndex: 0,
  });


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSection = () => {
    setSections([
      ...sections,
      {
        name: "",
        title: "",
        fields: [],
      },
    ]);
  };

  const removeSection = (index) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const addField = (sectionIndex) => {
    const newSections = [...sections];
    const fieldName = `field${sectionIndex + 1}_${
      newSections[sectionIndex].fields.length + 1
    }`;
    newSections[sectionIndex].fields.push({
      name: fieldName,
      title: "What is ... ?",
      type: "text",
      guid: uuidv4()
    });
    setSections(newSections);
  };

  const removeField = (sectionIndex, fieldIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields.splice(fieldIndex, 1);
    setSections(newSections);
  };
  const addOption = (sectionIndex, fieldIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields[fieldIndex].options.push("");
    setSections(newSections);
  };

  const removeOption = (sectionIndex, fieldIndex, optionIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields[fieldIndex].options.splice(optionIndex, 1);
    setSections(newSections);
  };
  function handleDragEnd(sectionIndex, event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const newSections = [...sections];
      const items = newSections[sectionIndex].fields.map((f, i) => f.guid);
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      newSections[sectionIndex].fields = arrayMove(
        newSections[sectionIndex].fields,
        oldIndex,
        newIndex
      );
      setSections(newSections);
    }

  }
  const fieldTypes = [
    { key: "text", text: "Text", value: "text" },
    { key: "number", text: "Number", value: "number" },
    { key: "date", text: "Date", value: "date" },
    { key: "radio", text: "Radio", value: "radio" },
    { key: "select", text: "Select", value: "select" },
    { key: "competency", text: "Competency", value: "competency" },
  ];
  
  function rednerEditor() {
    return  (<>
    <Input
      fluid
      label="Form Title"
      size="large"
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
    <Confirm
      size="mini"
      header="This will delete the section and all the fields in the section."
      open={removeSectionConfirm.open}
      onCancel={() => setRemoveSectionConfirm({ open: false })}
      onConfirm={() => {
        removeSection(removeSectionConfirm.sectionIndex);
        setRemoveSectionConfirm({ open: false });
      }}
    />
    {sections.map((section, sectionIndex) => (
      <Segment key={sectionIndex}>
        <Item>
          <Button
            size="mini"
            basic
            onClick={() =>
              setRemoveSectionConfirm({
                open: true,
                sectionIndex,
              })
            }
          >
            <Icon name="x" />
            Remove Section
          </Button>
          <Input
            label="Section"
            type="text"
            value={section.title}
            onChange={(e) => {
              const newSections = [...sections];
              newSections[sectionIndex].title = e.target.value;
              setSections(newSections);
            }}
          />
        </Item>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(sectionIndex, e)}
        >
          <SortableContext
            items={section.fields.map((f, i) => f.guid)}
            strategy={verticalListSortingStrategy}
          >
            <Item.Group divided>
              <Confirm
                size="mini"
                header="This will delete the field."
                open={removeFieldConfirm.open}
                onCancel={() => setRemoveFieldConfirm({ open: false })}
                onConfirm={() => {
                  removeField(
                    removeFieldConfirm.sectionIndex,
                    removeFieldConfirm.fieldIndex
                  );
                  setRemoveFieldConfirm({ open: false });
                }}
              />
              {section.fields.map((field, fieldIndex) => (
                <Item key={field.guid}>
                  <SortableItem id={field.guid}>
                    <Form key={fieldIndex} className="field" size="tiny">
                      <Form.Group inline>
                        <Button
                          size="mini"
                          basic
                          icon="x"
                          circular
                          onClick={() =>
                            setRemoveFieldConfirm({
                              open: true,
                              sectionIndex,
                              fieldIndex,
                            })
                          }
                        ></Button>

                        <Form.Input
                          label="Field name"
                          type="text"
                          value={field.name}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].fields[
                              fieldIndex
                            ].name = e.target.value;
                            setSections(newSections);
                          }}
                        />
                        <Form.Input
                          label="Question"
                          type="text"
                          value={field.title}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].fields[
                              fieldIndex
                            ].title = e.target.value;
                            setSections(newSections);
                          }}
                        />
                        <Form.Dropdown
                          label="Type"
                          value={field.type}
                          text={field.type}
                        >
                          <Dropdown.Menu>
                            {fieldTypes.map((ft) => (
                              <Dropdown.Item
                                key={ft.key}
                                text={ft.text}
                                onClick={() => {
                                  const newSections = [...sections];
                                  const newType = ft.value;
                                  newSections[sectionIndex].fields[
                                    fieldIndex
                                  ].type = newType;
                                  if (
                                    newType == "radio" ||
                                    newType == "select"
                                  ) {
                                    newSections[sectionIndex].fields[
                                      fieldIndex
                                    ].options =
                                      newSections[sectionIndex].fields[
                                        fieldIndex
                                      ].options || [];
                                  }
                                  setSections(newSections);
                                }}
                              />
                            ))}
                          </Dropdown.Menu>
                        </Form.Dropdown>

                        {(field.type === "radio" ||
                          field.type === "select") && (
                          <>
                            
                            <List>
                            <Item>Options</Item>
                              {field.options.map((option, optionIndex) => (
                                <Form.Input
                                  key={optionIndex}
                                  action={{
                                    icon: "x",
                                    basic: true,
                                    onClick: () =>
                                      removeOption(
                                        sectionIndex,
                                        fieldIndex,
                                        optionIndex
                                      ),
                                  }}
                                  type="text"
                                  size="mini"
                                  value={option}
                                  onChange={(e) => {
                                    const newSections = [...sections];
                                    newSections[sectionIndex].fields[
                                      fieldIndex
                                    ].options[optionIndex] = e.target.value;
                                    setSections(newSections);
                                  }}
                                />
                              ))}
                            
                            <Button
                              icon="plus"
                              circular
                              basic
                              size="mini"
                              onClick={() =>
                                addOption(sectionIndex, fieldIndex)
                              }
                            ></Button>
                            </List>
                          </>
                        )}
                      </Form.Group>
                    </Form>
                  </SortableItem>
                </Item>
              ))}
            </Item.Group>
          </SortableContext>
        </DndContext>
        <Button
          size="mini"
          basic
          color="grey"
          onClick={() => addField(sectionIndex)}
        >
          <Icon name="plus" />
          Add Field
        </Button>
      </Segment>
    ))}
    <Button basic onClick={addSection}>
      <Icon name="plus" />
      Add Section
    </Button>
    <Divider />
    <Button primary onClick={handleSubmit} ><Icon name="save"/>Save</Button>

    </>)
  }

  if (isLoading) return <Loader active />;

  return (
    <Grid stackable>
      <Grid.Column width={8}>
        <Header as="h1" color="blue">
          Editor
        </Header>
        {rednerEditor()}
      </Grid.Column>
      <Grid.Column width={8}>
        <Header as="h1" color="blue">
          Preivew
        </Header>
        <GenericForm  formDef={{title, sections}} />
      </Grid.Column>
    </Grid>
  );
}
