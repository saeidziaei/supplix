import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import {
  Button, Card,
  Divider,
  Grid,
  Header,
  Icon,
  List,
  Loader,
  Message,
  Segment
} from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormTemplateSettings from "./FormTemplateSettings";
import "./FormTemplates.css";
import pluralize from "pluralize";
import FooterButtons from "../components/FooterButtons";


export default function FormTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templateSettingsVisible, setTemplateSettingsVisible] = useState(false);
  const [savedSettings, setSavedSettings] = useState({});

  const handleTemplateSettingsSave = (settings) => {
    // Save the settings to your preferred storage (e.g., API, localStorage)
    // For now, we'll just update the state for demonstration purposes.
    setSavedSettings(settings);
    setTemplateSettingsVisible(false);
  };

  useEffect(() => {
    async function onLoad() {
      try {
        const templates = await loadTemplates();
        setTemplates(templates);

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadTemplates() {
    return await makeApiCall("GET", `/templates`);
  }
  function renderTemplate(t) {
    const td = t.templateDefinition;
    let fieldCount = 0;
    if (td && td.sections) 
      td.sections.forEach(s => fieldCount += s.fields.length);

    return <a href={`/template/${t.templateId}`}
    class="bg-gray-100 col-span-6 md:col-span-1 text-black border-l-8 border-teal-500 rounded-md px-3 py-2 w-full md:w-5/12 lg:w-3/12">
    {td.title}

    <div class="text-gray-500 font-thin text-sm pt-1">
        <span>{`${fieldCount} ${pluralize("field", fieldCount)}`}</span>
    </div>
</a>

    
  }



  if (isLoading) return <Loader active />;
  const groupedChildren =
  !templates || templates.length == 0
    ? []
    : templates.reduce((result, child) => {
        const group = result.find(
          (group) => group[0].templateDefinition.category === child.templateDefinition.category
        );

        if (group) {
          group.push(child);
        } else {
          result.push([child]);
        }

        return result;
      }, []);

  return (
    <>
      <FormHeader heading="Forms" />
      {templates && templates.length > 0 && (
        <>
          <div className="mx-auto px-4 w-full  xl:w-2/3">
            {groupedChildren &&
              groupedChildren.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <Divider horizontal>
                    <Header as="h4">
                      {group[0].templateDefinition.category || "-"}
                    </Header>
                  </Divider>
                  <div className="flex flex-wrap gap-4 p-6 justify-left text-lg ">
                    {group && group.map((t) => renderTemplate(t))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {templates.length == 0 && (
        <Message
          header="No Record found"
          content="Start by creating your first record!"
          icon="exclamation"
        />
      )}
      <FooterButtons rightButton={{label: "Design New Form", icon:"pencil", link:"/template"}} />



      {/* <Divider />
       <Button basic onClick={() => setTemplateSettingsVisible(true)}>
        Template Settings
      </Button> 
      {templateSettingsVisible && (
        <FormTemplateSettings templates={templates} onSave={handleTemplateSettingsSave} />
      )} */}
    </>
  );
}
