import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import Customer from "./containers/Customer";
import Customers from "./containers/Customers";
import ISOForm from "./containers/ISOForm";
import ISOForms from "./containers/ISOForms";
import ProjectContext from "./containers/ProjectContext";
import Users from "./containers/Users";
import GenericForm from "./containers/GenericForm";

export default function Links() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/customer/:customerId?" element={<Customer />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/project-context" element={<ProjectContext />} />
      
      <Route path="/users" element={<Users />} />
      <Route path="/dynamic-form" element={<GenericForm />} />
      
      <Route path="/form/:formName/:formId?" element={<ISOForm />} />
      <Route path="/forms" element={<ISOForms />} /> {/* for a given customer and given customer-iso */}      
      <Route path="*" element={<NotFound />} />;
    </Routes>
  );
}
