import {IUser, IUserConstructor, IUserClass} from '@/models/interfaces/user'
import {guestPlan} from '@/models/interfaces/plan'

class User implements IUserClass {
  props: IUser;

  constructor(props: IUserConstructor) {
    this.props = {
      ...props,
      isAuthenticated: false,
      isGuest: false,
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
      type: 'none',
      isGuest: false,
      isAuthenticated: false,
      isStandard: false,
      isPro: false,
      isUnlimited: false,
      plan: guestPlan,
    }
  }

  isAuthenticated() {
    return !!this.props.uid;
  }

  isGuest() {
    return this.props.plan.name == 'guest'
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
  type: 'none',
  plan: guestPlan,
});

export { guestUser, User };
