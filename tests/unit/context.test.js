const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const ContextV2 = require('../../lib/commands/context-v2');

describe('Context Commands', () => {
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

  describe('Quick Context', () => {
    it('should generate quick context from recent entries', () => {
      const recentDate = new Date();
      const mockJournal = [
        {
          id: 1,
          timestamp: recentDate.toISOString(),
          content: 'Implemented user authentication',
          type: 'progress',
          tags: ['auth'],
          files: ['auth.js']
        },
        {
          id: 2,
          timestamp: recentDate.toISOString(),
          content: 'Using JWT for session management',
          type: 'decision',
          tags: ['auth', 'security'],
          files: []
        }
      ];
      
      const mockPRD = {
        title: 'Build secure API',
        description: 'Build secure API',
        goals: ['Implement authentication', 'Add user management'],
        features: [],
        requirements: [],
        constraints: []
      };
      
      // Setup file system stubs - be more specific about paths
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const prdPath = path.join(process.cwd(), '.tasktracker', 'prd', 'current.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(prdPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(prdPath).returns(JSON.stringify(mockPRD));
      
      const result = ContextV2.quickContext([], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Using JWT for session management');
      expect(result.context).to.include('Implement authentication');
    });

    it('should handle empty journal gracefully', () => {
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const prdPath = path.join(process.cwd(), '.tasktracker', 'prd', 'current.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(prdPath).returns(false);
      fsStub.readFileSync.withArgs(journalPath).returns('[]');
      
      const result = ContextV2.quickContext([], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Quick Development Context');
    });

    it('should save context to file when output option provided', () => {
      const mockJournal = [{
        id: 1,
        timestamp: new Date().toISOString(),
        content: 'Test entry',
        type: 'progress'
      }];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      
      const result = ContextV2.quickContext([], { output: 'quick-context.md' });
      
      expect(result.success).to.be.true;
      expect(fsStub.writeFileSync.calledWith('quick-context.md')).to.be.true;
    });
  });

  describe('Full Context', () => {
    it('should generate full context with custom timeframe', () => {
      const now = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      const mockJournal = [
        {
          id: 1,
          timestamp: oldDate.toISOString(),
          content: 'Old entry',
          type: 'progress',
          tags: [],
          files: []
        },
        {
          id: 2,
          timestamp: now.toISOString(),
          content: 'Recent progress on API',
          type: 'progress',
          tags: ['api'],
          files: []
        },
        {
          id: 3,
          timestamp: now.toISOString(),
          content: 'Decided to use PostgreSQL',
          type: 'decision',
          tags: ['database'],
          files: []
        },
        {
          id: 4,
          timestamp: now.toISOString(),
          content: 'CORS configuration issues',
          type: 'blocker',
          tags: ['api', 'frontend'],
          files: []
        }
      ];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const pkgPath = path.join(process.cwd(), 'package.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(pkgPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(pkgPath).returns(JSON.stringify({ name: 'test-project' }));
      
      const result = ContextV2.generateFullContext(['3'], {}); // 3 days
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Recent progress on API');
      expect(result.context).to.include('Decided to use PostgreSQL');
      expect(result.context).to.include('CORS configuration issues');
      expect(result.context).not.to.include('Old entry');
    });

    it('should include file references in context', () => {
      const mockJournal = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          content: 'Updated authentication logic',
          type: 'progress',
          files: ['src/auth.js', 'src/middleware/auth.js'],
          tags: []
        }
      ];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const pkgPath = path.join(process.cwd(), 'package.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(pkgPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(pkgPath).returns(JSON.stringify({ name: 'test-project' }));
      
      const result = ContextV2.generateFullContext([], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('src/auth.js');
      expect(result.context).to.include('src/middleware/auth.js');
    });

    it('should group entries by type', () => {
      const mockJournal = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          content: 'Progress 1',
          type: 'progress',
          tags: [],
          files: []
        },
        {
          id: 2,
          timestamp: new Date().toISOString(),
          content: 'Decision 1',
          type: 'decision',
          tags: [],
          files: []
        },
        {
          id: 3,
          timestamp: new Date().toISOString(),
          content: 'Blocker 1',
          type: 'blocker',
          tags: [],
          files: []
        },
        {
          id: 4,
          timestamp: new Date().toISOString(),
          content: 'Progress 2',
          type: 'progress',
          tags: [],
          files: []
        }
      ];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const pkgPath = path.join(process.cwd(), 'package.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(pkgPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(pkgPath).returns(JSON.stringify({ name: 'test-project' }));
      
      const result = ContextV2.generateFullContext([], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.match(/### Progress Updates[\s\S]*Progress 1[\s\S]*Progress 2/);
      expect(result.context).to.match(/### Key Decisions[\s\S]*Decision 1/);
      expect(result.context).to.match(/### Current Blockers[\s\S]*Blocker 1/);
    });

    it('should handle invalid days parameter', () => {
      const mockJournal = [{
        id: 1,
        timestamp: new Date().toISOString(),
        content: 'Recent entry',
        type: 'progress',
        tags: [],
        files: []
      }];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const pkgPath = path.join(process.cwd(), 'package.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(pkgPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(pkgPath).returns(JSON.stringify({ name: 'test-project' }));
      
      const result = ContextV2.generateFullContext(['invalid'], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Recent Progress (Last 7 days)'); // Should default to 7
    });

    it('should save context to file with statistics', () => {
      const mockJournal = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          content: 'Test entry',
          type: 'progress',
          tags: ['test'],
          files: []
        }
      ];
      
      const journalPath = path.join(process.cwd(), '.tasktracker', 'journal', 'entries.json');
      const pkgPath = path.join(process.cwd(), 'package.json');
      
      fsStub.existsSync.withArgs(journalPath).returns(true);
      fsStub.existsSync.withArgs(pkgPath).returns(true);
      fsStub.readFileSync.withArgs(journalPath).returns(JSON.stringify(mockJournal));
      fsStub.readFileSync.withArgs(pkgPath).returns(JSON.stringify({ name: 'test-project' }));
      
      const result = ContextV2.generateFullContext([], { output: 'full-context.md' });
      
      expect(result.success).to.be.true;
      expect(fsStub.writeFileSync.calledWith('full-context.md')).to.be.true;
      
      const savedContent = fsStub.writeFileSync.firstCall.args[1];
      expect(savedContent).to.include('Test entry');
      expect(savedContent).to.include('Development Context Summary');
    });
  });
}); 