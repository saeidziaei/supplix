import React from "react";
import { List } from "semantic-ui-react";

export default function WorkspaceTree({ workspaces, selectedCategory, selectedSubCategory, onChange, disabled = false }) {
  const getCategorySubCategories = (workspaces) => {
    if (!workspaces || workspaces.length < 1) return [];

    const categoriesMap = new Map();

    workspaces.forEach((workspace) => {
      const { category, subCategory } = workspace;
      if (category) {
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }
        if (subCategory && !categoriesMap.get(category).includes(subCategory)) {
          categoriesMap.get(category).push(subCategory);
        }
      }
    });

    const categoriesWithSubCategories = Array.from(
      categoriesMap,
      ([category, subCategories]) => ({
        category,
        subCategories,
      })
    );

    return categoriesWithSubCategories;
  };


  const categorySubCategories = getCategorySubCategories(workspaces);
  return (
    <List divided relaxed size="small" style={{cursor: "pointer"}}>
      <List.Item>
        <List.Icon name="folder open" color="yellow" size="large" />
        <List.Content>
          <List.Header onClick={() => onChange("ALL", "ALL")}>All</List.Header>
          <List.List>

            {categorySubCategories.map(({ category, subCategories }) => (
              <List.Item key={category}   onClick={() => onChange(category, "ALL")}>
                <List.Icon name="folder" color={selectedCategory === category ? "orange" : "yellow"} size="large" />
                <List.Content>
                  <List.Header >
                    {category}
                  </List.Header>
                  <List.List>
                    {subCategories.map((subCategory) => (
                      <List.Item key={subCategory}  onClick={(event) => { event.stopPropagation(); onChange(category, subCategory)}}>
                        <List.Icon name="folder" color={selectedSubCategory === subCategory ? "orange" : "yellow"} size="large" />
                        <List.Content>
                          {subCategory}
                        </List.Content>
                      </List.Item>
                    ))}
                  </List.List>
                </List.Content>
              </List.Item>
            ))}
          </List.List>
        </List.Content>
      </List.Item>
    </List>



  );
}
