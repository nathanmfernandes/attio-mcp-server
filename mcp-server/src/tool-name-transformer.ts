/**
 * Tool Name Transformer for Attio MCP Server
 * Transforms auto-generated OpenAPI tool names into human-readable, organized names
 */

export interface ToolTransformation {
  originalName: string;
  humanReadableName: string;
  category: string;
  description?: string;
}

/**
 * Converts plural resource names to singular
 */
function getSingular(resourceName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'Attribute Statuses': 'Attribute Status',
    'List Entries': 'List Entry',
    'List Entry Attribute Values': 'List Entry Attribute Values',
    'Record Attribute Values': 'Record Attribute Values',
    'Record Entries': 'Record Entries',
    'Current User': 'Current User',
  };

  if (specialCases[resourceName]) {
    return specialCases[resourceName];
  }

  // Handle regular plurals
  if (resourceName.endsWith('ies')) {
    return resourceName.slice(0, -3) + 'y';
  } else if (resourceName.endsWith('ses')) {
    return resourceName.slice(0, -2);
  } else if (resourceName.endsWith('s')) {
    return resourceName.slice(0, -1);
  }

  return resourceName;
}

/**
 * Transforms a tool name from OpenAPI format to human-readable format
 * Examples:
 * - getv2objects -> List Objects
 * - postv2objects -> Create Object
 * - patchv2objectsbyobject -> Update Object
 * - deletev2objectsrecordsbyrecordid -> Delete Record
 */
export function transformToolName(originalName: string): ToolTransformation {
  // Extract the HTTP method and resource parts
  const methodMatch = originalName.match(/^(get|post|put|patch|delete)v2(.+)$/);
  if (!methodMatch) {
    return {
      originalName,
      humanReadableName: originalName,
      category: 'Other',
    };
  }

  const method = methodMatch[1];
  const resourcePath = methodMatch[2];

  // Determine the main resource type
  const resourceCategories = {
    objectsrecords: 'Records', // Check this before 'objects'
    listsentries: 'List Entries', // Check this before 'lists'
    objects: 'Objects',
    attributes: 'Attributes',
    lists: 'Lists',
    records: 'Records',
    entries: 'List Entries',
    workspacemembers: 'Workspace',
    notes: 'Notes',
    tasks: 'Tasks',
    threads: 'Threads',
    comments: 'Comments',
    webhooks: 'Webhooks',
    self: 'Authentication',
  };

  let category = 'Other';
  let mainResource = '';

  // Find the main resource from the path (check compound resources first)
  for (const [key, cat] of Object.entries(resourceCategories)) {
    if (resourcePath.startsWith(key)) {
      category = cat;
      mainResource = key;
      break;
    }
  }

  // Build human-readable name based on HTTP method
  const methodMap: Record<string, string> = {
    get: 'List',
    post: 'Create',
    put: 'Update',
    patch: 'Update',
    delete: 'Delete',
  };

  let action = methodMap[method] || method;

  // Handle special cases and patterns
  let humanReadableName = '';
  let resourceType = '';

  // Handle "by" patterns (e.g., getv2objectsbyobject)
  if (resourcePath.includes('by')) {
    const parts = resourcePath.split('by');
    resourceType = parts[0];
    const identifier = parts[1];

    // Special handling for single item retrieval
    if (method === 'get' && identifier) {
      action = 'Get';
    }
  } else {
    resourceType = resourcePath;
  }

  // Clean up resource type names
  const resourceNameMap: Record<string, string> = {
    objects: 'Objects',
    objectsrecords: 'Records',
    objectsrecordsattributesvalues: 'Record Attribute Values',
    objectsrecordsentries: 'Record Entries',
    attributes: 'Attributes',
    attributesoptions: 'Attribute Options',
    attributesstatuses: 'Attribute Statuses',
    lists: 'Lists',
    listsentries: 'List Entries',
    listsentriesattributesvalues: 'List Entry Attribute Values',
    workspacemembers: 'Workspace Members',
    notes: 'Notes',
    tasks: 'Tasks',
    threads: 'Comment Threads',
    comments: 'Comments',
    webhooks: 'Webhooks',
    self: 'Current User',
  };

  // Special handling for query endpoints
  if (resourcePath.endsWith('query')) {
    action = 'Query';
    resourceType = resourceType.replace('query', '');
  }

  // Get clean resource name
  const cleanResourceName =
    resourceNameMap[resourceType] ||
    resourceType.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (str) => str.toUpperCase());

  // Build the human-readable name
  if (resourcePath === 'self') {
    // Special case for self endpoint
    humanReadableName = 'Get Current User';
  } else if (action === 'List' && !resourcePath.includes('by')) {
    // For listing multiple items
    humanReadableName = `${action} ${cleanResourceName}`;
  } else if (action === 'Get' || (action === 'List' && resourcePath.includes('by'))) {
    // For getting a single item
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action} ${singular}`;
  } else if (action === 'Create') {
    // For creating items
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action} ${singular}`;
  } else if (action === 'Query') {
    humanReadableName = `${action} ${cleanResourceName}`;
  } else {
    // For update/delete operations
    const singular = getSingular(cleanResourceName);
    humanReadableName = `${action} ${singular}`;
  }

  return {
    originalName,
    humanReadableName,
    category,
  };
}

/**
 * Get all tool transformations for the Attio MCP server
 */
export function getAllToolTransformations(toolNames: string[]): Map<string, ToolTransformation> {
  const transformations = new Map<string, ToolTransformation>();

  for (const toolName of toolNames) {
    transformations.set(toolName, transformToolName(toolName));
  }

  return transformations;
}

/**
 * Groups tools by category for better organization
 */
export function groupToolsByCategory(
  transformations: Map<string, ToolTransformation>
): Map<string, ToolTransformation[]> {
  const grouped = new Map<string, ToolTransformation[]>();

  for (const transformation of transformations.values()) {
    const category = transformation.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(transformation);
  }

  // Sort tools within each category
  for (const [category, tools] of grouped.entries()) {
    tools.sort((a, b) => a.humanReadableName.localeCompare(b.humanReadableName));
  }

  return grouped;
}
