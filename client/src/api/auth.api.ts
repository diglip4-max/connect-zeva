import type { IUser } from "@/types/user.types";
import axiosClient from "./axiosClient";

export const verifySSOTicket = async (ticket: string) => {
  const { data } = await axiosClient.post<{
    data: { accessToken: string; user: IUser };
    success: boolean;
    message: string;
  }>("/auth/sso/verify", { ticket });
  const token = data?.data?.accessToken || "";
  const user = data?.data?.user || null;
  return { token, user };
};

export const getCurrentUser = async () => {
  const { data } = await axiosClient.get<{
    success: boolean;
    message: string;
    data: IUser;
  }>("/auth/me");
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
