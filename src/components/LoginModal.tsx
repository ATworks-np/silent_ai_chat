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
import {addDoc, collection, doc, getDoc, serverTimestamp, setDoc} from "firebase/firestore";
import { db } from "@/libs/firebase";
import RoundedButton from "@/components/RoundedButton";
import { useAtom } from "jotai/index";
import { userAtom } from "@/stores/user";
import { User } from "@/models/entities/user";
import {standardPlan} from "@/models/interfaces/plan";
import {FirebaseError} from "@firebase/app";
import {refresh} from "next/cache";
import useUser from "@/hooks/useUser";
import {createStandardSubscription, syncUserRecord, updateUser} from "@/services/createUser";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    let firebaseUser = null;

    try {
      // 1. まず現在の匿名ユーザーにリンクを試みる
      if (auth.currentUser) {
        const result = await linkWithPopup(auth.currentUser, provider);
        firebaseUser = result.user;


        const googleProfile = firebaseUser.providerData.find(
          (profile) => profile.providerId === "google.com"
        );

        const displayName = googleProfile?.displayName ?? firebaseUser.displayName;
        const photoURL = googleProfile?.photoURL ?? firebaseUser.photoURL;

        console.log(firebaseUser);

        await updateUser({
          uid: firebaseUser.uid,
          displayName: displayName,
          photoURL: photoURL,
        })

        await createStandardSubscription({
          uid: firebaseUser.uid
        });

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
              console.log(firebaseUser);
              await updateUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              })
              await createStandardSubscription({
                uid: firebaseUser.uid
              });
              console.log("既存のアカウントに切り替えました");
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