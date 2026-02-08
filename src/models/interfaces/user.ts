export interface IUserConstructor {
  uid: string | undefined
  token: string
  displayName: string | null
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined
  photoURL: string | null;
}

export interface IUser {
  uid: string | undefined
  token: string
  displayName: string | null
  type: 'guest' | 'standard' | 'pro' | 'unlimited' | undefined
  photoURL: string | null;
  isAuthenticated: boolean;
  isStandard: boolean;
  isPro: boolean;
  isUnlimited: boolean;
}

export  interface IUserClass {
  props: IUser
}
