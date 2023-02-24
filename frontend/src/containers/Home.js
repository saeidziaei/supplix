// Import React dependencies.
import React from "react";
import { Header, Icon, Input, Segment } from "semantic-ui-react";
import "./Home.css";

export default function Home() {

  return (
    <div className="Home">
      
      <Segment placeholder>
        <Header icon>
          <Icon name="smile outline" />
          Welcome!
        </Header>
      </Segment>
    </div>
  );
}
