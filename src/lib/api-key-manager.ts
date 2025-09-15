interface ApiKeys {
  gkpToken: string;
  lkoToken: string;
  apiUrl: string;
  aisensyKey: string;
  chatgptKey: string;
  geminiKey: string;
  deepseekKey: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

class ApiKeyManager {
  private static instance: ApiKeyManager;
  private apiKeys: ApiKeys | null = null;

  private constructor() {
    this.loadKeys();
  }

  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  private loadKeys(): void {
    try {
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        this.apiKeys = JSON.parse(savedKeys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      this.apiKeys = null;
    }
  }

  public getKeys(): ApiKeys | null {
    return this.apiKeys;
  }

  public getKey(key: keyof ApiKeys): string {
    return this.apiKeys?.[key] || '';
  }

  public saveKeys(keys: ApiKeys): void {
    try {
      localStorage.setItem('apiKeys', JSON.stringify(keys));
      this.apiKeys = keys;
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw new Error('Failed to save API keys');
    }
  }

  public updateKey(key: keyof ApiKeys, value: string): void {
    if (!this.apiKeys) {
      this.apiKeys = {
        gkpToken: '',
        lkoToken: '',
        apiUrl: 'https://care.kidaura.in/api/graphql',
        aisensyKey: '',
        chatgptKey: '',
        geminiKey: '',
        deepseekKey: '',
        razorpayKeyId: '',
        razorpayKeySecret: ''
      };
    }
    
    this.apiKeys[key] = value;
    this.saveKeys(this.apiKeys);
  }

  public clearKeys(): void {
    localStorage.removeItem('apiKeys');
    this.apiKeys = null;
  }

  public isConfigured(): boolean {
    return !!(this.apiKeys?.gkpToken && this.apiKeys?.lkoToken && this.apiKeys?.apiUrl);
  }

  public getApiUrl(): string {
    return this.getKey('apiUrl') || 'https://care.kidaura.in/api/graphql';
  }

  public getGkpToken(): string {
    return this.getKey('gkpToken');
  }

  public getLkoToken(): string {
    return this.getKey('lkoToken');
  }

  public getAisensyKey(): string {
    return this.getKey('aisensyKey');
  }

  public getChatgptKey(): string {
    return this.getKey('chatgptKey');
  }

  public getGeminiKey(): string {
    return this.getKey('geminiKey');
  }

  public getDeepseekKey(): string {
    return this.getKey('deepseekKey');
  }

  public getRazorpayKeyId(): string {
    return this.getKey('razorpayKeyId');
  }

  public getRazorpayKeySecret(): string {
    return this.getKey('razorpayKeySecret');
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();
export type { ApiKeys };
