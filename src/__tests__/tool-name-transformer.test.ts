import { describe, test, expect } from 'bun:test';
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
        humanReadableName: 'list_objects',
        category: 'Objects',
      });

      expect(transformToolName('postv2objects')).toEqual({
        originalName: 'postv2objects',
        humanReadableName: 'create_object',
        category: 'Objects',
      });

      expect(transformToolName('getv2objectsbyobject')).toEqual({
        originalName: 'getv2objectsbyobject',
        humanReadableName: 'get_object',
        category: 'Objects',
      });

      expect(transformToolName('patchv2objectsbyobject')).toEqual({
        originalName: 'patchv2objectsbyobject',
        humanReadableName: 'update_object',
        category: 'Objects',
      });
    });

    test('transforms record operations correctly', () => {
      expect(transformToolName('postv2objectsrecordsquery')).toEqual({
        originalName: 'postv2objectsrecordsquery',
        humanReadableName: 'query_records',
        category: 'Records',
      });

      expect(transformToolName('putv2objectsrecords')).toEqual({
        originalName: 'putv2objectsrecords',
        humanReadableName: 'replace_records',
        category: 'Records',
      });

      expect(transformToolName('deletev2objectsrecordsbyrecordid')).toEqual({
        originalName: 'deletev2objectsrecordsbyrecordid',
        humanReadableName: 'delete_record',
        category: 'Records',
      });

      // Test the previously conflicting record operations
      expect(transformToolName('putv2objectsrecordsbyrecordid')).toEqual({
        originalName: 'putv2objectsrecordsbyrecordid',
        humanReadableName: 'replace_record',
        category: 'Records',
      });

      expect(transformToolName('patchv2objectsrecordsbyrecordid')).toEqual({
        originalName: 'patchv2objectsrecordsbyrecordid',
        humanReadableName: 'update_record',
        category: 'Records',
      });
    });

    test('transforms attribute operations correctly', () => {
      expect(transformToolName('getv2attributes')).toEqual({
        originalName: 'getv2attributes',
        humanReadableName: 'list_attributes',
        category: 'Attributes',
      });

      expect(transformToolName('postv2attributesoptions')).toEqual({
        originalName: 'postv2attributesoptions',
        humanReadableName: 'create_attribute_option',
        category: 'Attributes',
      });

      expect(transformToolName('patchv2attributesstatusesbystatus')).toEqual({
        originalName: 'patchv2attributesstatusesbystatus',
        humanReadableName: 'update_attribute_status',
        category: 'Attributes',
      });
    });

    test('transforms list operations correctly', () => {
      expect(transformToolName('getv2lists')).toEqual({
        originalName: 'getv2lists',
        humanReadableName: 'list_lists',
        category: 'Lists',
      });

      expect(transformToolName('postv2listsentries')).toEqual({
        originalName: 'postv2listsentries',
        humanReadableName: 'create_list_entry',
        category: 'List Entries',
      });

      expect(transformToolName('getv2listsentriesbyentryid')).toEqual({
        originalName: 'getv2listsentriesbyentryid',
        humanReadableName: 'get_list_entry',
        category: 'List Entries',
      });

      // Test the previously conflicting list entry operations
      expect(transformToolName('putv2listsentries')).toEqual({
        originalName: 'putv2listsentries',
        humanReadableName: 'replace_list_entries',
        category: 'List Entries',
      });

      expect(transformToolName('putv2listsentriesbyentryid')).toEqual({
        originalName: 'putv2listsentriesbyentryid',
        humanReadableName: 'replace_list_entry',
        category: 'List Entries',
      });

      expect(transformToolName('patchv2listsentriesbyentryid')).toEqual({
        originalName: 'patchv2listsentriesbyentryid',
        humanReadableName: 'update_list_entry',
        category: 'List Entries',
      });
    });

    test('transforms workspace operations correctly', () => {
      expect(transformToolName('getv2workspacemembers')).toEqual({
        originalName: 'getv2workspacemembers',
        humanReadableName: 'list_workspace_members',
        category: 'Workspace',
      });

      expect(transformToolName('getv2self')).toEqual({
        originalName: 'getv2self',
        humanReadableName: 'get_current_user',
        category: 'Authentication',
      });
    });

    test('transforms content operations correctly', () => {
      expect(transformToolName('postv2notes')).toEqual({
        originalName: 'postv2notes',
        humanReadableName: 'create_note',
        category: 'Notes',
      });

      expect(transformToolName('getv2tasks')).toEqual({
        originalName: 'getv2tasks',
        humanReadableName: 'list_tasks',
        category: 'Tasks',
      });

      expect(transformToolName('postv2comments')).toEqual({
        originalName: 'postv2comments',
        humanReadableName: 'create_comment',
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
        humanReadableName: 'list_objects',
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

    test('sorts tools by method order within categories', () => {
      const toolNames = [
        'postv2objects',
        'patchv2objectsbyobject',
        'getv2objects',
        'getv2objectsbyobject',
        'deletev2objectsrecordsbyrecordid',
      ];

      const transformations = getAllToolTransformations(toolNames);
      const grouped = groupToolsByCategory(transformations);

      const objectsTools = grouped.get('Objects') || [];
      const recordsTools = grouped.get('Records') || [];

      // Objects should be sorted: list (get multiple) -> get (single) -> create -> update
      expect(objectsTools[0].humanReadableName).toBe('list_objects');
      expect(objectsTools[1].humanReadableName).toBe('get_object');
      expect(objectsTools[2].humanReadableName).toBe('create_object');
      expect(objectsTools[3].humanReadableName).toBe('update_object');

      // Records should have delete operations
      expect(recordsTools[0].humanReadableName).toBe('delete_record');
    });
  });
});
