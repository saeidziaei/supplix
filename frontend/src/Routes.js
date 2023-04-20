import React from "react";
import { Route, Routes } from "react-router-dom";
import Doc from "./containers/Doc";
import Docs from "./containers/Docs";
import FormRegister from "./containers/FormRegister";
import FormRegisters from "./containers/FormRegisters";
import FormTemplate from "./containers/FormTemplate";
import FormTemplates from "./containers/FormTemplates";
import Home from "./containers/Home";
import ISO from "./containers/ISO";
import Login from "./containers/Login";
import NotFound from "./containers/NotFound";
import TemplatedForm from "./containers/TemplatedForm";
import Users from "./containers/Users";

import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import ResetPassword from "./containers/ResetPassword";
import Tenant from "./containers/Tenant";
import Tenants from "./containers/Tenants";
import User from "./containers/User";
import Workspace from "./containers/Workspace";
import WorkspaceTeam from "./containers/WorkspaceTeam";
import Workspaces from "./containers/Workspaces";


export default function Links(tenant) {

  return (
    <Routes>

      <Route path={`/`} element={<Home />} />
      <Route path={`/iso`}  element={<ISO />} />
      <Route path="/login" element={ <UnauthenticatedRoute><Login /></UnauthenticatedRoute>} />
      <Route path="/login/reset" element={<UnauthenticatedRoute><ResetPassword /></UnauthenticatedRoute>} />
      
      <Route path="/workspace/:workspaceId/doc/:docId?" element={<AuthenticatedRoute><Doc /></AuthenticatedRoute>} />
      <Route path="/workspace/:workspaceId/docs" element={<AuthenticatedRoute><Docs /></AuthenticatedRoute>} />

      <Route path="/users" element={<AuthenticatedRoute><Users /></AuthenticatedRoute>} /> 
      <Route path="/tenants/:tenantId/users" element={<AuthenticatedRoute><Users /></AuthenticatedRoute>} />
      <Route path="/user/:username?" element={<AuthenticatedRoute><User /></AuthenticatedRoute>} />
      <Route path="/tenants/:tenantId/user/:username?" element={<AuthenticatedRoute><User /></AuthenticatedRoute>} />
      <Route path="/templates" element={<AuthenticatedRoute><FormTemplates /></AuthenticatedRoute>} />
      <Route path="/template/:templateId?" element={<AuthenticatedRoute><FormTemplate /></AuthenticatedRoute>} />
      <Route path="/workspace/:workspaceId/registers" element={<AuthenticatedRoute><FormRegisters /></AuthenticatedRoute>} />
      <Route path="/workspace/:workspaceId/register/:templateId" element={<AuthenticatedRoute><FormRegister /></AuthenticatedRoute>} />
      <Route path="/workspace/:workspaceId/form/:templateId/:formId?" element={<AuthenticatedRoute><TemplatedForm /></AuthenticatedRoute>} />


      <Route path="/tenant/:tenantId?" element={<AuthenticatedRoute><Tenant /></AuthenticatedRoute>} />
      <Route path="/tenants" element={<AuthenticatedRoute><Tenants /></AuthenticatedRoute>} />

      <Route path="/workspace/:workspaceId?" element={<AuthenticatedRoute><Workspace /></AuthenticatedRoute>} />
      <Route path="/workspaces" element={<AuthenticatedRoute><Workspaces /></AuthenticatedRoute>} />
      <Route path="/workspace/:workspaceId/team" element={<AuthenticatedRoute><WorkspaceTeam/></AuthenticatedRoute>} />

      <Route path="*" element={<NotFound />} />
      

    </Routes>
  );
}
