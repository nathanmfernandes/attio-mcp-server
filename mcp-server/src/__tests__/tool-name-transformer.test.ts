import {
  getAllToolTransformations,
  groupToolsByCategory,
  transformToolName,
} from '../tool-name-transformer.js';

describe('Tool Name Transformer', () => {
  describe('transformToolName', () => {
    test('transforms object operations correctly', () => {
      expect(transformToolName('getv2objects')).toEqual({
        originalName: 'getv2objects',
        humanReadableName: 'List Objects',
        category: 'Objects',
      });

      expect(transformToolName('postv2objects')).toEqual({
        originalName: 'postv2objects',
        humanReadableName: 'Create Object',
        category: 'Objects',
      });

      expect(transformToolName('getv2objectsbyobject')).toEqual({
        originalName: 'getv2objectsbyobject',
        humanReadableName: 'Get Object',
        category: 'Objects',
      });

      expect(transformToolName('patchv2objectsbyobject')).toEqual({
        originalName: 'patchv2objectsbyobject',
        humanReadableName: 'Update Object',
        category: 'Objects',
      });
    });

    test('transforms record operations correctly', () => {
      expect(transformToolName('postv2objectsrecordsquery')).toEqual({
        originalName: 'postv2objectsrecordsquery',
        humanReadableName: 'Query Records',
        category: 'Records',
      });

      expect(transformToolName('putv2objectsrecords')).toEqual({
        originalName: 'putv2objectsrecords',
        humanReadableName: 'Update Record',
        category: 'Records',
      });

      expect(transformToolName('deletev2objectsrecordsbyrecordid')).toEqual({
        originalName: 'deletev2objectsrecordsbyrecordid',
        humanReadableName: 'Delete Record',
        category: 'Records',
      });
    });

    test('transforms attribute operations correctly', () => {
      expect(transformToolName('getv2attributes')).toEqual({
        originalName: 'getv2attributes',
        humanReadableName: 'List Attributes',
        category: 'Attributes',
      });

      expect(transformToolName('postv2attributesoptions')).toEqual({
        originalName: 'postv2attributesoptions',
        humanReadableName: 'Create Attribute Option',
        category: 'Attributes',
      });

      expect(transformToolName('patchv2attributesstatusesbystatus')).toEqual({
        originalName: 'patchv2attributesstatusesbystatus',
        humanReadableName: 'Update Attribute Status',
        category: 'Attributes',
      });
    });

    test('transforms list operations correctly', () => {
      expect(transformToolName('getv2lists')).toEqual({
        originalName: 'getv2lists',
        humanReadableName: 'List Lists',
        category: 'Lists',
      });

      expect(transformToolName('postv2listsentries')).toEqual({
        originalName: 'postv2listsentries',
        humanReadableName: 'Create List Entry',
        category: 'List Entries',
      });

      expect(transformToolName('getv2listsentriesbyentryid')).toEqual({
        originalName: 'getv2listsentriesbyentryid',
        humanReadableName: 'Get List Entry',
        category: 'List Entries',
      });
    });

    test('transforms workspace operations correctly', () => {
      expect(transformToolName('getv2workspacemembers')).toEqual({
        originalName: 'getv2workspacemembers',
        humanReadableName: 'List Workspace Members',
        category: 'Workspace',
      });

      expect(transformToolName('getv2self')).toEqual({
        originalName: 'getv2self',
        humanReadableName: 'Get Current User',
        category: 'Authentication',
      });
    });

    test('transforms content operations correctly', () => {
      expect(transformToolName('postv2notes')).toEqual({
        originalName: 'postv2notes',
        humanReadableName: 'Create Note',
        category: 'Notes',
      });

      expect(transformToolName('getv2tasks')).toEqual({
        originalName: 'getv2tasks',
        humanReadableName: 'List Tasks',
        category: 'Tasks',
      });

      expect(transformToolName('postv2comments')).toEqual({
        originalName: 'postv2comments',
        humanReadableName: 'Create Comment',
        category: 'Comments',
      });
    });

    test('handles unknown patterns gracefully', () => {
      expect(transformToolName('unknownpattern')).toEqual({
        originalName: 'unknownpattern',
        humanReadableName: 'unknownpattern',
        category: 'Other',
      });
    });
  });

  describe('getAllToolTransformations', () => {
    test('transforms multiple tool names', () => {
      const toolNames = ['getv2objects', 'postv2notes', 'deletev2tasks'];
      const transformations = getAllToolTransformations(toolNames);

      expect(transformations.size).toBe(3);
      expect(transformations.get('getv2objects')).toEqual({
        originalName: 'getv2objects',
        humanReadableName: 'List Objects',
        category: 'Objects',
      });
    });
  });

  describe('groupToolsByCategory', () => {
    test('groups tools by category correctly', () => {
      const toolNames = [
        'getv2objects',
        'postv2objects',
        'getv2tasks',
        'postv2tasks',
        'getv2notes',
      ];

      const transformations = getAllToolTransformations(toolNames);
      const grouped = groupToolsByCategory(transformations);

      expect(grouped.size).toBe(3);
      expect(grouped.get('Objects')?.length).toBe(2);
      expect(grouped.get('Tasks')?.length).toBe(2);
      expect(grouped.get('Notes')?.length).toBe(1);
    });
  });
});
