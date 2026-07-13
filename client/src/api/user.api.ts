import type { IUser } from "@/types/user.types";
import axiosClient from "./axiosClient";

export const importUsersFromZevaClinic = async (accessToken: string) => {
  const { data } = await axiosClient.get<{
    success: boolean;
    message: string;
    data: IUser[];
  }>("/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!data?.success) throw new Error(data?.message || "Failed to fetch users");
  return data.data;
};
