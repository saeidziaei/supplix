import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { Header, Loader, Segment } from 'semantic-ui-react';
import { GenericForm } from '../components/GenericForm';
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";



export default function TemplatedForm() {
  const { formId, templateId } = useParams();

  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const nav = useNavigate();
  
  

  useEffect(() => {
    async function loadForm() {
      return await makeApiCall(
        "GET",
        `/forms/${formId}`
      );
    }

    async function loadTemplate() {
      return await makeApiCall(
        "GET",
        `/templates/${templateId}`
      );
    }
    async function onLoad() {
      try {
        if (formId) {
          const item = await loadForm();

          setFormData(item.formValues);
          // the api populates template as well
          setTemplate(item.template);
        } else {
          // new form - just load the template 
          const item = await loadTemplate();
          
          setTemplate(item);
        }

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);
  
  async function handleSubmit(values) {
    setIsLoading(true);
    try {
      if (formId) {
        await updateForm(values);
      } else {
        await createForm(values);
      }
      nav(`/register/${templateId}`);// todo navigate to form register page ??
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function createForm(values) {
    return await makeApiCall("POST", `/forms`, {
      templateId: template.templateId,
      formValues: values,
    });
  }

  async function updateForm(values) {
    return await makeApiCall(
      "PUT",
      `/forms/${formId}`,
      {
        formValues: values,
      }
    );
  }
  if (isLoading) return <Loader active />;

  if (!template || !template.templateDefinition) {
    return <Segment><Header as="h3">Form definition does not exist.</Header></Segment>
  }

  


  return (
    <GenericForm  formDef={template.templateDefinition} formData={formData} handleSubmit={handleSubmit} />
  );
}

