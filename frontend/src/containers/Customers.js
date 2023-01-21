import React, { useState, useEffect } from "react";
import { BsPencilSquare } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import { LinkContainer } from "react-router-bootstrap";
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  // const customerIsoId = "iso-123";
  const [isLoading, setIsLoading] = useState(true);
  const callJwtAPI = JwtApi();

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

  function renderCustomerList(customers) {
    return (
      <>
        <LinkContainer to={`/customer`}>
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">
              Create a new Customer
            </span>
          </ListGroup.Item>
        </LinkContainer>
        {customers.map(({ customerId, companyName, ABN, createdAt }) => (
          <LinkContainer
            key={customerId}
            to={`/customer/${customerId}`}
          >
            <ListGroup.Item action>
              <span className="font-weight-bold">{companyName}</span>
              <br />
              <span className="font-weight-bold">{ABN}</span>
              <br />
              <span className="text-muted">
                Created: {new Date(createdAt).toLocaleString()}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }
  function renderCustomers() {
    return (
      <div className="customers">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Customers</h2>
        <ListGroup>{!isLoading && renderCustomerList(customers)}</ListGroup>
      </div>
    );
  }
  return renderCustomers();
}
