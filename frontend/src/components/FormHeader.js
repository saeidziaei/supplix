import React from "react";
import { Header, Image } from "semantic-ui-react";
import "./FormHeader.css";

export default function FormHeader({ heading, subheading, image }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Header as="h3" color="grey">
          {heading}
          <Header.Subheader>{subheading}</Header.Subheader>
        </Header>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <Image src={image} size="small" />
      </div>
    </div>
  );
}


