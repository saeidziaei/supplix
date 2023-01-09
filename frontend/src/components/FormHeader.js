import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import "./FormHeader.css";
import { BsPencilSquare } from "react-icons/bs";

export default function FormHeader({
    heading, 
    imageUrl
}) {
    return (

      <Container>
        <Row>
          <Col sm={8} className="text-left">
            {new Date().toLocaleString()}

            <h2>
              <BsPencilSquare size={17} />
              {heading}
            </h2>
          </Col>
          <Col sm={4} className="text-right" >
            <img src={imageUrl} alt="Logo" style={{ width: 40, height: 40 }} />
          </Col>
        </Row>
      </Container>
    );
}