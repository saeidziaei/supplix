import React from "react";
import { Header } from "semantic-ui-react";
import "./FormHeader.css";

export default function FormHeader({ heading }) {
  return (
    <>
      <Header as="h3"  color="grey" >
        {heading}
      </Header>
    </>
  );
}
