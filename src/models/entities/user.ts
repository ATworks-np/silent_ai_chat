import {IUser, IUserConstructor, IUserClass} from '@/models/interfaces/user'

class User implements IUserClass {
  props: IUser;

  constructor(props: IUserConstructor) {
    this.props = {
      ...props,
      isAuthenticated: false,
      isStandard: false,
      isPro: false,
      isUnlimited: false,
    }
    this.props.isAuthenticated = this.isAuthenticated()
  }

  setGuest() {
    this.props = {
      uid: undefined,
      token: 'guest',
      displayName: null,
      photoURL: null,
      type: 'guest',
      isAuthenticated: false,
      isStandard: false,
      isPro: false,
      isUnlimited: false,
    }
  }

  isAuthenticated() {
    return !!this.props.uid;
  }

  set(updates: Partial<IUser>) {
    this.props = { ...this.props, ...updates };
  }
}

const guestUser = new User({
  uid: undefined,
  token: 'guest',
  displayName: null,
  photoURL: null,
  type: 'guest',
});

export { guestUser, User };
