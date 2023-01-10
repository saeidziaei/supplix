import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { jwtApi } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import Dropdown from 'react-bootstrap/Dropdown';

export default function ProjectContext() {
  const { currentCustomer, currentIso, setCurrentCustomer, setCurrentIso } = useAppContext();
  const [customers, setCustomers] = useState([]);
  const [isos, setIsos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const callJwtAPI = jwtApi();

  useEffect(() => {
    async function onLoad() {
      try {
        const customers = await loadCustomers();
        setCustomers(customers);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  function loadCustomers() {
    return callJwtAPI("GET", `/customers`);
  }

  async function loadIsos(customerId) {
    try {
      const isos = await callJwtAPI("GET", `/customers/${customerId}/isos`);
      setIsos(isos);
    } catch (e) {
      onError(e);
    }
  }
  function handleCustomerChange(customer) {
    setCurrentCustomer(customer);
    setCurrentIso(null);
    return;
    loadIsos(customer.customerId);
  }
  function handleIsoChange(iso) {
    setCurrentIso(iso);
  }

  function renderCustomers() {
    return (
      <Dropdown>
      <Dropdown.Toggle variant="success" id="dropdown-basic">
        {currentCustomer ? currentCustomer.companyName : "Select Customer"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
      {
        customers.map((c, i) => (
          <Dropdown.Item key={c.customerId} onClick={() => handleCustomerChange(c)}>{c.companyName} </Dropdown.Item>
        ))
      }
      </Dropdown.Menu>
    </Dropdown>
    );
  }
  function renderCustomerIsos() {
    if (isos.length > 0) {
      return (
        <Dropdown>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
          {currentIso ? currentIso.name : "Select Customer ISO"}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {isos.map((iso) => (
              <Dropdown.Item key={iso.isoId} onClick={() => handleIsoChange(iso)}> </Dropdown.Item>
            ))}
          </Dropdown.Menu>
          </Dropdown>
      );
    }
  }
  
  return (
    <div>
      {renderCustomers()}
      {renderCustomerIsos()}
    </div>
  )
}
