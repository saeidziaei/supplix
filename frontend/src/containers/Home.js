// Import React dependencies.
import React from "react";
import { Header, Icon, Input, Label, Segment } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import "./Home.css";

export default function Home() {

  return (
    <div className="Home">
      <FormHeader heading="Home" />
      <Segment placeholder>
        <Header icon>
          <Icon name="smile outline" />
          Welcome!
        </Header>
      </Segment>
    </div>
  );
}
