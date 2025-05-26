const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const Journal = require('../../lib/commands/journal');

describe('Journal Command', () => {
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

  describe('addEntry', () => {
    it('should add a journal entry with default type', () => {
      fsStub.existsSync.returns(false);
      
      const result = Journal.addEntry(['Testing journal functionality'], {});
      
      expect(result.success).to.be.true;
      expect(result.entry).to.exist;
      expect(result.entry.content).to.equal('Testing journal functionality');
      expect(result.entry.type).to.equal('progress');
      expect(fsStub.writeFileSync.calledOnce).to.be.true;
    });

    it('should add a journal entry with custom type', () => {
      fsStub.existsSync.returns(false);
      
      const result = Journal.addEntry(['Important architecture decision'], { type: 'decision' });
      
      expect(result.success).to.be.true;
      expect(result.entry.type).to.equal('decision');
    });

    it('should handle tags properly', () => {
      fsStub.existsSync.returns(false);
      
      const result = Journal.addEntry(['Working on auth'], { tags: 'auth,security,backend' });
      
      expect(result.success).to.be.true;
      expect(result.entry.tags).to.deep.equal(['auth', 'security', 'backend']);
    });

    it('should fail when no entry text provided', () => {
      const result = Journal.addEntry([], {});
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Entry text required');
    });

    it('should append to existing journal entries', () => {
      const existingEntries = [
        { id: 1, content: 'Previous entry', type: 'progress' }
      ];
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(existingEntries));
      
      const result = Journal.addEntry(['New entry'], {});
      
      expect(result.success).to.be.true;
      const savedData = JSON.parse(fsStub.writeFileSync.firstCall.args[1]);
      expect(savedData).to.have.lengthOf(2);
      expect(savedData[0].content).to.equal('Previous entry');
      expect(savedData[1].content).to.equal('New entry');
    });
  });

  describe('showEntries', () => {
    it('should show recent entries', () => {
      const mockEntries = [
        { id: 1, timestamp: new Date().toISOString(), content: 'Entry 1', type: 'progress', tags: [], files: [] },
        { id: 2, timestamp: new Date().toISOString(), content: 'Entry 2', type: 'decision', tags: ['important'], files: [] }
      ];
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockEntries));
      
      const result = Journal.showEntries([], {});
      
      expect(result.success).to.be.true;
      expect(result.entries).to.have.lengthOf(2);
    });

    it('should filter by type', () => {
      const mockEntries = [
        { id: 1, timestamp: new Date().toISOString(), content: 'Progress 1', type: 'progress', tags: [], files: [] },
        { id: 2, timestamp: new Date().toISOString(), content: 'Decision 1', type: 'decision', tags: [], files: [] },
        { id: 3, timestamp: new Date().toISOString(), content: 'Progress 2', type: 'progress', tags: [], files: [] }
      ];
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockEntries));
      
      const result = Journal.showEntries([], { type: 'decision' });
      
      expect(result.success).to.be.true;
      expect(result.entries).to.have.lengthOf(1);
      expect(result.entries[0].type).to.equal('decision');
    });

    it('should limit number of entries', () => {
      const mockEntries = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        timestamp: new Date().toISOString(),
        content: `Entry ${i}`,
        type: 'progress',
        tags: [],
        files: []
      }));
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockEntries));
      
      const result = Journal.showEntries(['5'], {});
      
      expect(result.success).to.be.true;
      expect(result.entries).to.have.lengthOf(5);
    });
  });

  describe('generateContext', () => {
    it('should generate context from recent entries', () => {
      const recentDate = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      const mockEntries = [
        { id: 1, timestamp: oldDate.toISOString(), content: 'Old entry', type: 'progress', tags: [], files: [] },
        { id: 2, timestamp: recentDate.toISOString(), content: 'Recent progress', type: 'progress', tags: [], files: [] },
        { id: 3, timestamp: recentDate.toISOString(), content: 'Important decision', type: 'decision', tags: [], files: [] },
        { id: 4, timestamp: recentDate.toISOString(), content: 'Current blocker', type: 'blocker', tags: [], files: ['auth.js'] }
      ];
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockEntries));
      
      const result = Journal.generateContext(['7'], {});
      
      expect(result.success).to.be.true;
      expect(result.context).to.include('Recent progress');
      expect(result.context).to.include('Important decision');
      expect(result.context).to.include('Current blocker');
      expect(result.context).to.include('auth.js');
      expect(result.context).not.to.include('Old entry');
    });

    it('should save context to file when output option provided', () => {
      const mockEntries = [
        { id: 1, timestamp: new Date().toISOString(), content: 'Test entry', type: 'progress', tags: [], files: [] }
      ];
      
      fsStub.existsSync.returns(true);
      fsStub.readFileSync.returns(JSON.stringify(mockEntries));
      
      const result = Journal.generateContext([], { output: 'context.md' });
      
      expect(result.success).to.be.true;
      expect(fsStub.writeFileSync.calledWith('context.md')).to.be.true;
    });
  });
}); 