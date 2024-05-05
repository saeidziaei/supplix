import React from "react";
import { Button, Icon } from "semantic-ui-react";

const FooterButtons = ({ leftButton, rightButton }) => {
  const renderButton = ({ label, link, icon, isSubmit, onClick, color }) => {
    const handleClick = (e) => {
      if (!isSubmit) {
        e.preventDefault();
      }
      onClick && onClick();
    };
    const className = `block w-full px-2 py-2 md:min-w-[150px] mx-auto mt-2 text-center  text-${color}-400 border border-${color}-400 rounded hover:bg-${color}-600 hover:text-white focus:outline-none focus:ring`;

    return link ? (
      <a href={link} className={className} >
        <Icon name={icon} />
        {label}
      </a> 
    ) : (
    
      <button
        type={isSubmit ? "submit" : "button"}
        className={className}
        onClick={handleClick}
      >
        <Icon name={icon} className="mr-2" />
        {label}
      </button>
    );
  };

  return (
    <div className="p-3 m-1 flex justify-between items-center rounded border border-gray-300 bg-gray-50">
      {/* the following hidden blocks are needed so that tailwind includes the required colors in the complied css  
      Supported Colors
      DO NOT REMOVE
      */}
      <div className="hidden text-red-400 border border-red-400 rounded hover:bg-red-600" />
      <div className="hidden text-blue-400 border border-blue-400 rounded hover:bg-blue-600" />
      <div className="hidden text-gray-400 border border-gray-400 rounded hover:bg-gray-600" />
      <div className="hidden text-teal-400 border border-teal-400 rounded hover:bg-teal-600" />
    {/* DO NOT REMOVE  */}

      {leftButton && (
        <div className="col-span-6 lg:col-span-2">
          {renderButton({ ...leftButton, color: leftButton.color || "gray" })}
        </div>
      )}
      <div className="col-span-4 lg:col-span-2 hidden lg:block"></div>
      {rightButton && (
        <div className="col-span-6 lg:col-span-2">
          {renderButton({ ...rightButton, color: rightButton.color || "blue" })}
        </div>
      )}
    </div>
  );
};

export default FooterButtons;
