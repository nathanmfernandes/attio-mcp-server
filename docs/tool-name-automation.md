# Tool Name Automation System

This document describes the automated tool name transformation system implemented for the Attio MCP Server.

## Overview

The Attio MCP Server generates tool names directly from OpenAPI endpoints, resulting in technical names like `getv2objects`, `postv2objectsrecords`, etc. These names are difficult to read and navigate in AI assistant interfaces.

The tool name automation system transforms these technical names into human-readable, categorized names while maintaining backward compatibility.

## Features

### 1. Human-Readable Names
- `getv2objects` → `List Objects`
- `postv2objectsrecords` → `Create Record`
- `deletev2tasksbytaskid` → `Delete Task`
- `patchv2attributesstatusesbystatus` → `Update Attribute Status`

### 2. Automatic Categorization
Tools are organized into logical categories:
- **Objects**: Object management operations
- **Records**: Record CRUD operations
- **Attributes**: Attribute configuration
- **Lists**: List management
- **List Entries**: List entry operations
- **Tasks**: Task management
- **Notes**: Note operations
- **Comments**: Comment functionality
- **Threads**: Comment thread operations
- **Webhooks**: Webhook configuration
- **Workspace**: Workspace member management
- **Authentication**: User authentication

### 3. Category Prefixes in Descriptions
Each tool's description is prefixed with its category for better organization:
- `[Objects] Lists all system-defined and user-defined objects...`
- `[Records] Creates a new person, company or other record...`

## Implementation

### Components

1. **tool-name-transformer.ts**: Core transformation logic
   - `transformToolName()`: Transforms individual tool names
   - `getAllToolTransformations()`: Batch transformation
   - `groupToolsByCategory()`: Organizes tools by category

2. **apply-tool-names.ts**: Patches the MCP server files
   - Adds transformer import
   - Updates tool list handler to use transformed names
   - Updates tool call handler to map names bidirectionally
   - Works on both TypeScript source and JavaScript build

3. **Integration**: Automatic post-build step
   - Runs after `npm run build`
   - Patches both source and compiled files
   - Maintains compatibility with original tool names

### How It Works

1. **Pattern Recognition**: Extracts HTTP method and resource path from tool names
2. **Resource Identification**: Determines the main resource type (objects, records, etc.)
3. **Action Mapping**: Maps HTTP methods to readable actions:
   - `get` → `List` (for collections) or `Get` (for single items)
   - `post` → `Create` or `Query`
   - `put`/`patch` → `Update`
   - `delete` → `Delete`

4. **Smart Pluralization**: Handles singular/plural forms correctly
   - Lists keep plural form: `List Objects`
   - Single operations use singular: `Get Object`, `Create Record`

5. **Special Cases**: Handles edge cases like:
   - `getv2self` → `Get Current User`
   - Query endpoints: `postv2objectsrecordsquery` → `Query Records`
   - Compound resources: `objectsrecords` → Records category

## Usage

### Building with Transformed Names

```bash
npm run build
# Automatically applies transformations via postbuild hook
```

### Manual Application

```bash
npm run apply-tool-names
```

### Testing Transformations

```bash
# Run unit tests
npm test -- tool-name-transformer.test.ts

# Test with manual client
npm run test:manual
# Send: {"jsonrpc": "2.0", "method": "tools/list", "id": 1}
```

## Benefits

1. **Improved User Experience**: Tools are easier to find and understand
2. **Better Organization**: Categorization helps users navigate large tool sets
3. **Backward Compatibility**: Original tool names still work
4. **Automatic Updates**: Works with any OpenAPI-generated tool set
5. **Fast Rebuild**: Transformation happens at build time

## Future Enhancements

1. **Custom Categories**: Allow configuration of category mappings
2. **Description Enhancement**: Add more context to tool descriptions
3. **Search Integration**: Enable fuzzy search across transformed names
4. **Alias Support**: Multiple names for the same tool
5. **Localization**: Support for multiple languages