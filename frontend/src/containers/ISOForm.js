import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { onError } from "../lib/errorLib";
import  formConfig  from "../components/forms/formConfig"
import { jwtApi } from "../lib/apiLib";
import LoaderButton from "../components/LoaderButton";

import "./ISOForm.css";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";


export default function ISOForm() {
  const { formName, formId } = useParams();
  const customerIsoId = "iso-123";

  const callJwtAPI = jwtApi();

  //   const nav = useNavigate();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  //   const [isDeleting, setIsDeleting] = useState(false);


  function Form(props) {
    // Correct! JSX type can be a capitalized variable.
    const SpecificForm = formConfig[formName].component;
    if (!SpecificForm) return <div>Unknown Form</div>;
    return <SpecificForm {...props} />;
  }


  useEffect(() => {
    function loadForm() {
      return callJwtAPI("GET", `/customer-isos/${customerIsoId}/forms/${formId}`);
    }

    async function onLoad() {
      try {
        if (formId) {
          const item = await loadForm();
          setFormData(item.values);
        } 
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
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
    return callJwtAPI("POST", `/customer-isos/${customerIsoId}/forms`, {
      formName: formName,
      values: values,
    });
  }

  function updateForm(values) {
    return callJwtAPI("PUT", `/customer-isos/${customerIsoId}/forms/${formId}`, {
      values: values,
    });
  }

  return (
    <>
      <div id="print-area">
        <Form
          onSubmit={handleSubmit}
          initialValues={formData}
          isLoading={isLoading}
        />
      </div>
      <Row>
        <Col><LoaderButton type="submit" isLoading={isLoading}>Submit</LoaderButton></Col>
        <Col className="text-right"><LoaderButton onClick={() => window.print()}>Print</LoaderButton></Col>
      </Row>
      
      
    </>
  );
}
