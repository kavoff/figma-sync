import { TextService } from '../services/text.service';

describe('TextService', () => {
  let textService: TextService;

  beforeEach(() => {
    textService = new TextService();
  });

  describe('loadFromJson', () => {
    it('should load valid JSON artifact', () => {
      const json = JSON.stringify({
        version: '2.0.0',
        lastUpdated: '2023-01-01T00:00:00.000Z',
        texts: {
          'test-key': {
            key: 'test-key',
            content: 'test content',
            approvedAt: '2023-01-01T00:00:00.000Z',
            approvedBy: 'test-user',
            version: 1,
          },
        },
      });

      textService.loadFromJson(json);
      const text = textService.getText('test-key');

      expect(text).toEqual({
        key: 'test-key',
        content: 'test content',
        approvedAt: '2023-01-01T00:00:00.000Z',
        approvedBy: 'test-user',
        version: 1,
      });
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid json';

      textService.loadFromJson(invalidJson);
      const metadata = textService.getMetadata();

      expect(metadata.version).toBe('1.0.0');
      expect(metadata.count).toBe(0);
    });

    it('should handle missing fields gracefully', () => {
      const json = JSON.stringify({
        texts: {
          'test-key': {
            key: 'test-key',
            content: 'test content',
          },
        },
      });

      textService.loadFromJson(json);
      const text = textService.getText('test-key');

      expect(text).toEqual({
        key: 'test-key',
        content: 'test content',
        approvedAt: undefined,
        approvedBy: undefined,
        version: undefined,
      });
    });
  });

  describe('toJsonString', () => {
    it('should convert artifact to JSON string', () => {
      textService.updateText('test-key', 'test content', 'test-user');
      const json = textService.toJsonString();
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.texts['test-key']).toEqual({
        key: 'test-key',
        content: 'test content',
        approvedAt: expect.any(String),
        approvedBy: 'test-user',
        version: 1,
      });
    });
  });

  describe('getText', () => {
    it('should return null for non-existent key', () => {
      const result = textService.getText('non-existent');
      expect(result).toBeNull();
    });

    it('should return text item for existing key', () => {
      textService.updateText('test-key', 'test content');
      const result = textService.getText('test-key');

      expect(result).toEqual({
        key: 'test-key',
        content: 'test content',
        approvedAt: expect.any(String),
        approvedBy: undefined,
        version: 1,
      });
    });
  });

  describe('updateText', () => {
    it('should create new text item', () => {
      const result = textService.updateText(
        'new-key',
        'new content',
        'test-user'
      );

      expect(result).toEqual({
        key: 'new-key',
        content: 'new content',
        approvedAt: expect.any(String),
        approvedBy: 'test-user',
        version: 1,
      });

      const metadata = textService.getMetadata();
      expect(metadata.count).toBe(1);
    });

    it('should update existing text item', () => {
      textService.updateText('test-key', 'original content', 'test-user');
      const updated = textService.updateText(
        'test-key',
        'updated content',
        'another-user'
      );

      expect(updated.version).toBe(2);
      expect(updated.content).toBe('updated content');
      expect(updated.approvedBy).toBe('another-user');
    });
  });

  describe('deleteText', () => {
    it('should return false for non-existent key', () => {
      const result = textService.deleteText('non-existent');
      expect(result).toBe(false);
    });

    it('should delete existing text item', () => {
      textService.updateText('test-key', 'test content');
      const result = textService.deleteText('test-key');

      expect(result).toBe(true);
      expect(textService.getText('test-key')).toBeNull();
    });
  });

  describe('getAllTexts', () => {
    it('should return copy of all texts', () => {
      textService.updateText('key1', 'content1');
      textService.updateText('key2', 'content2');

      const texts = textService.getAllTexts();
      texts['key1'] = { ...texts['key1'], content: 'modified' };

      // Original should not be modified
      const original = textService.getText('key1');
      expect(original?.content).toBe('content1');
    });
  });

  describe('getMetadata', () => {
    it('should return correct metadata', () => {
      textService.updateText('key1', 'content1');
      textService.updateText('key2', 'content2');

      const metadata = textService.getMetadata();

      expect(metadata.version).toBe('1.0.0');
      expect(metadata.count).toBe(2);
      expect(metadata.lastUpdated).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });
});
