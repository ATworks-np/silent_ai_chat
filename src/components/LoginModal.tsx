"use client";

import { BaseModal } from "./BaseModal";
import { Stack } from "@mui/material";
import { GoogleAuthProvider, getAuth, linkWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/libs/firebase";
import RoundedButton from "@/components/RoundedButton";
import {useAtom} from "jotai/index";
import {userAtom} from "@/stores/user";
import {User} from "@/models/entities/user";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [, setUser] = useAtom(userAtom)

  const handleGoogleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      //const result = await signInWithPopup(auth, provider);

      const currentUser = auth.currentUser;
      let result = undefined;
      if (currentUser && currentUser.isAnonymous) {
        result = await linkWithPopup(currentUser, provider);
      }

      if (!result) {
        throw new Error("エラーが発生しました");
      }

      const firebaseUser = result.user;
      const token = await firebaseUser.getIdToken();

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'versions/1/users', firebaseUser.uid);
      const docSnapshot = await getDoc(userDocRef);

      // If user doesn't exist, create a new document
      if (!docSnapshot.exists()) {
        await setDoc(userDocRef, {
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          type: 'standard',
        });
      }

      // Update user state
      setUser(
        new User({
          uid: firebaseUser.uid,
          token,
          photoURL: firebaseUser.photoURL,
          displayName: firebaseUser.displayName,
          type: 'standard',
        })
      );

      onClose();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
    >
      <Stack spacing={2} alignItems="center">
        <RoundedButton
          variant="contained" 
          color="primary" 
          onClick={handleGoogleLogin}
          fullWidth
        >
          GOOGLEでログイン
        </RoundedButton>
      </Stack>
    </BaseModal>
  );
}
