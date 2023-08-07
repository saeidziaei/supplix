import React, { useState } from "react";
import { Button, Form, Header, Segment } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";

export default function FormTemplateSettings({ templates, onSave }) {
  const [settings, setSettings] = useState({Quality: "", Shipment: ""});

  const handleSelectChange = (templateId, purpose) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [purpose]: templateId,
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <>
      <FormHeader heading="Template Settings" />
      <Segment>
        <Header as="h3">Select Templates for Different Purposes</Header>
        <Form>
          {Object.keys(settings).map((purpose) => (
            <Form.Field key={purpose}>
              <label>{purpose}:</label>
              <select
                value={settings[purpose] || ""}
                onChange={(e) => handleSelectChange(e.target.value, purpose)}
              >
                <option value="">Select a Template</option>
                {templates.map((template) => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.templateDefinition.title}
                  </option>
                ))}
              </select>
            </Form.Field>
          ))}
          <Button primary onClick={handleSave}>
            Save
          </Button>
        </Form>
      </Segment>
    </>
  );
}
