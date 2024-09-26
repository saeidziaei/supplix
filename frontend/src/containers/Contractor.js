import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import React, { useEffect, useState } from "react";
import { onError } from "../lib/errorLib";


export default function Contractor() {

  const [isLoading, setIsLoading] = useState(true);


  async function handleSubmit(values, { setSubmitting }) {
    setIsLoading(true);
    try {
      const contractorId = 12345;
      return await makeApiCall("POST", `/contractors/${contractorId}/upload-request`, {docType: "Swims"});
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }

  


  const render = () => {
    return (
      <>
            <button className="px-5 rounded-lg hover:text-gray-500" onClick={handleSubmit}>Send email</button>
            </>
    );
  };

  if (isLoading) return <Loader active />;

  return render();
}
