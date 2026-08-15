import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
  signIn: (email: string, password: string) => Promise<void>;
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

    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL,
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
