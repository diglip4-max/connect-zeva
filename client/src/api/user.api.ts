import type { IUser } from "@/types/user.types";
import axiosClient from "./axiosClient";
import type { StaffMember } from "@/types/conversation.types";

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
export const fetchClinicStaff = async () => {
  const { data } = await axiosClient.get<{
    success: boolean;
    message: string;
    data: StaffMember[];
  }>("/users");
  if (!data?.success) throw new Error(data?.message || "Failed to fetch users");
  return data.data;
};
