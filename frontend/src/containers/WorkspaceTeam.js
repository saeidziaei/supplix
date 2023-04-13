import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Divider, Dropdown, Grid, Header, Icon, Loader, Message, Table } from "semantic-ui-react";
import UserPicker from "../components/UserPicker";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { normaliseCognitoUsers } from "../lib/helpers";

export default function WorkspaceTeam(props) {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState(null);
  const [newMemberRole, setNewMemberRole] = useState("Member");
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  let { state } = useLocation();

  const [randomUsers] = useState(generateRandomUsers(20));




  function validateForm() {
    return true; // file.current
  }

  useEffect(() => {
    async function loadWorkspace() {
      // if workspace has been passed in state use it otherwise it is a direct URL to members page and therefore workspace needs to be loaded from the backend
      return state ?? await makeApiCall("GET", `/workspaces/${workspaceId}`);
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


  const getUserById = (id) => {
    let user = users.find(u => u.userId === id);
    return user || {given_name: '', family_name: ''};
  }
  async function addMember() {
    try {
      setIsLoading(true);
      const member = {
        userId: newMember,
        role: newMemberRole,
      };
      console.log("member", member);
      await makeApiCall("POST", `/workspaces/${workspaceId}/members`, member);
      members.push(member);
    } catch (e) {
      onError(e);
      
    }
    finally {
      setIsLoading(false);
      setIsAdding(false);
    }
  }
  async function deleteMember(userId) {
    return await makeApiCall("DELETE", `/workspaces/${workspaceId}/members/${userId}`);
  }


  // const nonMembers = () => users.filter(
  //   (user) => !members.some((member) => member.userId === user.userId)
  // );
  function generateRandomUsers(numUsers) {
    const users = [];
    for (let i = 1; i <= numUsers; i++) {
      const user = {
        Username: i,
        given_name: generateRandomName(),
        family_name: generateRandomName(),
      };
      users.push(user);
    }
    return users;
  }
  
  function generateRandomName() {
    const names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Luke", "Mia", "Nate", "Olivia", "Peter", "Quinn", "Rose", "Seth", "Tina", "Uma", "Violet", "Wyatt", "Xander", "Yvonne", "Zane"];
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
  }
  
  
  const nonMembers = () => randomUsers;

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
            {`Workspace : ${workspace.name}`}
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
                  return (
                    <Table.Row key={m.userId}>
                      <Table.Cell>
                        <Icon.Group size="large">
                          <Icon
                            size="big"
                            name="circle outline"
                            color="yellow"
                          />
                          <Icon size="small" name="users" color="black" />
                        </Icon.Group>
                      </Table.Cell>
                      <Table.Cell>
                        <strong>{getUserById(m.userId)}</strong>
                      </Table.Cell>
                      <Table.Cell>{m.role}</Table.Cell>
                      <Table.Cell>
                        <Button onClick={() => deleteMember(m.userId)}>
                          Remove
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          )}
          {!isAdding ? (
            <Button basic onClick={() => setIsAdding(true)}>
              Add Team Member
            </Button>
          ) : (
            <>
              <UserPicker
                users={nonMembers()}
                onChange={(userId) => setNewMember(userId)}
              />
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
              <Button basic onClick={addMember}>
                Add
              </Button>
              <Button basic onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </>
          )}
        </Grid.Column>
      </Grid>
    );
  }

  if (isLoading) return <Loader active />;

  return renderMembers();
}
