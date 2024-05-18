import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { Loader, Message } from "semantic-ui-react";
import FooterButtons from "../components/FooterButtons";
import FormHeader from "../components/FormHeader";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import "./FormTemplates.css";

export default function FormTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templateSettingsVisible, setTemplateSettingsVisible] = useState(false);
  const [savedSettings, setSavedSettings] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("ALL");

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
  function renderCategories() {
    if (templates && templates.length) {
      let categories = ["ALL"].concat([
        ...new Set(templates.map((t) => t.templateDefinition.category)),
      ]);

      return (
        <div className="flex flex-wrap mt-2">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-md p-3 m-1 bg-teal-50 text-green-700 hover:bg-slate-300 ${
                category === selectedCategory && "!bg-green-700 !text-white !font-bold"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      );
    }
  }
  function renderTemplate(t) {
    const td = t.templateDefinition;
    let fieldCount = 0;
    if (td && td.sections)
      td.sections.forEach((s) => (fieldCount += s.fields.length));

    return (
      <a
        href={`/template/${t.templateId}`}
        className="bg-gray-100 col-span-6 md:col-span-1 text-black border-l-8 border-green-700 rounded-md px-3 py-2 sm:hover:shadow-2xl"
      >
        {td.title}

        <div className="text-gray-500 font-thin text-sm pt-1">
          <span>{`${fieldCount} ${pluralize("field", fieldCount)}`}</span>
        </div>
        <div className="text-gray-500 font-thin text-sm pt-1">{td.category}</div>
      </a>
    );
  }

  if (isLoading) return <Loader active />;
  return (
    <div className="mx-auto px-4 w-full  xl:w-2/3">
      <FormHeader heading="Forms" />
      {renderCategories()}
      {templates && templates.length > 0 && (
        <div className="grid grid-cols-3 gap-6  p-6 justify-center text-lg">
          {templates
            .filter(
              (t) =>
                selectedCategory === "ALL" ||
                selectedCategory === t.templateDefinition.category
            )
            .map((t) => renderTemplate(t))}
        </div>
      )}

      {templates.length == 0 && (
        <Message
          header="No Record found"
          content="Start by creating your first record!"
          icon="exclamation"
        />
      )}
      <FooterButtons
        rightButton={{
          label: "Design New Form",
          icon: "pencil",
          link: "/template",
        }}
      />

      {/* <Divider />
       <Button basic onClick={() => setTemplateSettingsVisible(true)}>
        Template Settings
      </Button> 
      {templateSettingsVisible && (
        <FormTemplateSettings templates={templates} onSave={handleTemplateSettingsSave} />
      )} */}
    </div>
  );
}
