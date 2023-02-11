import React, { useState, useEffect } from 'react';
import "./ISO.css";
import { onError } from "../lib/errorLib";
import { JwtApi } from "../lib/apiLib";
import { Loader } from "semantic-ui-react";
import DisplayText from '../components/DisplayText';
import { Button, Divider, Header, Icon, Item, Label, Segment, Table, Grid, Input, TextArea, Form, Breadcrumb, Popup } from "semantic-ui-react";
import  pluralize from "pluralize";
import { capitalizeFirstLetter } from '../lib/helpers';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm  from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'react-router-dom';


export default function ISO() {
  const customerIsoId = "iso-123";
  const callJwtAPI = JwtApi();
  const [tree, setTree] = useState(null);
  const [savedTree, setSavedTree] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // const location = useLocation();
  // const pathInURL = new URLSearchParams(location.search).get('path');
  // alert(pathInURL);
  const [path, setPath] = useState(""); // start from the top, use file system path model to go to children
  useEffect(() => {
    window.history.pushState({ path }, path, `?path=${path}`);
  }, [path]);

  useEffect(() => {
    if (savedTree != tree)
      handleSubmit(tree);
  }, [tree]);

  const EditNode = ({ initialValues, onSave, onCancel }) => {
    const [values, setValues] = useState(initialValues || {});

    const handleSave = () => {
      onSave(values);
    };
    const handleCancel = () => {
      onCancel();
    };
    return (
      <Form>
        <Input label="Title" type="text"  value={values.title} onChange={(e) => setValues({...values, title: e.target.value})} />
        <Input label="Type" type="text"  value={values.type} onChange={(e) => setValues({...values, type: e.target.value})} />
        <TextArea rows={22} type="text"  value={values.content} onChange={(e) => setValues({...values, content: e.target.value})} />
        <Button circular size='small' icon="arrow left" onClick={handleCancel} />
        <Button circular positive size='small' icon="check" onClick={handleSave} />
      </Form>
    );
  };

  const Node = ({ values,  onEdit, onPathChange, onAddChild, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCompact, setIsCompact] =useState(false);

    const handleSave = (newValues) => {
      onEdit(newValues);
      setIsEditing(false);
    };

    const content = values.content;
    const title = values.title;
    const children = values.children || [];
    const type = values.type;
    const parentPath = getParentPath(path); 

    const canBeDeleted = children.length == 0;

    const groupedChildren = children.length == 0 ? [] : 
        children.reduce((result, child) => {
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
            { isCompact && <><Icon name='chevron right' size='small' color='grey' onClick={() => setIsCompact(false)}/>Expand<Divider /></>}
            { !isCompact && <><Icon name='chevron down' size='small' color='grey' onClick={() => setIsCompact(true)}/> 
            <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} /></> }
            <Button circular basic size='small' icon="pencil" color='blue' onClick={() => setIsEditing(true)}/>
            { path && <Popup content={canBeDeleted ? "Delete this node" : "This node has children and cannot be deleted."} trigger={
            <Button  circular basic size='small' icon="x" color={canBeDeleted ? "red" : "grey"} onClick={() => { if(canBeDeleted) onDelete(path);}} /> } /> }
            { groupedChildren.length == 0 && (
              <Button
                basic
                color="green"
                size="tiny"
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
                    <Header as="h3" >
                      <Icon name="tag" />
                      {pluralize(capitalizeFirstLetter(group[0].type))}
                    </Header>
                  </Divider>
                  <Item.Group divided>
                    {group.map((child, index) => (
                      <Item key={index}>
                        <Item.Content>
                          <Item.Header>
                            <DisplayText text={child.title} />
                          </Item.Header>
                          <Item.Description></Item.Description>
                          <Item.Extra>
         
                            <Button
                              basic
                              onClick={() =>
                                onPathChange(path + "/" + child.guid)
                              }
                            >
                              <Icon color="blue" name="expand" />
                              Details
                            </Button>
                          </Item.Extra>
                        </Item.Content>
                      </Item>
                    ))}
                    <Item>
                      <Button
                        basic
                        color="green"
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
                      >{`New ${group[0].type}`}</Button>
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
    return path.substring(0, path.lastIndexOf('/'));
  }
  function getNodeByPath(tree, path) {
    const pathArray = path.split('/').splice(1);
    let currentNode = tree;
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(child => child.guid === guid);
  
      if (!nextNode) return null;
  
      currentNode = nextNode;
    }
  
    return currentNode;
  }

  function renderBreadcrumb(tree, path) {
    const pathArray = path.split('/').splice(1);
    let currentNode = tree;
    let subPath = "";
    let crumbs = [{label:"Home", path: subPath}];
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(child => child.guid === guid);
      subPath += "/" + nextNode.guid;
      crumbs.push({label: nextNode.title, path: subPath})
      if (!nextNode) return null;
  
      currentNode = nextNode;
    }
    
    return (<>
    <Breadcrumb size='massive'>
      {crumbs.slice(0, -1).map((crumb, index) => <span key={index}>
        <Breadcrumb.Section link onClick={() => setPath(crumb.path)}>{crumb.label}</Breadcrumb.Section>
        <Breadcrumb.Divider icon='right chevron' />
      </span>)
      }
    <Breadcrumb.Section active>{crumbs[crumbs.length - 1].label}</Breadcrumb.Section>

    </Breadcrumb>
    <Divider hidden /></>
    );
  
  }
  function deleteNodeByPath(tree, path) {
    // find the parent and delete this child
    const parentPath = getParentPath(path);
    const guidToDelete = path.substring(path.lastIndexOf("/") + 1);
    console.log("parentPath", parentPath, "guidToDelete", guidToDelete);
    const pathArray = parentPath.split('/').splice(1);
    const updatedTree = JSON.parse(JSON.stringify(tree));

    let currentNode = updatedTree;
    for (const guid of pathArray) {
      
      const nextNode = currentNode.children.find(child => child.guid === guid);
  
      if (!nextNode) return null; // error , node not found
        
      currentNode = nextNode;
    }
    
    currentNode.children = currentNode.children.filter(child => child.guid !== guidToDelete);

    setPath(parentPath);
    setTree(updatedTree);    
  }
  function addNodeToPath(tree, path, newDataNode) {
    const pathArray = path.split('/').splice(1);
    const updatedTree = JSON.parse(JSON.stringify(tree));

    let currentNode = updatedTree;
    for (const guid of pathArray) {
      
      const nextNode = currentNode.children.find(child => child.guid === guid);
  
      if (!nextNode) return null; // error , node not found
        
      currentNode = nextNode;
    }
    if (!currentNode.children)
      currentNode.children = [];
    currentNode.children.push(newDataNode);
    
    setTree(updatedTree);
  }
  function setNodeByPath(tree, path, newDataNode) {
    const pathArray = path.split('/').splice(1);

    const updatedTree = JSON.parse(JSON.stringify(tree));
    let currentNode = updatedTree;
    for (const guid of pathArray) {
      
      const nextNode = currentNode.children.find(child => child.guid === guid);
  
      if (!nextNode) return null; // error , node not found
   
      currentNode = nextNode;
    }
  
    Object.assign(currentNode, newDataNode);

    setTree(updatedTree);
  }
  const currentDataNode = getNodeByPath(tree, path);

  useEffect(() => {
    function loadProcess() {
      return callJwtAPI(
        "GET",
        `/customer-isos/${customerIsoId}/processes/top-level` // returns one item (top level)
      );
    }

    async function onLoad() {
      try {
        const item = await loadProcess();

        setTree(item.tree);

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


  function updateProcess(tree) {
    return callJwtAPI(
      "PUT",
      `/customer-isos/${customerIsoId}/processes/top-level`,
      {
        tree: tree,
      }
    );
  }
  if (isLoading) return <Loader active />;


  return (
    <>
    { renderBreadcrumb(tree, path) }
    <Node
      values={currentDataNode}
      onEdit={(newDataNode) => setNodeByPath(tree, path, newDataNode) }
      onAddChild={(newDataNode) => {addNodeToPath(tree, path, newDataNode);  setPath(path + "/" + newDataNode.guid)} }
      onDelete={(p) => deleteNodeByPath(tree, p) }
      onPathChange={(p) => setPath(p)}
    />
    </>
  );
}
