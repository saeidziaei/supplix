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
  Menu,
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
import FormRegister from "./FormRegister";
import { useAppContext } from "../lib/contextLib";
import TextareaAutosize from 'react-textarea-autosize';
import FooterButtons from "../components/FooterButtons";

export default function FormTemplate() {
  const {templateId} = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const nav = useNavigate();
  const { currentUserRoles, users } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [sections, setSections] = useState([]);
  const [registerFields, setRegisterFields] = useState([]);
  const [hasSignature, setHasSignature] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState("form designer");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [jsonInput, setJsonInput] = useState('');
  const [isRawEditing, setIsRawEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});


  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
      setIsRawEditing(!isRawEditing);
      setJsonInput(JSON.stringify({title, category, sections, hasSignature, registerFields}, null, 2));
    }
  });
  const handleRawEdit = () => {
    try {
      setFormDef(JSON.parse(jsonInput));
      setIsRawEditing(false);
    } catch (e) {
      onError(e);
    }
  }

  const handleMenuClick = (e, { name }) => setActiveDesigner(name);

  const canDeleteTemplate = () => isAdmin;

  useEffect(() => {
    async function loadTemplate() {
      return await makeApiCall("GET", `/templates/${templateId}`);
    }

    async function onLoad() {
      try {
        if (templateId) {
          const item = await loadTemplate();
          const formDef = item.templateDefinition;
          setFormDef(formDef);
        } 

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);
  function setFormDef(formDef) {
    setTitle(formDef.title);
    setCategory(formDef.category);
    setSections(formDef.sections);
    setHasSignature(!!formDef.hasSignature);
    setRegisterFields(formDef.registerFields || []);
  }

  async function deleteTemplate() {
    return await makeApiCall("DELETE", `/templates/${templateId}`);
  }
  async function handleDelete() {
    try {
      setIsLoading(true);
      setDeleteConfirmOpen(false);
      await deleteTemplate();
      nav(`/templates`);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function handleSubmit() {
    setIsLoading(true);
    try {
      if (templateId) {
        await updateTemplate({title, category, sections, registerFields, hasSignature});
      } else {
        await createTemplate({title, category, sections, registerFields, hasSignature});
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
  const [removeRFieldConfirm, setRemoveRFieldConfirm] = useState({
    open: false,
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
      title: "",
      type: "text",
      guid: uuidv4()
    });
    setSections(newSections);
  };
  const addRField = () => {
    let newFields = [...registerFields];
    const fieldName = `field${newFields.length + 1}`;
    newFields.push({
      name: fieldName,
      guid: uuidv4()
    });
    setRegisterFields(newFields);
  };

  const removeField = (sectionIndex, fieldIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields.splice(fieldIndex, 1);
    setSections(newSections);
  };
  const removeRField = (fieldIndex) => {
    let newFields = [...registerFields];
    newFields.splice(fieldIndex, 1);
    setRegisterFields(newFields);
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
  function handleRDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      let newFields = [...registerFields];
      const guids = newFields.map(f => f.guid); 
      const oldIndex = guids.indexOf(active.id);
      const newIndex = guids.indexOf(over.id);

      newFields = arrayMove(newFields, oldIndex, newIndex);
      setRegisterFields(newFields);
    }
  }
  function setSectionColumn(sectionIndex, sectionColumns) {
    const newSections = [...sections];
    newSections[sectionIndex].sectionColumns = sectionColumns;
    setSections(newSections);
  }
  function rednerRegisterDesigner() {
    return (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleRDragEnd(e)}
        >
          <SortableContext
            items={registerFields.map((f, i) => f.guid)}
            strategy={verticalListSortingStrategy}
          >
            <>
              <Confirm
                size="mini"
                header="This will delete the field."
                open={removeRFieldConfirm.open}
                onCancel={() => setRemoveRFieldConfirm({ open: false })}
                onConfirm={() => {
                  removeRField(
                    removeRFieldConfirm.fieldIndex
                  );
                  setRemoveRFieldConfirm({ open: false });
                }}
              />
              {registerFields.map((field, fieldIndex) => (
                <div key={field.guid}>
                  <SortableItem id={field.guid}>
                    <FieldEditor
                      key={fieldIndex}
                      value={field}
                      isRegisterField={true}
                      onDelete={() =>
                        setRemoveRFieldConfirm({
                          open: true,
                          fieldIndex,
                        })
                      }
                      onChange={(value) => {
                        let newFields = [...registerFields];
                        newFields[fieldIndex] = value;
                        setRegisterFields(newFields);
                      }}
                      onDuplicate={() => {
                        let newFields = [...registerFields];

                        const duplicatedField = {
                          ...field,
                          title: `${field.title} copy`,
                          name: `${field.name} copy`,
                          guid: uuidv4(),
                        };
                        newFields.push(duplicatedField);
                        setRegisterFields(newFields);
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
          onClick={() => addRField()}
        >
          <Icon name="plus" />
          Field
        </Button>
      </>
    );

  }

  function renderFormDesigner() {
    return (
      <>
        <Segment 
          style={{ 
            borderLeft: '5px solid #2185d0',
            background: 'linear-gradient(to bottom, #fafcff 0%, #f7faff 50%, #f3f8ff 100%)'
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <span style={{ 
              fontSize: '1.1em', 
              fontWeight: '300',
              color: '#666',
              display: 'block',
              marginBottom: '4px'
            }}>
              Form Title
            </span>
            <Input
              fluid
              size="small"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #e6f0ff',
                borderRadius: '4px',
                padding: '4px'
              }}
            />
          </div>
          <Divider hidden />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ 
              fontSize: '1.1em', 
              fontWeight: '300',
              color: '#666',
              display: 'block',
              marginBottom: '4px'
            }}>
              Category
            </span>
            <Input
              fluid
              size="small"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #e6f0ff',
                borderRadius: '4px',
                padding: '4px'
              }}
            />
          </div>
        </Segment>
        <Divider hidden />
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
          <Segment 
            key={`section-${sectionIndex}`}
            style={{ 
              borderLeft: '3px solid #cce4ff',
              background: 'linear-gradient(to bottom, #fbfcff 0%, #f8faff 50%, #f5f8ff 100%)'
            }}
          >
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
                    />
                  </Grid.Column>
                  <Grid.Column width={10} verticalAlign="middle">
                    <Input
                      fluid
                      label={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '10px' }}>Section</span>
                          <Icon 
                            name={expandedSections[sectionIndex] ? 'chevron down' : 'chevron right'} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setExpandedSections(prev => ({
                              ...prev,
                              [sectionIndex]: !prev[sectionIndex]
                            }))}
                          />
                        </div>
                      }
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
                  <Grid.Column
                    width={3}
                    textAlign="left"
                    verticalAlign="middle"
                  >
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
                {!section.isTable && (
                  <Grid.Row>
                    <Grid.Column width={1}></Grid.Column>
                    <Grid.Column width={13}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <span style={{ 
                          fontSize: '0.85em', 
                          fontWeight: '300',
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          Number of columns:
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="tiny"
                            compact
                            style={{
                              backgroundColor: section.sectionColumns === 1 ? '#e6f2ff' : 'white',
                              color: section.sectionColumns === 1 ? '#2185d0' : '#666',
                              border: `1px solid ${section.sectionColumns === 1 ? '#2185d0' : '#ddd'}`,
                              boxShadow: section.sectionColumns === 1 ? '0 2px 4px rgba(33, 133, 208, 0.1)' : 'none',
                              transition: 'all 0.2s ease',
                              padding: '4px 8px',
                              fontWeight: '400',
                              height: '24px'
                            }}
                            onClick={() => setSectionColumn(sectionIndex, 1)}
                          >
                            One
                          </Button>
                          <Button
                            size="tiny"
                            compact
                            style={{
                              backgroundColor: section.sectionColumns === 2 ? '#e6f2ff' : 'white',
                              color: section.sectionColumns === 2 ? '#2185d0' : '#666',
                              border: `1px solid ${section.sectionColumns === 2 ? '#2185d0' : '#ddd'}`,
                              boxShadow: section.sectionColumns === 2 ? '0 2px 4px rgba(33, 133, 208, 0.1)' : 'none',
                              transition: 'all 0.2s ease',
                              padding: '4px 8px',
                              fontWeight: '400',
                              height: '24px'
                            }}
                            onClick={() => setSectionColumn(sectionIndex, 2)}
                          >
                            Two
                          </Button>
                          <Button
                            size="tiny"
                            compact
                            style={{
                              backgroundColor: section.sectionColumns === 3 ? '#e6f2ff' : 'white',
                              color: section.sectionColumns === 3 ? '#2185d0' : '#666',
                              border: `1px solid ${section.sectionColumns === 3 ? '#2185d0' : '#ddd'}`,
                              boxShadow: section.sectionColumns === 3 ? '0 2px 4px rgba(33, 133, 208, 0.1)' : 'none',
                              transition: 'all 0.2s ease',
                              padding: '4px 8px',
                              fontWeight: '400',
                              height: '24px'
                            }}
                            onClick={() => setSectionColumn(sectionIndex, 3)}
                          >
                            Three
                          </Button>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                          {sectionIndex > 0 && (
                            <Button
                              basic
                              circular
                              size="tiny"
                              compact
                              
                              onClick={() => moveSectionUp(sectionIndex)}
                              icon="chevron up"
                            />
                          )}
                          {sectionIndex < sections.length - 1 && (
                            <Button
                            basic
                            circular
                              size="tiny"
                              compact
                              
                              onClick={() => moveSectionDown(sectionIndex)}
                              icon="chevron down"
                            />
                          )}
                        </div>
                      </div>
                    </Grid.Column>
                  </Grid.Row>
                )}
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
            
            {expandedSections[sectionIndex] && (
              <>
                <Divider hidden />
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(sectionIndex, e)}
                >
                  <SortableContext
                    items={section.fields.map((f, i) => f.guid)}
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
                              showWeight={section.fields.some(
                                (f) => f.type === "aggregate"
                              )} // only show weight if there is an aggregate field in this seciton
                              showAggregateFunction={section.isTable}
                            />
                            <Divider />
                          </SortableItem>
                        </div>
                      ))}
                    </>
                  </SortableContext>
                </DndContext>
                <Button size="mini" basic color="blue" onClick={() => addField(sectionIndex)}>
                  <Icon name="plus" />
                  Field
                </Button>
              </>
            )}
          </Segment>
        ))}
        <Button size="mini" basic color="blue" onClick={addSection}>
          <Icon name="plus" />
          Section
        </Button>
        <Divider />
        <Checkbox
          toggle
          label="Needs Signature"
          onChange={(e, data) => {
            setHasSignature(data.checked);
          }}
          checked={hasSignature}
        />
      </>
    );

  }

  

  if (isLoading) return <Loader active />;

  return (
    <Grid stackable>
      <Grid.Column width={7}>
        <Menu tabular attached="top">
          <Menu.Item
            name="form designer"
            active={activeDesigner === "form designer"}
            onClick={handleMenuClick}
          />
          <Menu.Item
            name="register designer"
            active={activeDesigner === "register designer"}
            onClick={handleMenuClick}
          />
        </Menu>
        {isRawEditing && (<>
         
          <TextareaAutosize
          
            value={jsonInput} 
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            cols={40}
          />
          <Divider hidden />
          <Button onClick={handleRawEdit}  color="green" icon="check circle" /></>
        )}
        <Segment attached="bottom">
          {activeDesigner == "form designer"
            ? renderFormDesigner()
            : rednerRegisterDesigner()}
        </Segment>
        {templateId && <div class="border border-gray-300 bg-gray-100 p-4 rounded m-1">
  <Icon name="warning" color="olive"/>
  When a form is updated, a new version gets created. This new version will be used for the new records. All the existing records will continue to use the old version.
</div>}

<FooterButtons rightButton={{label: "Save", color: "blue", onClick:() => handleSubmit(), icon: "save"}}
leftButton={templateId && canDeleteTemplate() && {label: "Delete Form", color: "red", onClick:() => setDeleteConfirmOpen(true), icon: "remove circle"}}
 />


        <Confirm
          size="mini"
          header="This will delete the form."
          content="The existing records are fine but no new records of this form can be created. Are you sure?"
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
        />
       
      </Grid.Column>
      <Grid.Column width={9}>
        <Header as="h3" color="teal">
          Form Preview
        </Header>
        <GenericForm formDef={{ title, category, sections, hasSignature }} users={users} />
        <Divider />
        <Header as="h3" color="teal">
          Register Preview
        </Header>

        <FormRegister
          formDefInput={{ title, category, sections, registerFields }}
          formsInput={[]}
          isPreview={true}
        />
      </Grid.Column>
    </Grid>
  );
}
