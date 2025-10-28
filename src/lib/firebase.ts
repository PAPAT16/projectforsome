import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJnvQOTa5BvEG7DQoqXxCTBYXINg8K9as",
  authDomain: "auth-for-foodtruck.firebaseapp.com",
  projectId: "auth-for-foodtruck",
  storageBucket: "auth-for-foodtruck.appspot.com",
  messagingSenderId: "766798354269",
  appId: "1:766798354269:web:1eb7b78f73db7f5da03ab4",
  measurementId: "G-MH7G7XVPGF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set up auth state persistence
auth.setPersistence('local');

// Export a function to listen to auth state changes
export const onAuthStateChangedListener = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    // The signed-in user info.
    const user = result.user;
    
    // Ensure we have the latest token
    const idToken = await user.getIdToken();
    
    return { 
      user: {
        ...user,
        id: user.uid,
        email: user.email,
        user_metadata: {
          full_name: user.displayName,
          avatar_url: user.photoURL
        }
      }, 
      token,
      idToken
    };
  } catch (error: any) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    console.error('Error signing in with Google:', {
      errorCode,
      errorMessage,
      email,
      credential
    });
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

