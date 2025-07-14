import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface PolicyVersion {
  id: string;
  policy: string;
  timestamp: string;
  description: string;
}

interface PolicyEditorProps {
  initialPolicy: string;
  onSave?: (policy: string, description: string) => void;
}

// Define Rego language configuration
const regoLanguageConfig = {
  id: 'rego',
  extensions: ['.rego'],
  aliases: ['Rego', 'rego'],
  mimetypes: ['text/rego'],
};

// Define Rego language tokens
const regoTokensProvider = {
  tokenizer: {
    root: [
      // Comments
      [/#.*$/, 'comment'],
      
      // Keywords
      [/\b(package|import|default|if|else|not|with|as|some|every|in|contains|startswith|endswith|count|sum|max|min|sort|all|any|to_number|sprintf|regex|split|replace|trim|lower|upper|time|date|round|floor|ceil|abs|sort_by|group_by|max_by|min_by|unique|flatten|reverse|concat|union|intersection|difference|symmetric_difference|cast_array|cast_set|cast_object|cast_string|cast_boolean|cast_null|type_name|is_number|is_string|is_boolean|is_array|is_object|is_set|is_null)\b/, 'keyword'],
      
      // Built-in functions
      [/\b(allow|deny|violation|warn|trace|print)\b/, 'keyword.control'],
      
      // Operators
      [/(:=|==|!=|<=|>=|<|>|=|:|\+|-|\*|\/|%|\||&|\^|~)/, 'operator'],
      
      // Numbers
      [/\b\d+(\.\d+)?\b/, 'number'],
      
      // Strings
      [/"([^"\\]|\\.)*"/, 'string'],
      [/'([^'\\]|\\.)*'/, 'string'],
      
      // Identifiers
      [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
      
      // Brackets
      [/[\[\]{}()]/, 'bracket'],
      
      // Delimiters
      [/[;,.]/, 'delimiter'],
    ],
  },
};

// Define Rego language configuration
const regoLanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

const PolicyEditor: React.FC<PolicyEditorProps> = ({ initialPolicy, onSave }) => {
  const [policy, setPolicy] = useState(initialPolicy);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    setPolicy(initialPolicy);
  }, [initialPolicy]);

  // Register Rego language with Monaco
  const handleEditorWillMount = (monaco: any) => {
    // Register the language
    monaco.languages.register(regoLanguageConfig);
    
    // Set the tokens provider
    monaco.languages.setMonarchTokensProvider('rego', regoTokensProvider);
    
    // Set the language configuration
    monaco.languages.setLanguageConfiguration('rego', regoLanguageConfiguration);
    
    // Define a custom theme for Rego
    monaco.editor.defineTheme('rego-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'bracket', foreground: 'FFD700' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      },
    });
  };

  useEffect(() => {
    // Load versions from localStorage
    const savedVersions = localStorage.getItem('opa-policy-versions');
    if (savedVersions) {
      try {
        setVersions(JSON.parse(savedVersions));
      } catch (error) {
        console.error('Failed to load policy versions:', error);
      }
    }
  }, []);

  const saveVersion = () => {
    if (!policy.trim() || !saveDescription.trim()) return;

    const newVersion: PolicyVersion = {
      id: Date.now().toString(),
      policy: policy.trim(),
      timestamp: new Date().toISOString(),
      description: saveDescription.trim()
    };

    const updatedVersions = [newVersion, ...versions].slice(0, 10); // Keep only last 10 versions
    setVersions(updatedVersions);
    
    // Save to localStorage
    localStorage.setItem('opa-policy-versions', JSON.stringify(updatedVersions));
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(policy, saveDescription);
    }

    setShowSaveDialog(false);
    setSaveDescription('');
  };

  const loadVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setPolicy(version.policy);
      setSelectedVersion(versionId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const validatePolicy = (policyText: string) => {
    // Basic Rego validation
    const errors: string[] = [];
    
    if (!policyText.includes('package ')) {
      errors.push('Missing package declaration');
    }
    
    if (!policyText.includes('import rego.v1') && !policyText.includes('import data.rego.v1')) {
      errors.push('Missing rego.v1 import (recommended)');
    }
    
    return errors;
  };

  const validationErrors = validatePolicy(policy);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Policy Editor</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!policy.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Version
          </button>
          <button
            onClick={() => setPolicy(initialPolicy)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Version History */}
      {versions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Version History</h3>
          <select
            value={selectedVersion}
            onChange={(e) => loadVersion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a version to load...</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {formatTimestamp(version.timestamp)} - {version.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Policy Validation Warnings:</h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <Editor
          height="400px"
          language="rego"
          value={policy}
          onChange={(value) => setPolicy(value || '')}
          beforeMount={handleEditorWillMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            theme: 'rego-theme',
            folding: true,
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
          }}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Policy Version</h3>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Version Description
              </label>
              <input
                id="description"
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Describe the changes made..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveVersion}
                disabled={!saveDescription.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyEditor;
