import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Confirm,
  Divider,
  Grid,
  GridRow, Header,
  Icon,
  Input,
  Item, Loader,
  Segment
} from "semantic-ui-react";

import {
  closestCenter, DndContext, KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import FieldEditor from "../components/FieldEditor";
import { GenericForm } from "../components/GenericForm";
import { SortableItem } from "../components/SortableItem";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import "./FormTemplate.css";

export default function FormTemplate() {
  const {templateId} = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
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
          setTitle(formDef.title);
          setCategory(formDef.category);
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
      if (templateId) {
        await updateTemplate({title, category, sections});
      } else {
        await createTemplate({title, category, sections});
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
        category: "",
        sectionColumns: 1,
        fields: [],
      },
    ]);
  };

  const removeSection = (index) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const moveSection = (currentIndex, newIndex) => {
    const sectionsCopy = [...sections];
    
    // Remove the section from the current index
    const [removedSection] = sectionsCopy.splice(currentIndex, 1);
    
    // Insert the removed section at the new index
    sectionsCopy.splice(newIndex, 0, removedSection);
    
    setSections(sectionsCopy);
  };

  const moveSectionUp = (index) => {
    if (index > 0) {
      moveSection(index, index - 1);
    }
  };
  
  const moveSectionDown = (index) => {
    if (index < sections.length - 1) {
      moveSection(index, index + 1);
    }
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
  function setSectionColumn(sectionIndex, sectionColumns) {
    const newSections = [...sections];
    newSections[sectionIndex].sectionColumns = sectionColumns;
    setSections(newSections);
  }

  function renderEditor() {
    return (
      <>
        <Input
          fluid
          label="Form Title"
          size="small"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Divider hidden />
        <Input
          fluid
          label="Category"
          size="small"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          <Segment key={`section-${sectionIndex}`}>
            <Item>
              <Grid>
                <GridRow>
                  <Grid.Column width={1} verticalAlign="middle">
                    <Button
                      size="mini"
                      basic
                      circular
                      onClick={() =>
                        setRemoveSectionConfirm({
                          open: true,
                          sectionIndex,
                        })
                      }
                      style={{ float: "left" }}
                      icon="x"
                    ></Button>
                  </Grid.Column>
                  <Grid.Column width={10} verticalAlign="middle">
                    <Input
                      fluid
                      label="Section"
                      type="text"
                      size="small"
                      value={section.title}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].title = e.target.value;
                        setSections(newSections);
                      }}
                    />
                  </Grid.Column>
                  <Grid.Column width={3} textAlign="left" verticalAlign="middle">
                    
                    <Checkbox
                      toggle
                      label="Table?"
                      onChange={(e, data) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].isTable = data.checked;
                        newSections[sectionIndex].rows =
                          newSections[sectionIndex].rows || [];
                        setSections(newSections);
                      }}
                      checked={section.isTable}
                    />

                </Grid.Column>
                </GridRow>
                {!section.isTable && 
                <Grid.Row >
                  <Grid.Column width={1} ></Grid.Column>
                  <Grid.Column width={10} >
                  <Button.Group size="mini" >
                    <Button color={section.sectionColumns == 1 ? "black" :"grey"} onClick={() => setSectionColumn(sectionIndex, 1)}>Single Column</Button>
                    <Button color={section.sectionColumns == 2 ? "black" :"grey"} onClick={() => setSectionColumn(sectionIndex, 2)}>Two Columns</Button>
                    <Button color={section.sectionColumns == 3 ? "black" :"grey"} onClick={() => setSectionColumn(sectionIndex, 3)}>Three Columns</Button>
                  </Button.Group>
                  </Grid.Column>
                  <Grid.Column width={5} textAlign="right">
                  {sectionIndex > 0 && <Button size="mini" basic circular onClick={() =>moveSectionUp(sectionIndex)} icon="chevron up"></Button>}
                  {sectionIndex < sections.length - 1 && <Button size="mini" basic circular onClick={() =>moveSectionDown(sectionIndex)} icon="chevron down"></Button>}
                  </Grid.Column>
                </Grid.Row>
                } 
                {section.isTable && (
                  <>
                    <Grid.Row>
                      <Grid.Column width={1}>Rows</Grid.Column>
                      <Grid.Column width={13}>Text</Grid.Column>
                    </Grid.Row>
                    {section.rows.map((row, rowIndex) => (
                      <Grid.Row key={rowIndex}>
                        <Grid.Column width={1}>
                          <Button
                            icon="x"
                            circular
                            basic
                            size="mini"
                            onClick={() => {
                              const newSections = [...sections];
                              const newRows = newSections[
                                sectionIndex
                              ].rows.filter((_, index) => index !== rowIndex);
                              newSections[sectionIndex].rows = newRows;
                              setSections(newSections);
                            }}
                          ></Button>
                        </Grid.Column>
                        <Grid.Column width={13}>
                          <Input
                            type="text"
                            size="mini"
                            fluid
                            width={8}
                            value={row.value}
                            onChange={(e) => {
                              const newSections = [...sections];
                              const newRows = newSections[sectionIndex].rows;
                              newRows[rowIndex].value = e.target.value;
                              newSections[sectionIndex].rows = newRows;
                              setSections(newSections);
                            }}
                          />
                        </Grid.Column>
                      </Grid.Row>
                    ))}
                    <Grid.Row key="row4">
                      <Grid.Column>
                        <Button
                          icon="plus"
                          circular
                          basic
                          size="mini"
                          color="black"
                          onClick={() => {
                            const newSections = [...sections];
                            newSections[sectionIndex].rows.push({ value: "" });
                            setSections(newSections);
                          }}
                        ></Button>
                      </Grid.Column>
                    </Grid.Row>
                  </>
                )}
              </Grid>
            </Item>
            <Divider hidden />

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(sectionIndex, e)}
                >
                  <SortableContext
                    items={section.fields.map((f, i) => f.guid )}
                    strategy={verticalListSortingStrategy}
                  >
                    <>
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
                        <div key={field.guid}>
                          <SortableItem id={field.guid}>
                            <FieldEditor
                              key={fieldIndex}
                              value={field}
                              onDelete={() =>
                                setRemoveFieldConfirm({
                                  open: true,
                                  sectionIndex,
                                  fieldIndex,
                                })
                              }
                              onChange={(value) => {
                                const newSections = [...sections];
                                newSections[sectionIndex].fields[fieldIndex] =
                                  value;
                                setSections(newSections);
                              }}
                              onDuplicate={() => {
                                const newSections = [...sections];

                                const duplicatedField = {
                                  ...field,
                                  title: `${field.title} copy`,
                                  name: `${field.name} copy`,
                                  guid: uuidv4(),
                                };
                                newSections[sectionIndex].fields.push(
                                  duplicatedField
                                );
                                setSections(newSections);
                              }}
                            />
                            <Divider />
                          </SortableItem>
                        </div>
                      ))}
                    </>
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
        <Button primary onClick={handleSubmit}>
          <Icon name="save" />
          Save
        </Button>
      </>
    );

  }

  if (isLoading) return <Loader active />;

  return (
    <Grid stackable>
      <Grid.Column width={7}>
        <Header as="h1" color="blue">
          Designer
        </Header>
        {renderEditor()}
      </Grid.Column>
      <Grid.Column width={9}>
        <Header as="h1" color="teal">
          Preview
        </Header>
        <GenericForm formDef={{ title, category, sections }} />
      </Grid.Column>
    </Grid>
  );
}
