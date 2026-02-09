import {IPlan} from "@/models/interfaces/plan";

export interface IUserConstructor {
  uid: string | undefined;
  token: string;
  displayName: string | null;
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined;
  photoURL: string | null;
  plan?: IPlan;
}

export interface IUser {
  uid: string | undefined;
  token: string;
  displayName: string | null;
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined;
  photoURL: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isStandard: boolean;
  isPro: boolean;
  isUnlimited: boolean;
  plan: IPlan;
}

export interface IUserClass {
  props: IUser;
}
