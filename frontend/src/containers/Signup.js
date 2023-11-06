import React from "react";
import "./Signup.css";

export default function Signup() {
  const isTestMode = false;
  if (isTestMode)
    return (
      <stripe-pricing-table
        pricing-table-id="prctbl_1NrYYNK6bc3JGNzGPFx1eUFv"
        publishable-key="pk_test_51NrXvjK6bc3JGNzGGgkn9NKpl6b5v6UmgE9GJYDh7jl3hhemdIVCOBse3wpd6Nl4SRsYJeLunA3TIXtk5FWK07vS00Gfwwv0gv"
      ></stripe-pricing-table>
    );
  else
    return (
      <stripe-pricing-table
        pricing-table-id="prctbl_1O9MRHK6bc3JGNzGfgFaVTkG"
        publishable-key="pk_live_51NrXvjK6bc3JGNzG3y9r5Z6YLaky3pDU4uVMG4soS71Edl7zrrbc2Ud5WFk90VCT1ztq3Dj6IhGcNsUVDE96Lm4000wPkt4O7C"
      ></stripe-pricing-table>
    );
}
