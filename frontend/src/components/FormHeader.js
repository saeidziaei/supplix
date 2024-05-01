import React from "react";
import { Header, Image } from "semantic-ui-react";
import "./FormHeader.css";

export default function FormHeader({ heading, subheading, image }) {
  return (
    <div
    
className="w-full md:w-[calc(100%-2rem)] p-3  bg-gradient-to-br from-gray-300 to-gray-100 mb-2 md:m-[1rem] shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] rounded"

    >
      <div>
        <Header as="h4" color="grey">
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


