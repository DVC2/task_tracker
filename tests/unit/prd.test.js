const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const PRD = require('../../lib/commands/prd');

describe('PRD Command', () => {
  let sandbox;
  let fsStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    fsStub = {
      existsSync: sandbox.stub(),
      mkdirSync: sandbox.stub(),
      readFileSync: sandbox.stub(),
      writeFileSync: sandbox.stub()
    };
    sandbox.stub(fs, 'existsSync').callsFake(fsStub.existsSync);
    sandbox.stub(fs, 'mkdirSync').callsFake(fsStub.mkdirSync);
    sandbox.stub(fs, 'readFileSync').callsFake(fsStub.readFileSync);
    sandbox.stub(fs, 'writeFileSync').callsFake(fsStub.writeFileSync);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('parsePRD', () => {
    it('should set PRD from text description', () => {
      fsStub.existsSync.returns(false);
      
      const result = PRD.parsePRD(['Build a REST API for user management'], {});
      
      expect(result.success).to.be.true;
      expect(result.prd).to.exist;
      expect(result.prd.title).to.include('Build a REST API');
      expect(result.prd.goals).to.be.an('array');
      expect(fsStub.writeFileSync.called).to.be.true;
    });

    it('should parse PRD from markdown file', () => {
      const markdownContent = `# Project Requirements

## Goals
- Build scalable API
- Support authentication
- Real-time updates

## Technical Requirements
- Node.js backend
- PostgreSQL database
- JWT authentication

## User Stories
- As a user, I want to register
- As a user, I want to login
- As a user, I want to update my profile`;

      fsStub.existsSync.withArgs('requirements.md').returns(true);
      fsStub.readFileSync.withArgs('requirements.md').returns(markdownContent);
      
      // Disable journal creation to simplify the test
      const result = PRD.parsePRD(['requirements.md'], { journal: false });
      
      expect(result.success).to.be.true;
      expect(result.prd.title).to.equal('Project Requirements');
      
      // Check that goals were parsed correctly
      expect(result.prd.goals).to.include('Build scalable API');
      expect(result.prd.goals).to.include('Support authentication');
      expect(result.prd.goals).to.include('Real-time updates');
      
      // Check requirements
      expect(result.prd.requirements).to.have.lengthOf(3);
      expect(result.prd.requirements).to.include('Node.js backend');
      
      // Check user stories
      expect(result.prd.userStories.length).to.be.at.least(3);
      expect(result.prd.userStories.some(story => story.includes('register'))).to.be.true;
    });

    it('should fail when no description provided', () => {
      const result = PRD.parsePRD([], {});
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('content required');
    });

    it('should handle file read errors gracefully', () => {
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.throws(new Error('File read error'));
      
      const result = PRD.parsePRD(['nonexistent.md'], {});
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('File read error');
    });
  });

  describe('showPRD', () => {
    it('should display existing PRD', () => {
      const mockPRD = {
        title: 'Test project',
        description: 'Test description',
        goals: ['Goal 1', 'Goal 2'],
        features: [],
        requirements: ['Tech 1', 'Tech 2'],
        userStories: ['Story 1', 'Story 2'],
        technicalStack: [],
        constraints: [],
        timestamp: new Date().toISOString()
      };
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockPRD));
      
      const result = PRD.showPRD([], {});
      
      expect(result.success).to.be.true;
      expect(result.prd).to.deep.equal(mockPRD);
    });

    it('should handle missing PRD file', () => {
      fsStub.existsSync.returns(false);
      
      const result = PRD.showPRD([], {});
      
      expect(result.success).to.be.true; // Note: showPRD returns success even when no PRD found
      expect(result.message).to.include('No PRD found');
    });

    it('should handle JSON output format', () => {
      const mockPRD = {
        title: 'Test project',
        goals: ['Goal 1'],
        timestamp: new Date().toISOString()
      };
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockPRD));
      
      // Capture console output
      let jsonOutput = null;
      const originalWrite = process.stdout.write;
      process.stdout.write = (data) => {
        if (typeof data === 'string' && data.includes('"success"')) {
          jsonOutput = data;
        }
        return true;
      };
      
      const result = PRD.showPRD([], { json: true });
      
      // Restore stdout
      process.stdout.write = originalWrite;
      
      expect(result.success).to.be.true;
      expect(jsonOutput).to.not.be.null;
      expect(jsonOutput).to.include('"success"');
      expect(jsonOutput).to.include('"data"');
    });
  });

  describe('generatePRDContext', () => {
    it('should generate context from PRD', () => {
      const mockPRD = {
        title: 'Build a task management API',
        description: 'API for managing tasks',
        goals: ['Create REST endpoints', 'Add authentication'],
        features: ['User management', 'Task CRUD'],
        requirements: ['Node.js', 'MongoDB'],
        userStories: ['As a user, I want to create tasks'],
        constraints: ['Must be scalable', 'Response time < 200ms'],
        technicalStack: [],
        timestamp: new Date().toISOString()
      };
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockPRD));
      
      const result = PRD.generatePRDContext([], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Build a task management API');
      expect(result.context).to.include('Create REST endpoints');
      expect(result.context).to.include('Node.js');
      expect(result.context).to.include('Must be scalable');
    });

    it('should save context to file when output option provided', () => {
      const mockPRD = {
        title: 'Test project',
        goals: ['Goal 1'],
        features: [],
        requirements: [],
        constraints: [],
        timestamp: new Date().toISOString()
      };
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockPRD));
      
      const result = PRD.generatePRDContext([], { output: 'prd-context.md' });
      
      expect(result.success).to.be.true;
      expect(fsStub.writeFileSync.calledWith('prd-context.md')).to.be.true;
    });

    it('should handle missing PRD', () => {
      fsStub.existsSync.returns(false);
      
      const result = PRD.generatePRDContext([], {});
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('No PRD found');
    });
  });
}); 