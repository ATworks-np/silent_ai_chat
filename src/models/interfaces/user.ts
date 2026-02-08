import {Timestamp} from "firebase/firestore";

export interface IUserPlan {
  id: string;
  name: string;
  gem: number;
  createdAt: Timestamp;
}

export interface IUserConstructor {
  uid: string | undefined;
  token: string;
  displayName: string | null;
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined;
  photoURL: string | null;
  plan?: IUserPlan;
}

export interface IUser {
  uid: string | undefined;
  token: string;
  displayName: string | null;
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined;
  photoURL: string | null;
  isAuthenticated: boolean;
  isStandard: boolean;
  isPro: boolean;
  isUnlimited: boolean;
  plan: IUserPlan;
}

export interface IUserClass {
  props: IUser;
}
