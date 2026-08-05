import type { PermissionDTO } from "@/types/permission.types";
import axiosClient from "./axiosClient";

export const fetchZevaConnectPermissions = async (
  module: string,
  subModule: string,
): Promise<PermissionDTO> => {
  const { data } = await axiosClient.get(`/permissions`, {
    params: {
      module,
      subModule,
    },
  });
  //   const
  if (!data?.success) {
    throw new Error(data?.message || "Failed to fetch permissions");
  }
  if (!data?.data?.permissions) {
    throw new Error("Permissions not found");
  }

  const { moduleActions, subModuleActions } = data?.data || {};
  const permissionData: PermissionDTO = {
    module,
    subModule,
    permission: {
      all: moduleActions.all && subModuleActions.all,
      create: moduleActions.create && subModuleActions.create,
      delete: moduleActions.delete && subModuleActions.delete,
      export: moduleActions.export && subModuleActions.export,
      import: moduleActions.import && subModuleActions.import,
      read: moduleActions.read && subModuleActions.read,
      update: moduleActions.update && subModuleActions.update,
    },
  };
  return permissionData;
};
