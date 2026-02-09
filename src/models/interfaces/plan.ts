import {Timestamp} from "firebase/firestore";

export interface IPlan {
  id: string;
  name: string;
  gem: number;
  createdAt: Timestamp;
}

export const guestPlan: IPlan = {
  id: "NIlHZw0sb0i8Oy9dYY6X",
  name: "guest",
  gem: 0.1,
  createdAt: new Timestamp(0, 0)
};