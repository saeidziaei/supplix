import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Divider, Dropdown, Grid, Header, Icon, Image, Loader, Message, Segment, Table } from "semantic-ui-react";
import UserPicker from "../components/UserPicker";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { getUserById, normaliseCognitoUsers } from "../lib/helpers";

export default function WorkspaceTeam(props) {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  let { state } = useLocation();
  const { loadAppWorkspace } = useAppContext();
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState(null);
  const [newMemberRole, setNewMemberRole] = useState("Member");
  const [users, setUsers] = useState([]);
  const [isInAddMode, setIsInAddMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadWorkspace() {
      // if workspace has been passed in state use it otherwise it is a direct URL to members page and therefore workspace needs to be loaded from the backend
      // but it needs to be loaded in the app context because it is used by everyone not just this page.
      return state ?? await loadAppWorkspace(workspaceId); 
    }
    async function loadWorkspaceMembers() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/members`);
    }
    async function loadUsers() {
      return await makeApiCall("GET", `/users`); // ADMIN
    }
    async function onLoad() {
      try {
        const [workspace, members, users] = await Promise.all([loadWorkspace(), loadWorkspaceMembers(), loadUsers()]);
        setWorkspace(workspace);
        setMembers(members);
        setUsers(normaliseCognitoUsers(users));
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);


  async function addMember() {
    try {
      setIsLoading(true);
      const member = {
        userId: newMember,
        role: newMemberRole,
      };
      await makeApiCall("POST", `/workspaces/${workspaceId}/members`, member);
      setMembers([...members, member]);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
      setIsInAddMode(false);
    }
  }
  async function deleteMember(userId) {
    try {
      setIsLoading(true);
      await makeApiCall("DELETE", `/workspaces/${workspaceId}/members/${userId}`);
      setMembers(members.filter(member => member.userId !== userId)); 
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }


  const nonMembers = () => users.filter(
    (user) => !members.some((member) => member.userId === user.Username)
  );
  
  function renderMembers() {

    if (!workspace)
      return (
        <Message
          header="Workspace not found"
          content="Please contact your administrator."
          icon="exclamation"
        />
      );

    return (
      <Grid textAlign="center" style={{ height: "100vh" }} verticalAlign="top">
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" color="black" textAlign="center">
            <Icon.Group>
              <Icon name="list alternate outline" />
              <Icon corner name="clock outline" />
            </Icon.Group>
            {`Workspace : ${workspace.workspaceName}`}
          </Header>
          {(!members || members.length == 0) && (
            <Message
              header="No member found"
              content="Start by adding uses to your team!"
              icon="exclamation"
            />
          )}
          {members && members.length > 0 && (
            <Table basic columns="5">
              <Table.Body>
                {members.map((m) => {
                  const userMember = getUserById(users, m.userId);
                  return (
                    <Table.Row key={m.userId}>
                      <Table.Cell>
                        <Icon
                          name={m.role === "Owner" ? "chess king" : "user"}
                          color={m.role === "Owner" ? "black" : "grey"}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        {userMember.photoURL && <Image src={userMember.photoURL} avatar/> }
                      </Table.Cell>
                      <Table.Cell>
                        <strong>
                          {userMember.given_name}
                        </strong>
                      </Table.Cell>
                      <Table.Cell>
                        <strong>
                          {userMember.family_name}
                        </strong>
                      </Table.Cell>
                      <Table.Cell>{m.role}</Table.Cell>
                      <Table.Cell>
                        <Button size="tiny" basic onClick={() => deleteMember(m.userId)} icon="x" circular />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          )}
          {!isInAddMode ? (
            nonMembers().length > 0 ?
            (<Button basic onClick={() => setIsInAddMode(true)}>
              Add Team Member
            </Button>) : <Header as="h4">All users have already been added to this workspace</Header>
          ) : (
            <Segment>
              <UserPicker
                users={nonMembers()}
                value={newMember}
                onChange={(userId) => setNewMember(userId)}
              />
              <Divider hidden />
              <Dropdown
                fluid
                selection
                placeholder="Role"
                value={newMemberRole}
                onChange={(e, { value }) => setNewMemberRole(value)}
                options={["Member", "Owner"].map((option) => ({
                  key: option,
                  text: option,
                  value: option,
                }))}
              />
              <Divider hidden />
              <Button basic onClick={addMember} disabled={!(newMember && newMemberRole)}>
                Add
              </Button>
              <Button basic onClick={() => setIsInAddMode(false)}>
                Cancel
              </Button>
            </Segment>
          )}
        </Grid.Column>
      </Grid>
    );
  }

  if (isLoading) return <Loader active />;

  return renderMembers();
}
