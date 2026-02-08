import { atom } from 'jotai'
import {User, guestUser} from '@/models/entities/user'

export const userAtom = atom<User>(
  guestUser,
)