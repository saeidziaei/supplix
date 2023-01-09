import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import NewNote from "./containers/NewNote";
import NewCustomer from "./containers/NewCustomer";
import ISOForm from "./containers/ISOForm";
import AllISOForms from "./containers/AllISOForms";

export default function Links() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/notes/new" element={<NewNote />} />
      <Route path="/customers/new" element={<NewCustomer />} />
      <Route path="/forms/:formName/:formId?" element={<ISOForm />} />
      <Route path="/forms" element={<AllISOForms />} /> {/* for a given customer and given customer-iso */}      
      <Route path="*" element={<NotFound />} />;
    </Routes>
  );
}
