import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { onError } from "../lib/errorLib";
import NewEmployeeInductionChecklist from "../components/forms/NewEmployeeInductionChecklist";
import "./ISOForm.css";

import { useAppContext } from "../lib/contextLib";
import { jwtApi } from "../lib/apiLib";

export default function ISOForm() {
  const { formName, formId } = useParams();
  const customerIsoId = "iso-123";

  const callJwtAPI = jwtApi();

  //   const nav = useNavigate();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  //   const [isDeleting, setIsDeleting] = useState(false);

  const components = {
    NewEmployeeInductionChecklist: NewEmployeeInductionChecklist,
  };

  function Form(props) {
    // Correct! JSX type can be a capitalized variable.
    const SpecificForm = components[formName];
    if (!SpecificForm) return <div>Unknown Form</div>;
    return <SpecificForm {...props} />;
  }

  // Similar to componentDidMount and componentDidUpdate:
  const componentMounted = useRef(false);
  useEffect(() => {
    function loadForm() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/forms/${formId}`
      );
    }

    async function onLoad() {
      try {
        // Update the document title using the browser API
        if (componentMounted.current && formId) {
          const item = await loadForm();
          setFormData(item.values);
        } else componentMounted.current = true;
      } catch (e) {
        onError(e);
      }
    }
    onLoad();
  }, []);

  //   function validateForm() {
  //     return true;
  //   }

  async function handleSubmit(values) {
    // event.preventDefault();

    setIsLoading(true);
    try {
      if (formId) {
        await updateForm(values);
      } else {
        await createForm(values);
        // nav("/");
      }
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function createForm(values) {
    callJwtAPI("POST", `/customer-isos/${customerIsoId}/forms`, {
      formName: formName,
      values: values,
    });
  }

  function updateForm(values) {
    callJwtAPI("PUT", `/customer-isos/${customerIsoId}/forms/${formId}`, {
      values: values,
    });
  }

  return <Form onSubmit={handleSubmit} initialValues={formData} />;
}
