import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import "./FormHeader.css";
import { useAppContext } from "../lib/contextLib";
import Button from "react-bootstrap/Button";
import { LinkContainer } from "react-router-bootstrap";

export default function ProjectHeader() {
    const { currentCustomer, currentCustomerIso, canChangeProject } = useAppContext();

    return (
      <Card className="text-left mb-3">
        <Card.Header>Current Project</Card.Header>
        <Card.Body>
          <Row>
            <Col className="px-3" sm={3}>
              {currentCustomer && (
                <img
                  src={currentCustomer.logoURL}
                  alt="Company Logo"
                  style={{ width: "120px" }}
                />
              )}
            </Col>
            <Col className="px-3" sm={7}>
              {currentCustomer && <h2>{currentCustomer.companyName}</h2>}
              {currentCustomerIso && <h2>{currentCustomerIso.IsoName}</h2>}
            </Col>
            {canChangeProject && (
              <Col sm={2}>
                <LinkContainer to="/prject-context">
                  <Button>Change</Button>
                </LinkContainer>
              </Col>
            )}
          </Row>{" "}
        </Card.Body>
      </Card>
    );

}