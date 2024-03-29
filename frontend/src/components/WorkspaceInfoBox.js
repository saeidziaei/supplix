import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Label,
  Icon,
  Table,
  Accordion,
  Breadcrumb,
} from "semantic-ui-react";
import { formatDate } from "../lib/helpers";
import "./WorkspaceInfoBox.css";

export const WorkspaceInfoBox = ({ workspace, editable }) => {
  const nav = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    workspaceId,
    workspaceName,
    workspaceStatus,
    category,
    clientName,
    startDate,
    endDate,
    note,
  } = workspace ?? {};

  const canEdit = workspaceId && (editable || workspace?.role === "Owner");

  const getWorkspaceWithParents = (workspace) => {
    const workspaceWithParents = [];
    let parent = workspace?.parent;
    while (parent) {
      workspaceWithParents.unshift(parent);
      parent = parent.parent;
    }
    return workspaceWithParents;
  };
  const workspaceWithParents = getWorkspaceWithParents(workspace);

  const handleEditButtonClick = () => {
    nav(`/workspace/${workspaceId}`);
  };
  const handleWorkspaceParentClick = () => {
    if (workspace.parentId) nav(`/?id=${workspace.parentId}`);
    else nav("/");
  };
  const getStatusColor = () => {
    switch (workspaceStatus) {
      case "Completed":
        return "green";

      case "Blocked":
        return "red";

      case "Cancelled":
        return "pink";

      default:
        return "grey";
    }
  };
  const hasContent = () => workspaceId !== "NCR";
  if (!workspace) return null;
  return (
    <Accordion styled className="wsinfobox" fluid>
      <Accordion.Title
        active={isExpanded}
        index={1}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Label ribbon color={workspaceId === "NCR" ? "red" : "yellow"}>
          {workspaceName}
        </Label>
        {hasContent() && <Icon name="dropdown" />}
        
        <Button
          basic
          circular
          size="tiny"
          icon="angle up"
          floated="right"
          onClick={handleWorkspaceParentClick}
        />
      </Accordion.Title>
      {hasContent() && (
        <Accordion.Content active={isExpanded}>
          {canEdit && (
            <Button
              basic
              circular
              size="tiny"
              icon="edit"
              floated="right"
              onClick={handleEditButtonClick}
            />
          )}
          <Table basic="very" celled compact>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <strong>Name:</strong>
                </Table.Cell>
                <Table.Cell>{workspaceName}</Table.Cell>
              </Table.Row>
              {workspace.parent && (
                <Table.Row>
                  <Table.Cell>
                    <strong>Parent:</strong>
                  </Table.Cell>
                  <Table.Cell>
                    <Breadcrumb>
                      {workspaceWithParents.map((workspace, index) => (
                        <span key={workspace.workspaceId}>
                          <Breadcrumb.Section>
                            {workspace.workspaceName}
                          </Breadcrumb.Section>
                          {index !== workspaceWithParents.length - 1 && (
                            <Breadcrumb.Divider icon="right chevron" />
                          )}
                        </span>
                      ))}
                    </Breadcrumb>
                  </Table.Cell>
                </Table.Row>
              )}
              <Table.Row>
                <Table.Cell>
                  <strong>Status:</strong>
                </Table.Cell>
                <Table.Cell>
                  <Label color={getStatusColor()}>{workspaceStatus}</Label>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>Category:</strong>
                </Table.Cell>
                <Table.Cell>{category}</Table.Cell>
              </Table.Row>

              <Table.Row>
                <Table.Cell>
                  <strong>Client Name:</strong>
                </Table.Cell>
                <Table.Cell>{clientName}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>Start Date:</strong>
                </Table.Cell>
                <Table.Cell>{formatDate(startDate)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <strong>End Date:</strong>
                </Table.Cell>
                <Table.Cell>{formatDate(endDate)}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Accordion.Content>
      )}
    </Accordion>
  );
};
