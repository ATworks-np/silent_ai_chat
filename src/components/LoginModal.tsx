"use client";

import { BaseModal } from "./BaseModal";
import { Stack } from "@mui/material";
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  signInWithCredential,
  AuthError
} from "firebase/auth";
import RoundedButton from "@/components/RoundedButton";
import { User, UserInfo } from "firebase/auth";
import {FirebaseError} from "@firebase/app";
import useUser from "@/hooks/useUser";
import {createStandardSubscription, syncUserRecord, updateUser} from "@/services/createUser";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

function getProfile(firebaseUser: User){
  const googleProfile = firebaseUser.providerData.find(
    (profile: UserInfo) => profile.providerId === "google.com"
  );

  return {
    displayName: googleProfile?.displayName ?? firebaseUser.displayName,
    photoURL: googleProfile?.photoURL ?? firebaseUser.photoURL,
  };
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const {refresh} = useUser();

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    let firebaseUser = null;

    try {
      // 1. まず現在の匿名ユーザーにリンクを試みる
      if (auth.currentUser) {
        const result = await linkWithPopup(auth.currentUser, provider);
        firebaseUser = result.user;

        await updateUser(
          {
            uid: firebaseUser.uid,
            ...getProfile(firebaseUser),
          }
        )

        await createStandardSubscription({
          uid: firebaseUser.uid
        });

        await refresh(true);
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // 2. 「すでに使われている」エラーの場合、そのアカウントでログインし直す
        if (error.code === 'auth/credential-already-in-use') {
          try {
            // エラーオブジェクトからクレデンシャル（Googleの認証情報）を取り出す
            const credential = GoogleAuthProvider.credentialFromError(error);
            if (credential) {
              // そのクレデンシャルを使ってログイン（切り替え）
              const result = await signInWithCredential(auth, credential);
              firebaseUser = result.user;
              await refresh(true);
            }
          } catch (signInError) {
            console.error("Switching account failed:", signInError);
            return;
          }
        } else {
          // それ以外のエラーはログに出して終了
          console.error("Link failed:", error);
          return;
        }
      } else {
        // Handle non-Firebase errors
        console.error("General Error:", error);
      }
    }

    if (!firebaseUser) {
      return;
    }

    try {
      onClose();
    } catch (error) {
      console.error("Error updating user data:", error);
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