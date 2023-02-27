import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { onError } from "../lib/errorLib";
import formConfig from "../components/forms/formConfig";
import { makeApiCall } from "../lib/apiLib";

import { useReactToPrint } from "react-to-print";
import Stack from "react-bootstrap/esm/Stack";
import { Card, Loader } from "semantic-ui-react";


export default function User() {
  const { username, tenantId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadUser() {
      if (tenantId)
        return makeApiCall("GET", `/tenants/${tenantId}/users/${username}`);
      else
        return makeApiCall("GET", `/users/${username}`);
    }

    async function onLoad() {
      try {
        if (username) {
          const item = await loadUser();

          setUser(item);
        }
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function handleSubmit(values) {

    setIsLoading(true);
    try {

      if (username) {
        await updateUser();
      } else {
        await createUser();
        
      }
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function createUser(values) {
    // return makeApiCall("POST", `/customer-isos/${customerIsoId}/forms`, {
    //   formName: formName,
    //   values: values,
    // });
  }

  function updateUser(values) {
    // return makeApiCall(
    //   "PUT",
    //   `/customer-isos/${customerIsoId}/forms/${formId}`,
    //   {
    //     values: values,
    //   }
    // );
  }



  if (isLoading) {
    return <Loader active />
  }
  console.log("user", user);
  return (
    <>
      <Card>
        {user.Username}
      </Card>
    </>
  );
}
