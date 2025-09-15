// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWX0m8p2ezPEePVX5MRdhEhKoazZU9VQA",
  authDomain: "aaryavart-insights.firebaseapp.com",
  projectId: "aaryavart-insights",
  storageBucket: "aaryavart-insights.firebasestorage.app",
  messagingSenderId: "684934592172",
  appId: "1:684934592172:web:ec3a943a63e48807821109"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enhanced Firestore connection with authentication check
export const connectToFirestore = async (): Promise<boolean> => {
  try {
    // Wait for auth state to be determined
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          console.log('Firestore connection established for user:', user.uid);
          resolve(true);
        } else {
          console.log('No authenticated user, Firestore connection skipped');
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Error connecting to Firestore:', error);
    return false;
  }
};

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore API Key Management
export interface ApiKeys {
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

// Save API keys to Firestore
export const saveApiKeys = async (userId: string, apiKeys: ApiKeys): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      apiKeys: apiKeys,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error saving API keys:', error);
    return { success: false, error: error.message };
  }
};

// Get API keys from Firestore
export const getApiKeys = async (userId: string): Promise<{ success: boolean; data?: ApiKeys; error?: string }> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const defaultKeys: ApiKeys = {
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
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, data: { ...defaultKeys, ...userData.apiKeys } };
    } else {
      return { success: true, data: defaultKeys };
    }
  } catch (error: any) {
    console.error('Error getting API keys:', error);
    return { success: false, error: error.message };
  }
};

// Update specific API key
export const updateApiKey = async (userId: string, keyName: keyof ApiKeys, value: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      [`apiKeys.${keyName}`]: value,
      lastUpdated: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating API key:', error);
    return { success: false, error: error.message };
  }
};

// Delete API keys
export const deleteApiKeys = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting API keys:', error);
    return { success: false, error: error.message };
  }
};

export default app;
