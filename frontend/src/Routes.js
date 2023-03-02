import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Doc from "./containers/Doc";
import Docs from "./containers/Docs";
import ProjectContext from "./containers/ProjectContext";
import Users from "./containers/Users";
import FormTemplates from "./containers/FormTemplates";
import FormTemplate from "./containers/FormTemplate";
import FormRegister from "./containers/FormRegister";
import FormRegisters from "./containers/FormRegisters";
import TemplatedForm from "./containers/TemplatedForm";
import ISO from "./containers/ISO";

import NFormTemplate from "./containers/NFormTemplate";
import NTemplatedForm from "./containers/NTemplatedForm";
import NFormTemplates from "./containers/NFormTemplates";
import Tenant from "./containers/Tenant";
import Tenants from "./containers/Tenants";
import User from "./containers/User";
import ResetPassword from "./containers/ResetPassword";


export default function Links(tenant) {
  const pathPrefix = tenant.tenantName;
  return (
    <Routes>
      {/* <Route path={`${pathPrefix}/`} element={<Home />} />
      <Route path={`${pathPrefix}/iso`}  element={<ISO />} /> */}
      <Route path={`/`} element={<Home />} />
      <Route path={`/iso`}  element={<ISO />} />

      <Route path="/login" element={<Login />} />
      <Route path="/doc/:docId?" element={<Doc />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/project-context" element={<ProjectContext />} />

      <Route path="/users" element={<Users />} /> 
      <Route path="/tenants/:tenantId/users" element={<Users />} />
      <Route path="/user/:username?" element={<User />} />
      <Route path="/tenants/:tenantId/user/:username?" element={<User />} />
      <Route path="/templates" element={<FormTemplates />} />
      <Route path="/template/:templateId?" element={<FormTemplate />} />
      <Route path="/registers" element={<FormRegisters />} />
      <Route path="/register/:templateId" element={<FormRegister />} />
      <Route path="/form/:templateId/:formId?" element={<TemplatedForm />} />


      <Route path="/ntemplates" element={<NFormTemplates />} />
      <Route path="/ntemplate/:templateId?" element={<NFormTemplate />} />
      <Route path="/nform/:templateId/:formId?" element={<NTemplatedForm />} /> 

      <Route path="/tenant/:tenantId?" element={<Tenant />} />
      <Route path="/tenants" element={<Tenants />} />

      <Route path="*" element={<NotFound />} />
      <Route path="/login/reset" element={<ResetPassword />} />

    </Routes>
  );
}
