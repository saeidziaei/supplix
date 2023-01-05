import React, { useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../lib/errorLib";
import config from "../config";
import { useFormFields } from "../lib/hooksLib";
import "./NewCustomer.css";
import { API } from "aws-amplify";
import { useAppContext } from "../lib/contextLib";

export default function NewCustomer() {
  const { jwtToken } = useAppContext();

  const [fields, handleFieldChange] = useFormFields({
    companyName: "",
    ABN: "",
    notes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  function validateForm() {
    return true;
  }
  async function handleSubmit(event) {
    event.preventDefault();
    // other validatoins ... TODO
    setIsLoading(true);
    try {
      console.log("fields:", fields);
      await createCustomer( fields );
      nav("/");
      } catch (e) {
      onError(e);
      setIsLoading(false);
      }
      }
      function createCustomer(fields) {
        console.log("jwtToken", jwtToken);
        return API.post("iso-cloud", "/customers", {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: {
            companyName: fields.companyName,
            ABN: fields.ABN,
            contact: {
              name: fields.contactName,
              email: fields.contactEmail,
              phone: fields.contactPhone
            },
            notes: fields.notes
          },
          // body: customer
        });
      }
  
  return (
    <div className="NewCustomer">
      <Form onSubmit={handleSubmit}>
        <Stack gap={3}>
        <FloatingLabel controlId="companyName" label="Company Name" >
            <Form.Control value={fields.companyName} onChange={handleFieldChange} placeholder="Company Name" size="lg"/>
        </FloatingLabel>

        <FloatingLabel controlId="ABN" label="ABN">
            <Form.Control value={fields.ABN} onChange={handleFieldChange} placeholder="ABN"/>
        </FloatingLabel>
        <Card className="px-1 py-2">
          Contact Person
          <FloatingLabel controlId="contactName" label="Name" className="mb-1">
            <Form.Control value={fields.contactName} onChange={handleFieldChange} placeholder="Name"/>
          </FloatingLabel>
          <FloatingLabel controlId="contactPhone" label="Phone" className="mb-1">
            <Form.Control value={fields.contactPhone} onChange={handleFieldChange} placeholder="Phone"/>
          </FloatingLabel>
          <FloatingLabel controlId="contactEmail" label="Email">
            <Form.Control value={fields.contactEmail} type="email" onChange={handleFieldChange} placeholder="email@example.com"/>
          </FloatingLabel>

        </Card>

        <Form.Group controlId="notes">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            value={fields.notes}
            as="textarea"
            onChange={handleFieldChange}
          />
        </Form.Group>
        <LoaderButton
          block="true"
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
        </Stack>
      </Form>
    </div>
  );
}
