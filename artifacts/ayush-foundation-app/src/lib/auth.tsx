import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { firebaseAuth, requireFirebaseAuth } from './firebase';

export const ADMIN_EMAIL = 'adminayushmedical@gmail.com';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInCustomer: (email: string, password: string) => Promise<void>;
  signOutCustomer: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    const auth = firebaseAuth;
    void setPersistence(auth, browserLocalPersistence)
      .catch(() => undefined)
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL,
      isCustomer: Boolean(user) && user?.email?.toLowerCase() !== ADMIN_EMAIL,
      async signIn(email, password) {
        const auth = requireFirebaseAuth();
        const result = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
          await signOut(auth);
          throw new Error('This account is not authorized for the admin panel.');
        }
      },
      async signUp(name, email, password) {
        const auth = requireFirebaseAuth();
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
      },
      async signInCustomer(email, password) {
        const auth = requireFirebaseAuth();
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (result.user.email?.toLowerCase() === ADMIN_EMAIL) {
          await signOut(auth);
          throw new Error('Use the admin sign-in page for this account.');
        }
      },
      signOutCustomer: () => signOut(requireFirebaseAuth()),
      signOutAdmin: () => signOut(requireFirebaseAuth()),
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
