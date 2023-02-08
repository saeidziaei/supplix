import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import Customer from "./containers/Customer";
import Customers from "./containers/Customers";
import ProjectContext from "./containers/ProjectContext";
import Users from "./containers/Users";
import FormTemplates from "./containers/FormTemplates";
import FormTemplate from "./containers/FormTemplate";
import FormRegister from "./containers/FormRegister";
import FormRegisters from "./containers/FormRegisters";
import TemplatedForm from "./containers/TemplatedForm";
import ISO from "./containers/ISO";

import NFormTemplate from "./containers/NFormTemplate";


export default function Links() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/iso" element={<ISO />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/customer/:customerId?" element={<Customer />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/project-context" element={<ProjectContext />} />
      <Route path="/users" element={<Users />} />
      <Route path="/templates" element={<FormTemplates />} />
      <Route path="/template/:templateId?" element={<FormTemplate />} />
      <Route path="/registers" element={<FormRegisters />} />
      <Route path="/register/:templateId" element={<FormRegister />} />
      <Route path="/form/:templateId/:formId?" element={<TemplatedForm />} />

      {/* <Route path="/ntemplates" element={<NFormTemplates />} /> */}
      <Route path="/ntemplate/:templateId?" element={<NFormTemplate />} />
      {/* <Route path="/nform/:templateId/:formId?" element={<NTemplatedForm />} />  */}


      <Route path="*" element={<NotFound />} />;
    </Routes>
  );
}
