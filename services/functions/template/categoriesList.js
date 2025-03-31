// it arranges the categories in a nested way ready for rendering
/*
so if we have something like this
[
  // Root level
  { category: "HR", templateId: "123"},
  { category: "Quality"},
  
  // Second level under Quality
  { category: "Quality/Forms", templateId: "456" },
  { category: "Quality/NCR", isParent: true },
  
  // Multiple templates in same category
  { category: "1.Safety", templateId: "789" },
  { category: "2.Safety", templateId: "012" },
  
  // Third level
  { category: "Quality/NCR/Templates", templateId: "345" }
]

it will return somethig like this
[
  { 
    category: "HR", 
    templateId: "123", 
    depth: 0 
  },
  { 
    category: "Quality", 
    isParent: true, 
    depth: 0, 
    children: [
      { 
        category: "Forms", 
        templateId: "456", 
        depth: 1 
      },
      { 
        category: "NCR", 
        isParent: true, 
        depth: 1, 
        children: [
          { 
            category: "Templates", 
            templateId: "345", 
            depth: 2 
          }
        ] 
      }
    ]
  },
  { 
    category: "1.Safety", 
    templateId: "789", 
    depth: 0 
  },
  { 
    category: "2.Safety", 
    templateId: "012", 
    depth: 0 
  }
] 
  */


import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,
    KeyConditionExpression: "tenant = :tenant",
    FilterExpression: "attribute_not_exists(isDeleted) OR isDeleted = :isDeletedValue", // Filter out deleted records
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":isDeletedValue": false,
    },
  };

  const result = await dynamoDb.query(params);
  const items = result.Items;

  // First, organize templates by their full category path and ensure all parent paths exist
  const categoryMap = new Map();
  
  items.forEach((item) => {
    const category = item.templateDefinition?.category || "Uncategorized";
    
    // Create all parent paths
    const parts = category.split('/');
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath = index === 0 ? part : `${currentPath}/${part}`;
      if (!categoryMap.has(currentPath)) {
        categoryMap.set(currentPath, []);
      }
    });
    
    // Add template to its category
    categoryMap.get(category).push({
      templateId: item.templateId,
      category: category
    });
  });

  // Build category tree
  function buildCategoryTree(path = '', depth = 0) {
    const result = [];
    
    // Get direct templates for this path
    const templatesInCategory = categoryMap.get(path) || [];
    
    // Get immediate children
    const childPaths = Array.from(categoryMap.keys())
      .filter(cat => {
        if (path === '') {
          return !cat.includes('/');
        }
        return cat.startsWith(`${path}/`) && cat.split('/').length === path.split('/').length + 1;
      });

    // Handle current level templates
    if (path !== '') {  // Skip root level special handling
      const category = path.split('/').pop();
      const node = {
        category: category,
        depth: depth
      };

      // Add templates if they exist
      if (templatesInCategory.length === 1) {
        node.templateId = templatesInCategory[0].templateId;
      } else if (templatesInCategory.length > 1) {
        // Return multiple nodes for multiple templates
        return templatesInCategory.map((template, index) => ({
          category: `${index + 1}.${category}`,
          templateId: template.templateId,
          depth: depth
        }));
      }

      // Add children if they exist
      if (childPaths.length > 0) {
        node.isParent = true;
        node.children = [];
        childPaths.forEach(childPath => {
          const childResult = buildCategoryTree(childPath, depth + 1);
          if (Array.isArray(childResult)) {
            node.children.push(...childResult);
          } else {
            node.children.push(childResult);
          }
        });
      }

      return node;
    }

    // Process root level
    childPaths.forEach(categoryPath => {
      const categoryResult = buildCategoryTree(categoryPath, depth + 1);
      if (Array.isArray(categoryResult)) {
        result.push(...categoryResult);
      } else {
        result.push(categoryResult);
      }
    });

    return result;
  }

  return buildCategoryTree();
});

