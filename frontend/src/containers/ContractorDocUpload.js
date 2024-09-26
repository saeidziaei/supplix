import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ContractorDocUpload() {
  const location = useLocation();
  const [psu, setPSU] = useState([]); //pre signed url

  useEffect(() => {
    // Extract the category and subCategory parameters from the URL
    const searchParams = new URLSearchParams(location.search);
    const psu = searchParams.get("psu");
    setPSU(psu);

    console.log(psu);
    
  }, [location.search]);
}
