// TODO !!! dompurify - sanitize html input
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Breadcrumb,
  Button,
  Confirm,
  Divider,
  Form,
  Header,
  Icon,
  Input,
  Item,
  Label,
  Loader,
  Popup
} from "semantic-ui-react";
import { v4 as uuidv4 } from "uuid";
import DisplayText from "../components/DisplayText";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter } from "../lib/helpers";
import "./ISO.css";
import { useAppContext } from "../lib/contextLib";

export default function ISO() {
  const [tree, setTree] = useState(null);
  const [savedTree, setSavedTree] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [path, setPath] = useState(""); // start from the top, use file system path model to go to children
  const { currentUserRoles } = useAppContext();
  

  useEffect(() => {
    window.history.pushState({ path }, path, `?path=${path}`);
  }, [path]);

  useEffect(() => {
    if (savedTree != tree) handleSubmit(tree);
  }, [tree]);

  const EditNode = ({ initialValues, onSave, onCancel }) => {
    const [values, setValues] = useState(initialValues || {});
    const [selectedTab, setSelectedTab] = React.useState("write");

    const handleSave = () => {
      onSave(values);
    };
    const handleCancel = () => {
      onCancel();
    };
    return (
      <Form>
        <Input
          labelPosition="left"
          fluid
          type="text"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
        >
          <Label basic>Title</Label>
          <input />
        </Input>
        <Divider hidden />
        <Input
          labelPosition="right"
          type="text"
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
        >
          <Label basic>Type</Label>
          <input />
          <Label>
            <i>Process, Sub-process, Manual, etc.</i>
          </Label>
        </Input>

        <Divider hidden />
        <Header as="h4">Content</Header>
        <CKEditor
          editor={ClassicEditor}
          data={values.content}
          onBlur={(event, editor) => {
            const data = editor.getData();
            setValues({ ...values, content: data });
          }}
        />

        <Button
          circular
          size="small"
          icon="arrow left"
          onClick={handleCancel}
        />
        <Button
          circular
          positive
          size="small"
          icon="check"
          onClick={handleSave}
        />
      </Form>
    );
  };

  const Node = ({
    values,
    readonly,
    onEdit,
    onPathChange,
    onAddChild,
    onDelete,
    onMoveChildUp,
    onMoveChildDown,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [content, setContent] = useState(values.content);
    const [deleteConfirm, setDeleteConfirm] = useState({open: false});
  
    useEffect(() => {
      async function prepContent(text) {
        const libraryRegex = /!\[library\]\(\/workspace\/([a-f\d-]+)\/doc\/([a-f\d-]+)\)/g;

        let match = libraryRegex.exec(text);
        while (match) {
          const workspaceId = match[1];
          const docId = match[2];

          let replacement = '';
          try {
            const result = await makeApiCall("GET", `/workspaces/${workspaceId}/docs/${docId}`);
            const { data } = result ?? {}; // result also contains workspace which we don't need here
            const { fileURL, note }= data ?? {};
            replacement = `<img alt="${note}" src="${fileURL}"/>`;
          } catch (e) {
            replacement = "library item not found";
          }
          text = text.replace(match[0], replacement);
          match = libraryRegex.exec(text);

        }

        const urlRegex = /\!\[external\]\((https?:\/\/[^\)]+)\)/g; // matches ![external](URL)
        match = urlRegex.exec(text);
        while (match) {
          const url = match[1];
          
          const replacement = `<img alt="external image" src="${url}"/>`;
          text = text.replace(match[0], replacement);

          match = urlRegex.exec(text);
        }

        return text;
      }
      async function onLoad() {
        try {
          const preppedContent = await prepContent(content);

          setContent(preppedContent);
        } catch (e) {
          onError(e);
        }

        setIsLoading(false);
      }

      onLoad();
    }, [content]);

    const handleSave = (newValues) => {
      onEdit(newValues);
      setIsEditing(false);
    };

    const title = values.title;
    const children = values.children || [];
    const type = values.type;
    const parentPath = getParentPath(path);

    const canBeDeleted = children.length == 0;

    const groupedChildren =
      children.length == 0
        ? []
        : children.reduce((result, child) => {
            const group = result.find((group) => group[0].type === child.type);

            if (group) {
              group.push(child);
            } else {
              result.push([child]);
            }

            return result;
          }, []);

    return (
      <>
        {isEditing ? (
          <EditNode
            initialValues={values}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <Header as="h3">{title}</Header>
            <Label>{type}</Label>
            <Divider hidden />
            {isCompact && (
              <>
                <Icon
                  name="chevron right"
                  size="small"
                  color="grey"
                  onClick={() => setIsCompact(false)}
                />
                Expand
                <Divider />
              </>
            )}
            {!isCompact && (
              <>
                <Icon
                  name="chevron down"
                  size="small"
                  color="grey"
                  onClick={() => setIsCompact(true)}
                />
                {isLoading ? (
                  <Loader active />
                ) : (
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </>
            )}
            {!readonly && (
            <Button
              circular
              basic
              size="small"
              icon="pencil"
              color="black"
              onClick={() => setIsEditing(true)}
            />)}
            {path && (
              <>
               <Confirm
                        size="mini"
                        header="This will delete the node."
                        open={deleteConfirm.open}
                        onCancel={() => setDeleteConfirm({ open: false })}
                        onConfirm={() => {
                          if (canBeDeleted) onDelete(path);
                          setDeleteConfirm({ open: false });
                        }}
                      />
                      {!readonly && (
              <Popup
                content={
                  canBeDeleted
                    ? "Delete this node"
                    : "This node has children and cannot be deleted."
                }
                trigger={
                  <Button
                    circular
                    basic
                    size="small"
                    icon="x"
                    color={canBeDeleted ? "red" : "grey"}
                    onClick={() => {
                      setDeleteConfirm({ open: true });
                    }}
                  />
                }
              />)}
              </>
            )}
            {groupedChildren.length == 0 && !readonly && (
              <Button
                basic
                color="black"
                size="mini"
                onClick={() => {
                  const newChild = {
                    type: "child",
                    title: "New",
                    content: "New",
                    guid: uuidv4(),
                  };
                  onAddChild(newChild);
                }}
              >{`New child`}</Button>
            )}
            {groupedChildren &&
              groupedChildren.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <Divider horizontal>
                    <Header as="h4">
                      <Label tag color="grey">
                        {pluralize(capitalizeFirstLetter(group[0].type || ""))}
                      </Label>
                    </Header>
                  </Divider>
                  <Item.Group >
                    {group.map((child, index) => (
                      <Item key={index} className="iso-item">
                        <Item.Content>
                        
                          <Button
                            circular
                            basic
                            icon="ellipsis horizontal"
                            size="mini"
                            onClick={() =>
                              onPathChange(path + "/" + child.guid)
                            }
                          /> 
                          <Item.Header> <DisplayText text={child.title} /></Item.Header>
                          
                          {!readonly && index > 0 && (
                            <Button
                              size="mini"
                              floated="right"
                              basic
                              circular
                              icon="arrow up"
                              onClick={() => onMoveChildUp(child.guid)}
                            />
                          )}
                          {!readonly && index < group.length - 1 && (
                            <Button
                              size="mini"
                              floated="right"
                              basic
                              circular
                              icon="arrow down"
                              onClick={() => onMoveChildDown(child.guid)}
                            />
                          )}
                        </Item.Content>
                      </Item>
                    ))}
                    <Item>
                      {!readonly && (<Button
                        basic
                        color="black"
                        size="tiny"
                        onClick={() => {
                          const newChild = {
                            type: group[0].type,
                            title: "New",
                            content: "New",
                            guid: uuidv4(),
                          };
                          onAddChild(newChild);
                        }}
                      >{`New ${group[0].type}`}</Button>)}
                    </Item>
                  </Item.Group>
                </div>
              ))}
            {path && (
              <>
                <Divider />
                <Button secondary onClick={() => onPathChange(parentPath)}>
                  <Icon name="arrow circle left" />
                  Back
                </Button>
              </>
            )}
          </>
        )}
      </>
    );
  };
  function getParentPath(path) {
    return path.substring(0, path.lastIndexOf("/"));
  }
  function getNodeByPath(tree, path) {
    const pathArray = path.split("/").splice(1);
    let currentNode = tree;
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(
        (child) => child.guid === guid
      );

      if (!nextNode) return null;

      currentNode = nextNode;
    }

    return currentNode;
  }

  function renderBreadcrumb(tree, path) {
    const pathArray = path.split("/").splice(1);
    let currentNode = tree;
    let subPath = "";
    let crumbs = [{ label: "Home", path: subPath }];
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(
        (child) => child.guid === guid
      );
      subPath += "/" + nextNode.guid;
      crumbs.push({ label: nextNode.title, path: subPath });
      if (!nextNode) return null;

      currentNode = nextNode;
    }

    return (
      <>
        <Breadcrumb size="tiny">
          {crumbs.slice(0, -1).map((crumb, index) => (
            <span key={index}>
              <Breadcrumb.Section link onClick={() => setPath(crumb.path)}>
                {crumb.label}
              </Breadcrumb.Section>
              <Breadcrumb.Divider icon="right chevron" />
            </span>
          ))}
          <Breadcrumb.Section active>
            {crumbs[crumbs.length - 1].label}
          </Breadcrumb.Section>
        </Breadcrumb>
        <Divider hidden />
      </>
    );
  }
  function deleteNodeByPath(tree, path) {
    // find the parent and delete this child
    const parentPath = getParentPath(path);
    const guidToDelete = path.substring(path.lastIndexOf("/") + 1);

    const pathArray = parentPath.split("/").splice(1);
    const updatedTree = JSON.parse(JSON.stringify(tree));

    let currentNode = updatedTree;
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(
        (child) => child.guid === guid
      );

      if (!nextNode) return null; // error , node not found

      currentNode = nextNode;
    }

    currentNode.children = currentNode.children.filter(
      (child) => child.guid !== guidToDelete
    );

    setPath(parentPath);
    setTree(updatedTree);
  }
  function addNodeToPath(tree, path, newDataNode) {
    const updatedTree = JSON.parse(JSON.stringify(tree));
    const currentNode = getNodeByPath(updatedTree, path);

    if (!currentNode.children) currentNode.children = [];
    currentNode.children.push(newDataNode);

    setTree(updatedTree);
  }
  function setNodeByPath(tree, path, newDataNode) {
    const updatedTree = JSON.parse(JSON.stringify(tree));
    let currentNode = getNodeByPath(updatedTree, path);

    Object.assign(currentNode, newDataNode);

    setTree(updatedTree);
  }
  function moveChild(tree, path, childGuid, direction) {
    const updatedTree = JSON.parse(JSON.stringify(tree));
    let currentNode = getNodeByPath(updatedTree, path);
    let array = currentNode.children;
    for (let i = 0; i < array.length; i++) {
      if (array[i].guid === childGuid) {
        if (direction === "up" && i > 0) {
          // Swap the current object with the one above it
          [array[i], array[i - 1]] = [array[i - 1], array[i]];
          break;
        } else if (direction === "down" && i < array.length - 1) {
          // Swap the current object with the one below it
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          break;
        }
      }
    }

    setTree(updatedTree);
  }


  useEffect(() => {
    async function loadProcess() {
      return await makeApiCall(
        "GET",
        `/isos/top-level` // returns one item (top level))
      );
    }

    async function onLoad() {
      try {
        const item = await loadProcess();

        setTree(item.tree);
        setSavedTree(item.tree);

        const urlPath = searchParams.get("path");
        setPath(urlPath || "");
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
    }, []);

  async function handleSubmit(data) {
    setIsLoading(true);
    try {
      await updateProcess(data);
      setTree(data);
      setSavedTree(data);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProcess(tree) {
    return await makeApiCall("PUT", `/isos/top-level`, {
      tree: tree,
    });
  }

  if (isLoading) return <Loader active />;

  const currentDataNode = getNodeByPath(tree, path);

  if (!currentDataNode) return <Header>Nothing to see here!</Header>;
  const isAdmin = currentUserRoles.includes("admins");

  return (
    <>
      {renderBreadcrumb(tree, path)}
      <Node
        values={currentDataNode}
        readonly={!isAdmin}
        onEdit={(newDataNode) => setNodeByPath(tree, path, newDataNode)}
        onAddChild={(newDataNode) => {
          addNodeToPath(tree, path, newDataNode);
          setPath(path + "/" + newDataNode.guid);
        }}
        onDelete={(p) => deleteNodeByPath(tree, p)}
        onPathChange={(p) => setPath(p)}
        onMoveChildDown={(childGuid) =>
          moveChild(tree, path, childGuid, "down")
        }
        onMoveChildUp={(childGuid) => moveChild(tree, path, childGuid, "up")}
      />
    </>
  );
}
