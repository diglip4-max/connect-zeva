export interface ZevaTicketPayload {
  zevaUserId: string;
  clinicId: string;
  name: string;
  avatarUrl?: string;
  role: "doctor" | "receptionist" | "staff" | "admin";
}

export interface JwtPayload {
  userId: string;
  zevaUserId: string;
  clinicId: string;
  role: string;
}
