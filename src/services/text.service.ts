export interface TextItem {
  key: string;
  content: string;
  approvedAt?: string;
  approvedBy?: string;
  version: number;
}

export interface TextArtifact {
  version: string;
  lastUpdated: string;
  texts: Record<string, TextItem>;
}

export class TextService {
  private artifact: TextArtifact;

  constructor() {
    this.artifact = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      texts: {},
    };
  }

  /**
   * Load artifact from JSON string
   */
  loadFromJson(jsonString: string): void {
    try {
      const parsed = JSON.parse(jsonString);
      this.artifact = {
        version: parsed.version || '1.0.0',
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        texts: parsed.texts || {},
      };
    } catch (error) {
      // If parsing fails, start with empty artifact
      this.artifact = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        texts: {},
      };
    }
  }

  /**
   * Convert artifact to JSON string
   */
  toJsonString(): string {
    return JSON.stringify(this.artifact, null, 2);
  }

  /**
   * Get a text item by key
   */
  getText(key: string): TextItem | null {
    return this.artifact.texts[key] || null;
  }

  /**
   * Update or create a text item
   */
  updateText(key: string, content: string, approvedBy?: string): TextItem {
    const existing = this.getText(key);
    const version = existing ? existing.version + 1 : 1;

    const textItem: TextItem = {
      key,
      content,
      approvedAt: new Date().toISOString(),
      approvedBy,
      version,
    };

    this.artifact.texts[key] = textItem;
    this.artifact.lastUpdated = new Date().toISOString();

    return textItem;
  }

  /**
   * Delete a text item
   */
  deleteText(key: string): boolean {
    if (this.artifact.texts[key]) {
      delete this.artifact.texts[key];
      this.artifact.lastUpdated = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get all text items
   */
  getAllTexts(): Record<string, TextItem> {
    return { ...this.artifact.texts };
  }

  /**
   * Get artifact metadata
   */
  getMetadata() {
    return {
      version: this.artifact.version,
      lastUpdated: this.artifact.lastUpdated,
      count: Object.keys(this.artifact.texts).length,
    };
  }
}
