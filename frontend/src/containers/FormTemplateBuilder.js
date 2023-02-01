import React, { useState } from "react"
import { Button, Divider, Dropdown, Form, Grid, GridColumn, Header, Icon, Input, Label, List, Segment, SegmentGroup } from "semantic-ui-react";
import { GenericFormComponent } from "./GenericForm";
import "./FormTemplateBuilder.css"
import { DndContext,closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "../components/SortableItem";

export default function FormTemplateBuilder() { 
    const formDef= {
        title: "Project Tender",
        keyAttributes: ["client"],
        sections: [
          {
            name: "project",
            title: "Project",
            fields: [{ name: "project", title: "Project", type: "text" }],
          },
          {
            name: "tender",
            title: "Tender",
            fields: [
              { name: "client", title: "Client/ Organisation", type: "text" },
              { name: "tenderCode", title: "Tender Code", type: "text" },
              { name: "dollarValue", title: "$ Value", type: "number" },
              { name: "dateSubmitted2", title: "Date Submitted", type: "date" },
              { name: "dateFollowup", title: "Date Follow up", type: "date" },
              {
                name: "status",
                title: "Status",
                type: "radio",
                options: ["Won", "Lost", "-"],
              },
              { name: "notes", title: "Notes", type: "text" },
            ],
          },
        ],
      };
    
  const [title, setTitle] = useState(formDef.title);
  
  const [sections, setSections] = useState(formDef.sections);

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
    const fieldName = `field${sectionIndex + 1}.${newSections[sectionIndex].fields.length + 1}`;
    newSections[sectionIndex].fields.push({
      name: fieldName,
      title: "What is ... ?",
      type: "text",
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
        const items = newSections[sectionIndex].fields.map((f) => f.name);
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        newSections[sectionIndex].fields = arrayMove(newSections[sectionIndex].fields, oldIndex, newIndex);
        setSections(newSections);
    }
    //   setItems((items) => {
    //     const oldIndex = items.indexOf(active.id);
    //     const newIndex = items.indexOf(over.id);

    //     return arrayMove(items, oldIndex, newIndex);
    //   });
    // }
  }
  const fieldTypes = [
    { key: 'text', text: 'Text', value: 'text' },
    { key: 'number', text: 'Number', value: 'number' },
    { key: 'date', text: 'Date', value: 'date' },
    { key: 'radio', text: 'Radio', value: 'radio' },
    { key: 'select', text: 'Select', value: 'select' },
  ];
  return (
    <>
      <Segment>
        <Input
          label="Form Title"
          size="large"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {sections.map((section, sectionIndex) => (
          <Segment key={sectionIndex}>
            <Button
              size="mini"
              basic
              onClick={() => removeSection(sectionIndex)}
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
            <SegmentGroup>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(sectionIndex, e)}
              >
                <SortableContext
                  items={section.fields.map(f => f.name)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.fields.map((field, fieldIndex) => (
                   <SortableItem key={field.name} id={field.name}>
                      <Segment  key={field.name} className="field">
                        
                        <List horizontal>
                          <List.Item>
                            <Form size="tiny">
                              <Form.Group inline>
                                <Button
                                  size="mini"
                                  basic
                                  icon="x"
                                  circular
                                  onClick={() =>
                                    removeField(sectionIndex, fieldIndex)
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
                              </Form.Group>
                            </Form>
                          </List.Item>

                          {(field.type === "radio" ||
                            field.type === "select") && (
                            <List.Item style={{ verticalAlign: "top" }}>
                              <Label>Options</Label>
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
                            </List.Item>
                          )}
                        </List> 
                      </Segment>
                   </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </SegmentGroup>
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
      </Segment>
      <Header as="h1" color="blue">
        Preivew
      </Header>
      {GenericFormComponent({ title: title, sections: sections })}
    </>
  );
  };
  
  
