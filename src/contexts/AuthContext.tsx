import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";

interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username
      });
      
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Error during sign up:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Error during sign in:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists in Firestore, if not create one
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a new user profile in Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`
        });
      }

      toast.success("Signed in with Google successfully!");
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast.error(error.message || "Failed to sign in with Google");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully!");
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast.error(error.message || "Failed to send password reset email");
      throw error;
    }
  };

  const updateUsername = async (username: string) => {
    if (!currentUser) {
      toast.error("No user is signed in");
      return;
    }
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { username }, { merge: true });
      
      // Update the local userProfile state
      setUserProfile(prev => prev ? { ...prev, username } : null);
      
      toast.success("Username updated successfully!");
    } catch (error: any) {
      console.error("Error updating username:", error);
      toast.error(error.message || "Failed to update username");
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUsername
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
