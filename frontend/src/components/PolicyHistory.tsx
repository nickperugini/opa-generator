import React, { useState, useEffect } from 'react';
import { policyHistoryService, type PolicySession, type InstructionTemplate } from '../services/policyHistory';

interface PolicyHistoryProps {
  onLoadInstructions?: (instructions: string) => void;
  onLoadPolicy?: (session: PolicySession) => void;
}

const PolicyHistory: React.FC<PolicyHistoryProps> = ({ onLoadInstructions, onLoadPolicy }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'templates'>('sessions');
  const [sessions, setSessions] = useState<PolicySession[]>([]);
  const [templates, setTemplates] = useState<InstructionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    instructions: '',
    description: '',
    category: 'access-control'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSessions(policyHistoryService.getPolicySessions());
    setTemplates(policyHistoryService.getInstructionTemplates());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSessions(policyHistoryService.searchPolicySessions(query));
    } else {
      setSessions(policyHistoryService.getPolicySessions());
    }
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Are you sure you want to delete this policy session?')) {
      policyHistoryService.deletePolicySession(id);
      loadData();
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      policyHistoryService.deleteInstructionTemplate(id);
      loadData();
    }
  };

  const handleUseTemplate = (template: InstructionTemplate) => {
    policyHistoryService.useInstructionTemplate(template.id);
    if (onLoadInstructions) {
      onLoadInstructions(template.instructions);
    }
    loadData(); // Refresh to update usage count
  };

  const handleSaveAsTemplate = (session: PolicySession) => {
    setTemplateForm({
      title: `Policy Template - ${new Date(session.timestamp).toLocaleDateString()}`,
      instructions: session.instructions,
      description: session.explanation.substring(0, 100) + '...',
      category: 'access-control'
    });
    setShowSaveDialog(true);
  };

  const handleSaveTemplate = () => {
    if (templateForm.title.trim() && templateForm.instructions.trim()) {
      policyHistoryService.saveInstructionTemplate({
        title: templateForm.title,
        instructions: templateForm.instructions,
        description: templateForm.description,
        category: templateForm.category,
      });
      setShowSaveDialog(false);
      setTemplateForm({ title: '', instructions: '', description: '', category: 'access-control' });
      loadData();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const categories = [
    { value: 'access-control', label: 'Access Control' },
    { value: 'time-based', label: 'Time-based' },
    { value: 'resource-based', label: 'Resource-based' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Policy History</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const data = policyHistoryService.exportData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `opa-policy-history-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Export
          </button>
          <button
            onClick={() => {
              if (confirm('This will clear all saved policies and templates. Are you sure?')) {
                policyHistoryService.clearAllData();
                loadData();
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'sessions', label: `Policy Sessions (${sessions.length})` },
            { key: 'templates', label: `Instruction Templates (${templates.length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search ${activeTab === 'sessions' ? 'policy sessions' : 'templates'}...`}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Policy Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No policy sessions saved yet.</p>
              <p className="text-sm">Generate some policies to see them here!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {session.userDescription || `Policy - ${formatTimestamp(session.timestamp)}`}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Instructions:</strong> {truncateText(session.instructions, 100)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated: {formatTimestamp(session.timestamp)}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onLoadInstructions && onLoadInstructions(session.instructions)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      title="Load instructions"
                    >
                      Load Instructions
                    </button>
                    <button
                      onClick={() => onLoadPolicy && onLoadPolicy(session)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      title="Load full session"
                    >
                      Load Policy
                    </button>
                    <button
                      onClick={() => handleSaveAsTemplate(session)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      title="Save as template"
                    >
                      Template
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      title="Delete session"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Policy Preview */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    View Policy & Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <div className="mb-2">
                      <strong>Policy:</strong>
                      <pre className="mt-1 text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                        {session.policy}
                      </pre>
                    </div>
                    <div className="mb-2">
                      <strong>Explanation:</strong>
                      <p className="text-gray-700">{session.explanation}</p>
                    </div>
                    <div>
                      <strong>Test Inputs:</strong> {session.testInputs.length} test cases
                    </div>
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      )}

      {/* Instruction Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No instruction templates saved yet.</p>
              <p className="text-sm">Save some policy sessions as templates to reuse them!</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-gray-800 mr-2">{template.title}</h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {categories.find(c => c.value === template.category)?.label || template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Used {template.usageCount} times • Created: {formatTimestamp(template.timestamp)}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Template Preview */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    View Instructions
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <pre className="whitespace-pre-wrap text-gray-700">{template.instructions}</pre>
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save as Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe when to use this template..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={templateForm.instructions}
                  onChange={(e) => setTemplateForm({ ...templateForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateForm.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyHistory;
