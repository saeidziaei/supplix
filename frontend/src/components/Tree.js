import React, { useState } from 'react';
import DisplayText from "./DisplayText";
import { Button, Card, Divider, Header, Icon, Item, Label, Segment, Table, Grid, Input, TextArea, Form, Breadcrumb } from "semantic-ui-react";
import  pluralize from "pluralize";
import { capitalizeFirstLetter } from '../lib/helpers';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkGfm  from 'remark-gfm';

export default function Tree({  data, onSave, startPath}) {
  const [tree, setTree] = useState(data);
  const [path, setPath] = useState(startPath || data.guid); // start from the top, use file system path model to go to children

  const EditNode = ({ initialValues, onSave }) => {
    const [values, setValues] = useState(initialValues || {});

    const handleSave = () => {
      onSave(values);
    };

    return (
      <Form>
        <Input type="text"  value={values.title} onChange={(e) => setValues({...values, title: e.target.value})} />
        <TextArea rows={12} type="text"  value={values.content} onChange={(e) => setValues({...values, content: e.target.value})} />
        <Button onClick={handleSave}>Save</Button>
      </Form>
    );
  };

  const Node = ({ values,  onEdit, onPathChange }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = (newValues) => {
      console.log("Node handleSave", newValues);
      onEdit(newValues);
      setIsEditing(false);
    };

    const content = values.content;
    const title = values.title;
    const children = values.children;
    const parentPath = getParentPath(path); 

    const groupedChildren = !children ? null : 
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
          <EditNode initialValues={values} onSave={handleSave} />
        ) : (
          <>
            
            <Header as="h3">{title}</Header>
            
            <ReactMarkdown children={content} remarkPlugins={[remarkGfm]}/>
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
            {groupedChildren &&
              groupedChildren.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <Divider horizontal>
                    <Header as="h2">
                      <Icon name="tag" />
                      { pluralize(capitalizeFirstLetter(group[0].type)) }
                    </Header>
                  </Divider>
                  <Item.Group divided>
                    {group.map((child, index) => (
                      <Item key={index}>
                        <Item.Content>
                          <Item.Header>
                            <DisplayText text={child.title} />
                          </Item.Header>
                          <Item.Description>paragraph</Item.Description>
                          <Item.Extra>
                            <Button
                              basic
                              color="blue"
                              onClick={() => onPathChange(path + "/" + child.guid)}
                            >
                              <Icon color="blue" name="expand" />
                              Details
                            </Button>
                          </Item.Extra>
                        </Item.Content>
                      </Item>
                    ))}
                  </Item.Group>
                </div>
              ))}
              {path && <><Divider/><Button  secondary  onClick={() => onPathChange(parentPath)}><Icon name='arrow circle left'/>Back</Button></> }
              
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

  function setNodeByPath(tree, path, newDataNode) {
    const pathArray = path.split('/').splice(1);
    let currentNode = tree;
    for (const guid of pathArray) {
      const nextNode = currentNode.children.find(child => child.guid === guid);
  
      if (!nextNode) return; // error , node not found
  
      currentNode = nextNode;
    }
  
    Object.assign(currentNode, newDataNode);

    return tree;
  }
  const currentDataNode = getNodeByPath(tree, path);
  
  return (
    <>
    { renderBreadcrumb(tree, path) }
    <Node
      values={currentDataNode}
      onEdit={(newDataNode) => { 
        setTree(setNodeByPath(tree, path, newDataNode));
        onSave(tree);
      }}
        
      onPathChange={(p) => setPath(p)}
    />
    </>
  );

}





