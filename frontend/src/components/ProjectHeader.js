import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import "./FormHeader.css";
import { useAppContext } from "../lib/contextLib";
import Button from "react-bootstrap/Button";
import { LinkContainer } from "react-router-bootstrap";

export default function ProjectHeader() {
    const { currentCustomer, currentCustomerIso, canChangeProject } = useAppContext();

    return (
      <>
        <h3>Current Project</h3>
        <Container>
          <Row>
            <Col sm={5}>
              {currentCustomer && (<h2>{currentCustomer.companyName}</h2>)}
            </Col>
            <Col sm={5}>
            {currentCustomerIso && (<h2>{currentCustomerIso.IsoName}</h2>)}
            </Col>
            {canChangeProject && (
              <Col sm={2}>
                <LinkContainer to="/prject-context">
                  <Button>Change</Button>
                </LinkContainer>
              </Col>
            )}
          </Row>
        </Container>
      </>
    );
}