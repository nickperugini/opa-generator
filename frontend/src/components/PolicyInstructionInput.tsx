import React, { useState } from 'react';

interface PolicyInstructionInputProps {
  onSubmit: (instructions: string) => void;
  onIterate?: (instructions: string) => void;
  isGenerating: boolean;
  isRefining: boolean;
  hasExistingPolicy?: boolean;
  currentInstructions?: string;
}

const PolicyInstructionInput: React.FC<PolicyInstructionInputProps> = ({ 
  onSubmit, 
  onIterate, 
  isGenerating,
  isRefining,
  hasExistingPolicy = false,
  currentInstructions = ''
}) => {
  const [instructions, setInstructions] = useState(currentInstructions);

  // Update instructions when currentInstructions prop changes
  React.useEffect(() => {
    setInstructions(currentInstructions);
  }, [currentInstructions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructions.trim() && !isGenerating && !isRefining) {
      onSubmit(instructions.trim());
      setInstructions(''); // Clear input after submission
    }
  };

  const handleIterate = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructions.trim() && !isGenerating && !isRefining && onIterate) {
      onIterate(instructions.trim());
      setInstructions(''); // Clear input after iteration
    }
  };

  const exampleInstructions = [
    "Only allow if user role is admin and department is HR",
    "Allow access only during business hours (9 AM to 5 PM) on weekdays",
    "Users can only access resources they own or if they are managers",
    "Allow access only if user has valid MFA token and is accessing from approved IP range",
    "Deny access if user has more than 5 failed login attempts in the last hour"
  ];

  const iterationExamples = [
    "Also allow users with 'supervisor' role",
    "Add rate limiting - max 10 requests per minute",
    "Include geographic restrictions for certain regions",
    "Add exception for emergency access during weekends",
    "Include audit logging requirements"
  ];

  const handleExampleClick = (example: string) => {
    setInstructions(example);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {hasExistingPolicy ? 'Refine OPA Policy' : 'Generate OPA Policy'}
      </h2>
      
      {hasExistingPolicy && (
        <div className="alert alert-info mb-4">
          <p className="text-sm">
            <strong>Iteration Mode:</strong> You can refine the existing policy by describing what you'd like to add, modify, or remove.
            The AI will maintain the existing structure while applying your changes.
          </p>
        </div>
      )}
      
      <form onSubmit={hasExistingPolicy ? handleIterate : handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="instructions" className="form-label">
            {hasExistingPolicy ? 'Refinement Instructions' : 'Policy Instructions'}
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={
              hasExistingPolicy 
                ? "Describe how you'd like to modify the existing policy..."
                : "Describe your policy requirements in natural language..."
            }
            className="form-input form-textarea"
            rows={4}
            disabled={isGenerating || isRefining}
          />
        </div>
        
        <div className="flex space-x-2">
          {!hasExistingPolicy && (
            <button
              type="submit"
              disabled={!instructions.trim() || isGenerating || isRefining}
              className="btn btn-primary flex-1"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-1 mr-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  Generating...
                </div>
              ) : (
                'Generate OPA Policy'
              )}
            </button>
          )}
          
          {hasExistingPolicy && (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!instructions.trim() || isGenerating || isRefining}
                className="btn btn-secondary flex-1"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-1 mr-2">
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    Generating...
                  </div>
                ) : (
                  'Generate New Policy'
                )}
              </button>
              <button
                type="submit"
                disabled={!instructions.trim() || isGenerating || isRefining}
                className="btn btn-primary flex-1"
              >
                {isRefining ? (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-1 mr-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    Refining...
                  </div>
                ) : (
                  'Refine Existing Policy'
                )}
              </button>
            </>
          )}
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {hasExistingPolicy ? 'Example Refinements:' : 'Example Instructions:'}
        </h3>
        <div className="space-y-2">
          {(hasExistingPolicy ? iterationExamples : exampleInstructions).map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isGenerating || isRefining}
              className="btn w-full text-left text-sm text-blue-600"
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyInstructionInput;
