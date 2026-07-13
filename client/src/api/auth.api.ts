import type { IUser } from "@/types/user.types";
import axiosClient from "./axiosClient";

export const verifySSOTicket = async (ticket: string) => {
  const { data } = await axiosClient.post<{ token: string; user: IUser }>(
    "/auth/sso/verify",
    { ticket },
  );
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosClient.get<{
    success: boolean;
    message: string;
    data: IUser;
  }>("/auth/me");
  console.log({ currentUser: data });
  if (!data) throw new Error("User not found");
  if (!data?.success) throw new Error(data?.message || "User not found");
  return data.data;
};

export const loginWithPassword = async (email: string, password: string) => {
  const { data } = await axiosClient.post<{
    success: boolean;
    message: string;
    data: { accessToken: string; user: IUser };
  }>("/auth/login", { email, password });

  return data;
};
