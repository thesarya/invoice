import { 
  saveApiKeys, 
  getApiKeys, 
  updateApiKey, 
  deleteApiKeys, 
  ApiKeys as FirebaseApiKeys 
} from './firebase';
import { useAuth } from '@/contexts/AuthContext';

class FirebaseApiKeyManager {
  private static instance: FirebaseApiKeyManager;
  private apiKeys: FirebaseApiKeys | null = null;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): FirebaseApiKeyManager {
    if (!FirebaseApiKeyManager.instance) {
      FirebaseApiKeyManager.instance = new FirebaseApiKeyManager();
    }
    return FirebaseApiKeyManager.instance;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public async loadKeys(): Promise<FirebaseApiKeys> {
    if (!this.userId) {
      console.warn('No user ID set for API key manager');
      return this.getDefaultKeys();
    }

    try {
      const result = await getApiKeys(this.userId);
      if (result.success && result.data) {
        this.apiKeys = { ...this.getDefaultKeys(), ...result.data };
        return this.apiKeys;
      } else {
        console.error('Failed to load API keys from Firebase:', result.error);
        // Fallback to local storage
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading API keys from Firebase:', error);
      // Fallback to local storage
      return this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): FirebaseApiKeys {
    try {
      const savedKeys = localStorage.getItem('apiKeys');
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        this.apiKeys = { ...this.getDefaultKeys(), ...parsed };
        console.log('Loaded API keys from local storage as fallback');
        return this.apiKeys;
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
    return this.getDefaultKeys();
  }

  public async saveKeys(keys: FirebaseApiKeys): Promise<boolean> {
    if (!this.userId) {
      console.error('No user ID set for API key manager');
      return false;
    }

    try {
      const result = await saveApiKeys(this.userId, keys);
      if (result.success) {
        this.apiKeys = keys;
        // Also save to local storage as backup
        this.saveToLocalStorage(keys);
        return true;
      } else {
        console.error('Failed to save API keys to Firebase:', result.error);
        // Fallback to local storage
        return this.saveToLocalStorage(keys);
      }
    } catch (error) {
      console.error('Error saving API keys to Firebase:', error);
      // Fallback to local storage
      return this.saveToLocalStorage(keys);
    }
  }

  private saveToLocalStorage(keys: FirebaseApiKeys): boolean {
    try {
      localStorage.setItem('apiKeys', JSON.stringify(keys));
      this.apiKeys = keys;
      console.log('Saved API keys to local storage as fallback');
      return true;
    } catch (error) {
      console.error('Error saving to local storage:', error);
      return false;
    }
  }

  public async updateKey(keyName: keyof FirebaseApiKeys, value: string): Promise<boolean> {
    if (!this.userId) {
      console.error('No user ID set for API key manager');
      return false;
    }

    try {
      const result = await updateApiKey(this.userId, keyName, value);
      if (result.success) {
        if (!this.apiKeys) {
          this.apiKeys = this.getDefaultKeys();
        }
        this.apiKeys[keyName] = value;
        return true;
      } else {
        console.error('Failed to update API key:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      return false;
    }
  }

  public async deleteKeys(): Promise<boolean> {
    if (!this.userId) {
      console.error('No user ID set for API key manager');
      return false;
    }

    try {
      const result = await deleteApiKeys(this.userId);
      if (result.success) {
        this.apiKeys = null;
        return true;
      } else {
        console.error('Failed to delete API keys:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting API keys:', error);
      return false;
    }
  }

  public getKey(keyName: keyof FirebaseApiKeys): string {
    if (!this.apiKeys) {
      return this.getDefaultKeys()[keyName];
    }
    return this.apiKeys[keyName] || this.getDefaultKeys()[keyName];
  }

  public getKeys(): FirebaseApiKeys {
    try {
      if (!this.apiKeys) {
        return this.getDefaultKeys();
      }
      return { ...this.getDefaultKeys(), ...this.apiKeys };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return this.getDefaultKeys();
    }
  }

  public isConfigured(): boolean {
    try {
      if (!this.apiKeys) {
        return false;
      }
      
      // Check if essential keys are configured
      return !!(
        this.apiKeys.gkpToken ||
        this.apiKeys.lkoToken ||
        this.apiKeys.aisensyKey ||
        this.apiKeys.razorpayKeyId ||
        this.apiKeys.geminiKey ||
        this.apiKeys.deepseekKey
      );
    } catch (error) {
      console.error('Error checking configuration:', error);
      return false;
    }
  }

  private getDefaultKeys(): FirebaseApiKeys {
    return {
      gkpToken: import.meta.env.VITE_GKP_TOKEN || '',
      lkoToken: import.meta.env.VITE_LKO_TOKEN || '',
      apiUrl: import.meta.env.VITE_API_URL || 'https://care.kidaura.in/api/graphql',
      aisensyKey: import.meta.env.VITE_AISENSY_KEY || '',
      chatgptKey: import.meta.env.VITE_CHATGPT_KEY || '',
      geminiKey: import.meta.env.VITE_GEMINI_KEY || '',
      deepseekKey: import.meta.env.VITE_DEEPSEEK_KEY || '',
      razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      razorpayKeySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || ''
    };
  }

  // Individual getter methods for convenience
  public getGkpToken(): string {
    return this.getKey('gkpToken');
  }

  public getLkoToken(): string {
    return this.getKey('lkoToken');
  }

  public getApiUrl(): string {
    return this.getKey('apiUrl');
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

export const firebaseApiKeyManager = FirebaseApiKeyManager.getInstance();
export type { FirebaseApiKeys as ApiKeys };

