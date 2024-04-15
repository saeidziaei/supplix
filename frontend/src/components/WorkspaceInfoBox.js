import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Label,
  Icon,
  Table,
  Accordion,
  Breadcrumb,
  BreadcrumbSection,
  BreadcrumbDivider,
} from "semantic-ui-react";
import { formatDate } from "../lib/helpers";
import "./WorkspaceInfoBox.css";

export const WorkspaceInfoBox = ({ workspace, editable, leafFolder="" }) => {
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
  const navigateToWorkspace = (id) => {
    if (id) nav(`/?id=${id}`);
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
      <Accordion.Title active={isExpanded} index={1}>
        <Label color={workspaceId === "NCR" ? "red" : ""} size="large">
          <Breadcrumb>
            {workspace.parent && workspace.parent.parent && (
              <>
                <BreadcrumbSection link onClick={() =>navigateToWorkspace(workspace.parent.parent.workspaceId)}>{workspace.parent.parent.workspaceName}</BreadcrumbSection>
                <BreadcrumbDivider icon="right chevron" />
              </>
            )}
            {workspace.parent && (
              <>
                <BreadcrumbSection link onClick={() => navigateToWorkspace(workspace.parent.workspaceId)}>{workspace.parent.workspaceName}</BreadcrumbSection>
                <BreadcrumbDivider icon="right chevron" />
              </>
            )}
            {leafFolder ? 
              (<>
              <BreadcrumbSection link onClick={() => navigateToWorkspace(workspace.workspaceId)}>{workspace.workspaceName}</BreadcrumbSection>
              <BreadcrumbDivider icon="right chevron" />
            </>)
            :
              (<BreadcrumbSection active>{workspace.workspaceName}</BreadcrumbSection >) 
            }
              
            {leafFolder && (
              <BreadcrumbSection active>{leafFolder}</BreadcrumbSection>
            )}
          </Breadcrumb>
        </Label>

        {hasContent() && (
          <Icon name="dropdown" onClick={() => setIsExpanded(!isExpanded)} />
        )}
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
