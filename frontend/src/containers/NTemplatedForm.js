import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Header, Segment, Loader  } from 'semantic-ui-react';
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import { NGenericForm } from '../components/NGenericForm';



export default function NTemplatedForm() {
  const { formId, templateId } = useParams();
  const customerIsoId = "iso-123";
  const callJwtAPI = JwtApi();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const nav = useNavigate();
  
  

  useEffect(() => {
    function loadForm() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/forms/${formId}`
      );
    }

    function loadTemplate() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/templates/${templateId}`
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
  function createForm(values) {
    return callJwtAPI("POST", `/customer-isos/${customerIsoId}/forms`, {
      templateId: template.templateId,
      formValues: values,
    });
  }

  function updateForm(values) {
    return callJwtAPI(
      "PUT",
      `/customer-isos/${customerIsoId}/forms/${formId}`,
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
    <NGenericForm  formDef={template.templateDefinition} formData={formData} handleSubmit={handleSubmit} />
  );
}

