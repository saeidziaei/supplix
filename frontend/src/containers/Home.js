// Import React dependencies.
import React, { useState } from "react";
import { Header, Icon, Input, Segment, TextArea } from "semantic-ui-react";
import FormHeader from "../components/FormHeader";
import "./Home.css";

export default function Home() {
  const [content, setContent] = useState('');

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
