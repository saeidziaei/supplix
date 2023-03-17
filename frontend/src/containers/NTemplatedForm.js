import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Header, Segment, Loader  } from 'semantic-ui-react';
import { onError } from "../lib/errorLib";
import { makeApiCall } from "../lib/apiLib";
import { NGenericForm } from '../components/NGenericForm';



export default function NTemplatedForm() {
  const { formId, templateId } = useParams();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const nav = useNavigate();
  
  

  useEffect(() => {
    async function loadForm() {
      // return await makeApiCall(
      //   "GET",
      //   `/customer-isos/${customerIsoId}/forms/${formId}`
      // );
    }
    async function loadTemplate() {
      return await makeApiCall(
        "GET",
        `/ntemplates/${templateId}`
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
    // return await makeApiCall("POST", `/customer-isos/${customerIsoId}/forms`, {
    //   templateId: template.templateId,
    //   formValues: values,
    // });
  }

  async function updateForm(values) {
    // return await makeApiCall(
    //   "PUT",
    //   `/customer-isos/${customerIsoId}/forms/${formId}`,
    //   {
    //     formValues: values,
    //   }
    // );
  }
  if (isLoading) return <Loader active />;

  if (!template || !template.templateDefinition) {
    return <Segment><Header as="h3">Form definition does not exist.</Header></Segment>
  }

  


  return (
    <NGenericForm  formDef={template.templateDefinition} formData={formData} handleSubmit={handleSubmit} />
  );
}

