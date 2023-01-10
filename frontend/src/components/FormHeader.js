import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import "./FormHeader.css";
import { BsCardText } from "react-icons/bs";
import { useAppContext } from "../lib/contextLib";

export default function FormHeader({
    heading, 
}) {
  const { currentCustomer } = useAppContext();
    return (
      <Container>
        <Row>
          <Col sm={8} className="text-left">
            {new Date().toLocaleString()}

            <h2>
              <BsCardText size={17} /> 
              {"  "}{heading}
            </h2>
          </Col>
          <Col sm={4} className="text-right">
            {currentCustomer && (
              <img
                src={currentCustomer.logoURL}
                alt="Logo"
                style={{ width: 70 }}
              />
            )}
          </Col>
        </Row>
      </Container>
    );
}