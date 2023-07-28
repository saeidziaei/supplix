import React, { useEffect, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { Button, Icon } from "semantic-ui-react";
import "./WorkspacePicker.css";

export default function WorkspacePicker({
  workspaces,
  onChange,
  selectedWorkspaceId,
  allowNull 
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Update selectedIds when selectedWorkspaceId changes
    if (selectedWorkspaceId && data) {
      const node = data.find(
        (d) => d.metadata?.workspaceId === selectedWorkspaceId
      );
      if (node) {
        setSelectedIds([node.id]);
      }
    }
  }, [selectedWorkspaceId, data]);

  useEffect(() => {
    let workspacesData = workspaces.map((w) => ({
      ...w,
      parentId: w.parentId || "top",
    }));
    workspacesData.push({ workspaceId: "top", workspaceName: "" });

    //   const workspacesData = [
    //   { workspaceId: "top",  workspaceName: "" },
    //   { workspaceId: "xxx",  workspaceName: "abc", parentId: "top" },
    //   { workspaceId: "xxx2", workspaceName: "abc2", parentId: "xxx" },
    //   { workspaceId: "xxx3", workspaceName: "abc3", parentId: "top" },
    //   { workspaceId: "xxx4", workspaceName: "abc4", parentId: "xxx3" },
    //   { workspaceId: "xxx5", workspaceName: "abc5", parentId: "xxx" },
    //   { workspaceId: "xxx6", workspaceName: "abc6", parentId: "xxx5" },
    // ];

    // Convert the flat workspacesData to a tree structure
    const createWorkspaceTree = (data, parentId = null) =>
      data
        .filter((item) => item.parentId == parentId)
        .map((item) => ({
          name: item.workspaceName,
          children: createWorkspaceTree(data, item.workspaceId),
          metadata: item,
        }));

    const workspaceTree = createWorkspaceTree(workspacesData);

    const data = flattenTree(workspaceTree[0]);
    setData(data);
  }, [workspaces]);

  const handleSelect = ({ element, isSelected }) => {
    if (isSelected) {
      setSelectedIds([element.id]);
      onChange && onChange(element.metadata);
    }
  };

  if (!data) return;
  return (
    <>
      <div className="directory">
        <TreeView
          data={data}
          aria-label="directory tree"
          onSelect={handleSelect}
          selectedIds={selectedIds}
          nodeRenderer={({
            element,
            isBranch,
            isExpanded,
            getNodeProps,
            level,
          }) => (
            <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
              <Icon
                size="large"
                color="yellow"
                name={`folder${isExpanded ? " open" : ""}${
                  !isBranch ? " outline" : ""
                }`}
              />
              {element.name}
            </div>
          )}
        />
      </div>
      <div style={{marginTop: "10px"}}>
        {allowNull  &&
      <Button size="tiny" basic onClick={() => {setSelectedIds([]); onChange && onChange(null)}} >
        Clear
      </Button>}
      </div>
    </>
  );
}
