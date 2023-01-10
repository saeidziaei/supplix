import React, { useState, useEffect } from "react";
import { BsPencilSquare } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { jwtApi } from "../lib/apiLib";

export default function ISOForms() {
  const [forms, setForms] = useState([]);
  const customerIsoId = "iso-123";
  const [isLoading, setIsLoading] = useState(true);
  const callJwtAPI = jwtApi();

  useEffect(() => {
    async function onLoad() {
      try {
        const forms = await loadForms();
        console.log(forms);
        setForms(forms);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function loadForms() {
    return callJwtAPI("GET", `/customer-isos/${customerIsoId}/forms`);
  }

  function renderFormList(forms) {
    return (
      <>
      
        <LinkContainer to={`/form/NewEmployeeInductionChecklist`}>
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">
              Create a new form - NewEmployeeInductionChecklist
            </span>
          </ListGroup.Item>
        </LinkContainer>
        {forms.map(({ formId, formName, createdAt }) => (
          <LinkContainer
            key={formId}
            to={`/form/${formName}/${formId}`}
          >
            <ListGroup.Item action>
              <span className="font-weight-bold">{formName}</span>
              <br />
              <span className="text-muted">
                Created: {new Date(createdAt).toLocaleString()}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }
  function renderForms() {
    return (
      <div className="notes">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Forms</h2>
        <ListGroup>{!isLoading && renderFormList(forms)}</ListGroup>
      </div>
    );
  }
  return renderForms();
}
