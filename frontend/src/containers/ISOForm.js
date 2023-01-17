import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { onError } from "../lib/errorLib";
import formConfig from "../components/forms/formConfig";
import { jwtApi } from "../lib/apiLib";
import "./ISOForm.css";
import { useReactToPrint } from "react-to-print";
import Stack from "react-bootstrap/esm/Stack";
import LoaderButton from "../components/LoaderButton";

export default function ISOForm() {
  const { formName, formId } = useParams();
  const customerIsoId = "iso-123";
  const callJwtAPI = jwtApi();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadForm() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/forms/${formId}`
      );
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

  async function handleSubmit(values) {

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
    return callJwtAPI(
      "PUT",
      `/customer-isos/${customerIsoId}/forms/${formId}`,
      {
        values: values,
      }
    );
  }

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  function DynamicForm(props) {
    const SpecificForm = formConfig[formName].component;
    if (!SpecificForm) return <div>Unknown Form</div>;

    return (
      <div ref={componentRef}>
        <SpecificForm {...props} />
        </div>
    );
  }

  // const DynamicForm = React.forwardRef((props, ref) => {
  //   const SpecificForm = formConfig[formName].component;
  //   if (!SpecificForm) return <div>Unknown Form</div>;

  //   return (
  //     <div ref={ref}>
  //       <SpecificForm {...props} />
  //     </div>
  //   );
  // });

  if (isLoading) {
    return <>Loading...</>
  }
  return (
    <>
      <React.StrictMode>
        <DynamicForm
          isLoading={isLoading}
          onSubmit={handleSubmit}
          initialValues={formData}
          // ref={componentRef}
        />
        <Stack className="hide-in-print" direction="horizontal" gap={3}>
          <LoaderButton onClick={handlePrint}>Print</LoaderButton>
          
        </Stack>
      </React.StrictMode>
    </>
  );
}
