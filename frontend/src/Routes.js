import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Doc from "./containers/Doc";
import Docs from "./containers/Docs";
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
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";


export default function Links(tenant) {

  return (
    <Routes>

      <Route path={`/`} element={<Home />} />
      <Route path={`/iso`}  element={<ISO />} />
      <Route path="/login" element={ <UnauthenticatedRoute><Login /></UnauthenticatedRoute>} />
      <Route path="/login/reset" element={<UnauthenticatedRoute><ResetPassword /></UnauthenticatedRoute>} />
      
      <Route path="/doc/:docId?" element={<AuthenticatedRoute><Doc /></AuthenticatedRoute>} />
      <Route path="/docs" element={<AuthenticatedRoute><Docs /></AuthenticatedRoute>} />

      <Route path="/users" element={<AuthenticatedRoute><Users /></AuthenticatedRoute>} /> 
      <Route path="/tenants/:tenantId/users" element={<AuthenticatedRoute><Users /></AuthenticatedRoute>} />
      <Route path="/user/:username?" element={<AuthenticatedRoute><User /></AuthenticatedRoute>} />
      <Route path="/tenants/:tenantId/user/:username?" element={<AuthenticatedRoute><User /></AuthenticatedRoute>} />
      <Route path="/templates" element={<AuthenticatedRoute><FormTemplates /></AuthenticatedRoute>} />
      <Route path="/template/:templateId?" element={<AuthenticatedRoute><FormTemplate /></AuthenticatedRoute>} />
      <Route path="/registers" element={<AuthenticatedRoute><FormRegisters /></AuthenticatedRoute>} />
      <Route path="/register/:templateId" element={<AuthenticatedRoute><FormRegister /></AuthenticatedRoute>} />
      <Route path="/form/:templateId/:formId?" element={<AuthenticatedRoute><TemplatedForm /></AuthenticatedRoute>} />


      <Route path="/ntemplates" element={<AuthenticatedRoute><NFormTemplates /></AuthenticatedRoute>} />
      <Route path="/ntemplate/:templateId?" element={<AuthenticatedRoute><NFormTemplate /></AuthenticatedRoute>} />
      <Route path="/nform/:templateId/:formId?" element={<AuthenticatedRoute><NTemplatedForm /></AuthenticatedRoute>} /> 

      <Route path="/tenant/:tenantId?" element={<AuthenticatedRoute><Tenant /></AuthenticatedRoute>} />
      <Route path="/tenants" element={<AuthenticatedRoute><Tenants /></AuthenticatedRoute>} />

      <Route path="*" element={<NotFound />} />
      

    </Routes>
  );
}
