export interface IUser {
  id: string;
  zevaUserId: string;
  clinicId: string;
  name: string;
  avatarUrl?: string;
  role: "doctor" | "receptionist" | "staff" | "admin";
}

export interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
}
