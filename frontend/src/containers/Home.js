// Import React dependencies.
import React from "react";
import FormHeader from "../components/FormHeader";
import "./Home.css";
import {
  Button,
  Container,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Segment,
} from 'semantic-ui-react'

export default function Home() {

  return (
    <div className="Home" style={{ backgroundColor: "black" }}>
      <FormHeader heading="Home" />
      <Container text>
        <Header
          as="h1"
          content="ISO Cloud"
          inverted
          style={{
            fontSize: "4em",
            fontWeight: "normal",
            marginBottom: 0,
            marginTop: "3em",
          }}
        />
        <Header
          as="h2"
          content="Cloud-based ISO documentation and management service"
          inverted
          style={{
            fontSize: "1.7em",
            fontWeight: "normal",
            marginTop: "1.5em",
          }}
        />
        <Button primary size="huge">
          Get Started
          <Icon name="right arrow" />
        </Button>
      </Container>
      <Segment style={{ padding: "8em 0em" }} vertical>
        <Container text inverted>
          <Header inverted as="h4">
            Our platform is designed to streamline your ISO documentation and
            management process, enabling you to manage your ISO documentation
            online, collaborate with your team, and automate many of the tasks
            associated with ISO compliance. By moving your ISO documentation and
            management to the Cloud, you can enjoy a wide range of benefits,
            including:
            <ol>
              <li>
                Improved efficiency: Our platform automates many of the
                time-consuming tasks associated with ISO compliance, allowing
                you to focus on other important areas of your business.
              </li>
              <li>
                Enhanced collaboration: Our platform enables your team to work
                together seamlessly, share documents, and communicate easily.
              </li>
              <li>
                Increased security: We take data security seriously, and our
                Cloud-based platform provides robust security measures to
                protect your data.
              </li>
              <li>
                Reduced costs: By moving your ISO documentation and management
                to the Cloud, you can significantly reduce the costs associated
                with traditional ISO compliance.
              </li>
              <li>
                Scalability: Our platform is designed to grow with your
                business, enabling you to add new users, locations, and
                processes as your organization expands.
              </li>
            </ol>
            With our Cloud-based ISO documentation and management service, you
            can achieve ISO compliance quickly and easily, while also improving
            efficiency, collaboration, and data security. Contact us today to
            learn more about how we can help your organization achieve ISO
            compliance with ease.
          </Header>
        </Container>
      </Segment>
    </div>
  );
}
