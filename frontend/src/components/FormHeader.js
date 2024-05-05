import React from "react";
import { Header, Image } from "semantic-ui-react";
import "./FormHeader.css";

export default function FormHeader({ heading, subheading, image }) {
  return (
    <div className="w-full md:w-[calc(100%-1rem)] p-3 bg-gray-100 border border-gray-300 mb-1 md:mx-[.5rem] shadow-[rgba(0,_0,_0,_0.24)_0px_1px_2px] rounded">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="text-gray-500">{heading}</h4>
      <p className="text-gray-400">{subheading}</p>
    </div>
    <div className="ml-auto">
      {image &&
      <img
        src={image}
        className="w-32 h-32 object-contain rounded-full"
        alt="Profile"
      />}
    </div>
  </div>
</div>
  );
}


