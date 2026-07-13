// src/types/express.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      clinicId: string;
      role: string;
      name: string;
    };
  }
}
