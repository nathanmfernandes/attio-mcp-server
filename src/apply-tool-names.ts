#!/usr/bin/env node
/**
 * Applies human-readable tool names to the MCP server
 * This script patches the index.ts file to transform tool names
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyToolNames() {
  // Apply to both source and build
  const sourcePath = path.join(__dirname, 'index.ts');
  const buildPath = path.join(__dirname, '..', 'build', 'index.js');

  try {
    // Process both source and build files
    for (const filePath of [sourcePath, buildPath]) {
      try {
        await applyToFile(filePath);
      } catch (err: any) {
        if (filePath === buildPath && err?.code === 'ENOENT') {
          // Build file not found, skip
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error('Error applying tool names:', error);
    process.exit(1);
  }
}

async function applyToFile(filePath: string) {
  // Read the current file
  let content = await fs.readFile(filePath, 'utf-8');

  // Check if already patched
  if (content.includes('humanToOriginalNameMap')) {
    return;
  }

  // Determine file type once
  const isTypeScript = filePath.endsWith('.ts');

  // Add import for transformer if not already present
  if (!content.includes("import { transformToolName } from './tool-name-transformer.js'")) {
    const importStatement = `import { transformToolName } from './tool-name-transformer.js';\n`;
    const lastImportMatch = content.match(/^import[^;]+;$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      content =
        content.slice(0, lastImportIndex + lastImport.length) +
        '\n' +
        importStatement +
        content.slice(lastImportIndex + lastImport.length);
    }
  }

  // Add tool name mapping storage after the toolDefinitionMap
  const mapTypeAnnotation = isTypeScript ? '<string, string>' : '';
  const toolMapDeclaration = `
/**
 * Map of human-readable names to original tool names
 */
const humanToOriginalNameMap = new Map${mapTypeAnnotation}();
const originalToHumanNameMap = new Map${mapTypeAnnotation}();

// Build the name mappings
for (const [originalName, definition] of toolDefinitionMap.entries()) {
  const transformation = transformToolName(originalName);
  humanToOriginalNameMap.set(transformation.humanReadableName, originalName);
  originalToHumanNameMap.set(originalName, transformation.humanReadableName);
}
`;

  // Insert after toolDefinitionMap declaration
  // Look for the closing pattern of the Map
  const mapEndPattern = /^\]\);/m;
  const mapStartPattern = /const toolDefinitionMap\s*=\s*new Map\(/;

  const startMatch = content.match(mapStartPattern);
  if (startMatch) {
    const startIndex = content.indexOf(startMatch[0]);
    const afterStart = content.slice(startIndex);
    const endMatch = afterStart.match(mapEndPattern);

    if (endMatch) {
      const insertIndex = startIndex + afterStart.indexOf(endMatch[0]) + endMatch[0].length;
      content = content.slice(0, insertIndex) + toolMapDeclaration + content.slice(insertIndex);
    }
  }

  // Update the ListToolsRequestSchema handler
  const listHandlerPattern =
    /server\.setRequestHandler\(ListToolsRequestSchema,\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\{\s*tools:\s*toolsForClient\s*\};\s*\}\);/s;
  // Use different handler based on file type
  const typeAnnotation = isTypeScript ? ': Tool[]' : '';
  const newListHandler = `server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient${typeAnnotation} = Array.from(toolDefinitionMap.values()).map((def) => {
    const transformation = transformToolName(def.name);
    return {
      name: transformation.humanReadableName,
      description: \`[\${transformation.category}] \${def.description}\`,
      inputSchema: def.inputSchema,
    };
  });
  
  // Sort tools by method order within categories
  toolsForClient.sort((a, b) => {
    // Extract category from description
    const categoryA = a.description?.match(/^\\[([^\\]]+)\\]/)?.[1] || 'Other';
    const categoryB = b.description?.match(/^\\[([^\\]]+)\\]/)?.[1] || 'Other';
    
    // First sort by category
    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }
    
    // Within the same category, sort by method order
    const methodA = a.name.split('_')[0];
    const methodB = b.name.split('_')[0];
    
    const methodOrder = ['list', 'get', 'create', 'update', 'delete', 'query'];
    const orderA = methodOrder.indexOf(methodA);
    const orderB = methodOrder.indexOf(methodB);
    
    if (orderA !== -1 && orderB !== -1) {
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    } else if (orderA !== -1) {
      return -1;
    } else if (orderB !== -1) {
      return 1;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  return { tools: toolsForClient };
});`;

  content = content.replace(listHandlerPattern, newListHandler);

  // Update the CallToolRequestSchema handler
  const callHandlerPattern = isTypeScript
    ? /server\.setRequestHandler\(\s*CallToolRequestSchema,\s*async\s*\(request:\s*CallToolRequest\):\s*Promise<CallToolResult>\s*=>\s*\{([^}]+)\}\s*\);/s
    : /server\.setRequestHandler\(\s*CallToolRequestSchema,\s*async\s*\(request\)\s*=>\s*\{([\s\S]*?)\}\s*\);/s;

  content = content.replace(callHandlerPattern, (_match, body) => {
    // Replace the toolName extraction and lookup
    const newBody = body.replace(
      /const\s*\{\s*name:\s*toolName[^}]+\}\s*=\s*request\.params;\s*const\s*toolDefinition\s*=\s*toolDefinitionMap\.get\(toolName\);/,
      `const { name: toolName, arguments: toolArgs } = request.params;
    
    // Convert human-readable name back to original
    const originalToolName = humanToOriginalNameMap.get(toolName) || toolName;
    const toolDefinition = toolDefinitionMap.get(originalToolName);`
    );

    // Update the executeApiTool call
    const finalBody = newBody.replace(
      /return\s+await\s+executeApiTool\(toolName,/,
      'return await executeApiTool(originalToolName,'
    );

    const requestParam = isTypeScript ? 'request: CallToolRequest' : 'request';
    const returnType = isTypeScript ? ': Promise<CallToolResult>' : '';

    return `server.setRequestHandler(
  CallToolRequestSchema,
  async (${requestParam})${returnType} => {${finalBody}}
);`;
  });

  // Write the updated content
  await fs.writeFile(filePath, content);
}

// Run the patch
applyToolNames().catch(console.error);
