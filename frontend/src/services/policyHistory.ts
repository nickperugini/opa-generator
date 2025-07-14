export interface PolicySession {
  id: string;
  instructions: string;
  policy: string;
  testInputs: any[];
  explanation: string;
  timestamp: string;
  userDescription?: string;
  tags?: string[];
  isTemplate?: boolean;
}

export interface InstructionTemplate {
  id: string;
  title: string;
  instructions: string;
  description?: string;
  category: string;
  timestamp: string;
  usageCount: number;
}

class PolicyHistoryService {
  private readonly SESSIONS_KEY = 'opa-policy-sessions';
  private readonly TEMPLATES_KEY = 'opa-instruction-templates';
  private readonly MAX_SESSIONS = 50;
  private readonly MAX_TEMPLATES = 20;

  // Policy Sessions Management
  savePolicySession(session: Omit<PolicySession, 'id' | 'timestamp'>): PolicySession {
    const newSession: PolicySession = {
      ...session,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const sessions = this.getPolicySessions();
    const updatedSessions = [newSession, ...sessions].slice(0, this.MAX_SESSIONS);
    
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(updatedSessions));
    return newSession;
  }

  getPolicySessions(): PolicySession[] {
    try {
      const sessions = localStorage.getItem(this.SESSIONS_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading policy sessions:', error);
      return [];
    }
  }

  getPolicySession(id: string): PolicySession | null {
    const sessions = this.getPolicySessions();
    return sessions.find(session => session.id === id) || null;
  }

  deletePolicySession(id: string): void {
    const sessions = this.getPolicySessions();
    const updatedSessions = sessions.filter(session => session.id !== id);
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(updatedSessions));
  }

  updatePolicySession(id: string, updates: Partial<PolicySession>): void {
    const sessions = this.getPolicySessions();
    const sessionIndex = sessions.findIndex(session => session.id === id);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  // Instruction Templates Management
  saveInstructionTemplate(template: Omit<InstructionTemplate, 'id' | 'timestamp' | 'usageCount'>): InstructionTemplate {
    const newTemplate: InstructionTemplate = {
      ...template,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      usageCount: 0,
    };

    const templates = this.getInstructionTemplates();
    const updatedTemplates = [newTemplate, ...templates].slice(0, this.MAX_TEMPLATES);
    
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updatedTemplates));
    return newTemplate;
  }

  getInstructionTemplates(): InstructionTemplate[] {
    try {
      const templates = localStorage.getItem(this.TEMPLATES_KEY);
      return templates ? JSON.parse(templates) : [];
    } catch (error) {
      console.error('Error loading instruction templates:', error);
      return [];
    }
  }

  getInstructionTemplate(id: string): InstructionTemplate | null {
    const templates = this.getInstructionTemplates();
    return templates.find(template => template.id === id) || null;
  }

  useInstructionTemplate(id: string): InstructionTemplate | null {
    const templates = this.getInstructionTemplates();
    const templateIndex = templates.findIndex(template => template.id === id);
    
    if (templateIndex !== -1) {
      templates[templateIndex].usageCount += 1;
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
      return templates[templateIndex];
    }
    
    return null;
  }

  deleteInstructionTemplate(id: string): void {
    const templates = this.getInstructionTemplates();
    const updatedTemplates = templates.filter(template => template.id !== id);
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updatedTemplates));
  }

  // Search and Filter
  searchPolicySessions(query: string): PolicySession[] {
    const sessions = this.getPolicySessions();
    const lowerQuery = query.toLowerCase();
    
    return sessions.filter(session => 
      session.instructions.toLowerCase().includes(lowerQuery) ||
      session.policy.toLowerCase().includes(lowerQuery) ||
      session.explanation.toLowerCase().includes(lowerQuery) ||
      session.userDescription?.toLowerCase().includes(lowerQuery) ||
      session.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getTemplatesByCategory(category: string): InstructionTemplate[] {
    const templates = this.getInstructionTemplates();
    return templates.filter(template => template.category === category);
  }

  getPopularTemplates(limit: number = 5): InstructionTemplate[] {
    const templates = this.getInstructionTemplates();
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  exportData(): { sessions: PolicySession[], templates: InstructionTemplate[] } {
    return {
      sessions: this.getPolicySessions(),
      templates: this.getInstructionTemplates(),
    };
  }

  importData(data: { sessions?: PolicySession[], templates?: InstructionTemplate[] }): void {
    if (data.sessions) {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(data.sessions));
    }
    if (data.templates) {
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(data.templates));
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.TEMPLATES_KEY);
  }
}

export const policyHistoryService = new PolicyHistoryService();
