import React, { useState } from 'react';
import DisplayText from "./DisplayText";
import { Button, Card, Divider, Header, Icon, Item, Label, Segment, Table, Grid, Input } from "semantic-ui-react";
import  pluralize from "pluralize";
import { capitalizeFirstLetter } from '../lib/helpers';
// data looks like this:
// node = {
//     content: 'markdown text',
//     type: 'process',
//     children: [same structure as node]
// }
export default function Tree({  data, onSave}) {
    const [currentDataNode, setCurrentDataNode] = useState(data);

  const EditNode = ({ initialValues, onSave }) => {
    const [values, setValues] = useState(initialValues || {});



    const handleSave = () => {
      onSave(values);
    };

    return (
      <div>
        <Input type="text"  value={values.content} onChange={(e) => setValues({...values, content: e.target.value})} />
        <Input type="text"  value={values.title} onChange={(e) => setValues({...values, title: e.target.value})} />
        <Button onClick={handleSave}>Save</Button>
      </div>
    );
  };

  const Node = ({ values,  onEdit, onChildClick }) => {
    const [isEditing, setIsEditing] = useState(false);
  
    const handleEdit = () => {
      setIsEditing(true);
    };

    const handleSave = (newValues) => {
      onEdit(newValues);
      setIsEditing(false);
    };
    const content = values.content;
    const title = values.title;
    const children = values.children;
    const parent = values.parent;

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
      <div>
        {isEditing ? (
          <EditNode initialValues={values} onSave={handleSave} />
        ) : (
          <div>
            <span>{content}</span>
            <p>{title}</p>
            <Button onClick={handleEdit}>Edit</Button>
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
                      <Item
                        key={index}
                        
                      >
                        <Item.Content>
                          <Item.Header>
                            <DisplayText text={child.title} />
                          </Item.Header>
                          <Item.Description>paragraph</Item.Description>
                          <Item.Extra>
                            <Button
                              basic
                              color="blue"
                              onClick={() => onChildClick({...child, parent: values})}
                            >
                              <Icon color="blue" name="cog" />
                              Details
                            </Button>
                          </Item.Extra>
                        </Item.Content>
                      </Item>
                    ))}
                  </Item.Group>
                </div>
              ))}
              {parent && <Segment><Button  color='blue'  onClick={() => onChildClick(parent)}><Icon name='arrow circle left'/>Back</Button></Segment> }
          </div>
        )}
      </div>
    );
  };

  return (
    <Node
      values={currentDataNode}
      onEdit={(newContent) => { 
        console.log(newContent)
        setCurrentDataNode({ ...currentDataNode, content: newContent })}}
      onChildClick={(c) => setCurrentDataNode(c)}
    />
  );

}





