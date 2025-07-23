import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Confirm,
  Divider,
  Icon,
  Input,
  Loader,
  Menu,
  Popup,
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
import TextareaAutosize from 'react-textarea-autosize';
import { v4 as uuidv4 } from 'uuid';
import FieldEditor from "../components/FieldEditor";
import FooterButtons from "../components/FooterButtons";
import { GenericForm } from "../components/GenericForm";
import { SortableItem } from "../components/SortableItem";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import FormRegister from "./FormRegister";
import "./FormTemplate.css";

import { Model } from "survey-core";
import "survey-core/survey-core.min.css";
import { Survey } from "survey-react-ui";
import "survey-creator-core/survey-creator-core.min.css";

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
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [isSurveyjs, setIsSurveyjs] = useState(false);
  const [surveyjsJSON, setSurveyjsJSON] = useState("");
  const [surveyjsModel, setSurveyjsModel] = useState(null);


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

  useEffect(() => {
    if (surveyjsModel) {
      surveyjsModel.readOnly = isFormDisabled;
    }
  }, [surveyjsModel, isFormDisabled]);

  function setFormDef(formDef) {
    
    if (formDef.isSurveyjs) {
      const jsonString =
        typeof formDef.surveyjsJSON === "string"
          ? formDef.surveyjsJSON
          : JSON.stringify(formDef.surveyjsJSON, null, 2);
      setIsSurveyjs(true);
      setTitle(formDef.title);
      setCategory(formDef.category);
      setSurveyjsJSON(jsonString);
      setSurveyjsModel(getSurveyjsModel(jsonString));
    } else {
      setTitle(formDef.title);
      setCategory(formDef.category);
      setSections(formDef.sections);
      setHasSignature(!!formDef.hasSignature);
      setRegisterFields(formDef.registerFields || []);
    }
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
    
    let parsedSurveyJson;

    if (isSurveyjs) {
      const model = getSurveyjsModel(surveyjsJSON); 
      if (!model) {
        throw new Error("Invalid SurveyJS JSON");
      }
      parsedSurveyJson = model.toJSON(); // or JSON.parse(surveyjsJSON);
    }

    const template = isSurveyjs ? {isSurveyjs, title, category, surveyjsJSON: parsedSurveyJson} : {title, category, sections, registerFields, hasSignature};
    try {
      if (templateId) {
        await updateTemplate(template);
      } else {
        await createTemplate(template);
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
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600 mb-1 block">
              Form Title
            </span>
            <Input
              fluid
              size="small"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600 mb-1 block">
              Category
            </span>
            <Input
              fluid
              size="small"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-base"
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
          <div 
            key={`section-${sectionIndex}`}
            className="mb-6 bg-gradient-to-b from-[#fbfcff] via-[#f8faff] to-[#f5f8ff] border-l-4 border-blue-300 rounded-lg shadow-sm hover:border-blue-400 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-center gap-4">
                <Popup
                  content="Delete section"
                  trigger={
                    <button
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={() => setRemoveSectionConfirm({
                        open: true,
                        sectionIndex,
                      })}
                    >
                      <Icon name="x" className="text-gray-500" />
                    </button>
                  }
                  position="top center"
                  size="mini"
                />

                <div className="flex-1">
                  <Input
                    fluid
                    label={
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Section</span>
                        <Icon 
                          name={expandedSections[sectionIndex] ? 'chevron down' : 'chevron right'} 
                          className="cursor-pointer"
                          onClick={() => setExpandedSections(prev => ({
                            ...prev,
                            [sectionIndex]: !prev[sectionIndex]
                          }))}
                        />
                      </div>
                    }
                    className="text-base"
                    type="text"
                    size="small"
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[sectionIndex].title = e.target.value;
                      setSections(newSections);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 min-w-[100px] justify-end">
                  <Checkbox
                    toggle
                    label="Table?"
                    onChange={(e, data) => {
                      const newSections = [...sections];
                      newSections[sectionIndex].isTable = data.checked;
                      newSections[sectionIndex].rows = newSections[sectionIndex].rows || [];
                      setSections(newSections);
                    }}
                    checked={section.isTable}
                  />

                  <div className="flex w-[60px] justify-end">
                    {sectionIndex > 0 && (
                      <Popup
                        content="Move section up"
                        trigger={
                          <button
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => moveSectionUp(sectionIndex)}
                          >
                            <Icon name="chevron up" className="text-gray-500" />
                          </button>
                        }
                        position="top center"
                        size="mini"
                      />
                    )}
                    {sectionIndex < sections.length - 1 && (
                      <Popup
                        content="Move section down"
                        trigger={
                          <button
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => moveSectionDown(sectionIndex)}
                          >
                            <Icon name="chevron down" className="text-gray-500" />
                          </button>
                        }
                        position="top center"
                        size="mini"
                      />
                    )}
                  </div>
                </div>
              </div>

              {expandedSections[sectionIndex] && (
                <>
                  <Divider hidden />
                  {!section.isTable && (
                    <div className="mb-4 flex items-center gap-4 mt-4">
                      <span className="text-sm text-gray-600">Number of columns:</span>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(num => (
                          <button
                            key={num}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${
                              section.sectionColumns === num 
                                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => setSectionColumn(sectionIndex, num)}
                          >
                            {num === 1 ? 'One' : num === 2 ? 'Two' : 'Three'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
            </div>
          </div>
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
  const getSurveyjsModel = (input) => {
    try {
      const parsedJSON = JSON.parse(input);
      return new Model(parsedJSON);
    } catch (err) {
      return null;
    }
  }
  function renderSurveyjsDesigner() {
    return (
      <Segment
        style={{
          borderLeft: "5px solid #2185d0",
          background:
            "linear-gradient(to bottom, #fafcff 0%, #f7faff 50%, #f3f8ff 100%)",
        }}
      >
        
        <div className="mb-2">
            <span className="text-sm font-medium text-gray-600 mb-1 block">
              Form Title 
            </span>
            <Input
              readOnly // it is read from surveyjs json
              fluid
              size="small"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600 mb-1 block">
              Category
            </span>
            <Input
              fluid
              size="small"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-base"
            />
          </div>

        <span className="text-sm font-medium text-gray-600 mb-1 block">
          Surveyjs JSON
        </span>
        <TextareaAutosize
          value={surveyjsJSON}
          style={{
            width: "100%",
            fontSize: "14px",
            padding: "8px",
            boxSizing: "border-box",
          }}
          maxRows="40"
          onChange={(e) => {
            const json = e.target.value;
            setSurveyjsJSON(json);

            let survey = getSurveyjsModel(json);
            if (survey) { // it means the json is in good surveyjs format
              setTitle(survey.toJSON().title);
            }
            setSurveyjsModel(survey);
          }}
          minRows={10}
          rows={100}
          cols={80}
        />
      </Segment>
    );
  }


  
function renderFormBuilder() {
  return <>
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
        {isRawEditing && (
          <>
            <TextareaAutosize
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              cols={40}
            />
            <Divider hidden />
            <Button onClick={handleRawEdit} color="green" icon="check circle" />
          </>
        )}
        <Segment attached="bottom">
          {activeDesigner === "form designer"
            ? renderFormDesigner()
            : rednerRegisterDesigner()}
        </Segment>
        {templateId && (
          <div class="border border-gray-300 bg-gray-100 p-4 rounded m-1">
            <Icon name="warning" color="olive" />
            When a form is updated, a new version gets created. This new version
            will be used for the new records. All the existing records will
            continue to use the old version.
          </div>
        )}
  </>
}


  if (isLoading) return <Loader active />;



  return (
    <div className="flex flex-col lg:flex-row gap-6">
  {/* Left Column */}
  <div className="w-full lg:w-5/12">
    <div className="mb-4">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="toggle-checkbox"
          checked={isSurveyjs}
          onChange={(e) => setIsSurveyjs(e.target.checked)}
        />
        <span className="text-gray-700 font-medium">JSON Editor</span>
      </label>
    </div>
    {isSurveyjs ? renderSurveyjsDesigner() : renderFormBuilder()}
    <FooterButtons
          rightButton={{
            label: "Save",
            color: "blue",
            onClick: () => handleSubmit(),
            icon: "save",
          }}
          leftButton={
            templateId &&
            canDeleteTemplate() && {
              label: "Delete Form",
              color: "red",
              onClick: () => setDeleteConfirmOpen(true),
              icon: "remove circle",
            }
          }
        />

        <Confirm
          size="mini"
          header="This will delete the form."
          content="The existing records are fine but no new records of this form can be created. Are you sure?"
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
        />
  </div>

  {/* Right Column */}
  <div className="w-full lg:w-7/12">
    <h3 className="text-teal-600 text-xl font-semibold mb-2">Form Preview</h3>

    <div className="flex justify-between items-center mt-4 mb-4">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="toggle-checkbox"
          checked={isFormDisabled}
          onChange={(e) => setIsFormDisabled(e.target.checked)}
        />
        <span className="text-gray-700 font-medium">Record View</span>
      </label>
    </div>

    {isSurveyjs ? (
      <div className="w-full min-h-[500px] overflow-auto border border-gray-300 mt-5 shadow-lg rounded-2xl p-4 bg-white">
        {surveyjsModel ? (
          <Survey model={surveyjsModel} />
        ) : (
          <div className="text-red-600">Invalid or incomplete JSON</div>
        )}
      </div>
    ) : (
      <GenericForm
        formDef={{ title, category, sections, hasSignature }}
        users={users}
        disabled={isFormDisabled}
      />
    )}

    {!isSurveyjs && (
      <>
        <hr className="my-6 border-gray-300" />
        <h3 className="text-teal-600 text-xl font-semibold mb-2">
          Register Preview
        </h3>

        <FormRegister
          formDefInput={{ title, category, sections, registerFields }}
          formsInput={[]}
          isPreview={true}
        />
      </>
    )}
  </div>
</div>

  )
}
