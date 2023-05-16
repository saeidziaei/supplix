import React from "react";
import { Header } from "semantic-ui-react";
import "./FormHeader.css";

export default function FormHeader({ heading, subheading }) {
  return (
    <>
      <Header as="h3" color="grey" >
        {heading}
        <Header.Subheader>{subheading}</Header.Subheader>
      </Header>
    </>
  );
}
