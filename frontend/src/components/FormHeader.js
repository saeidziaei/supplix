import React from "react";
import "./FormHeader.css";
import { useAppContext } from "../lib/contextLib";
import { Divider, Header } from "semantic-ui-react";

export default function FormHeader({ heading }) {
  const { currentCustomer } = useAppContext();
  return (
    <>
      <Header as="h2" className="my-3" dividing>
        {heading}
      </Header>
      {currentCustomer && (
        <img src={currentCustomer.logoURL} alt="Logo" style={{ width: 70 }} />
      )}
    </>
  );
}
