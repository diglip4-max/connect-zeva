import { fetchZevaConnectPermissions } from "@/api/permission.api";
import { useChatStore } from "@/store/chatStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const usePermissions = ({
  module,
  subModule,
}: {
  module: string;
  subModule: string;
}) => {
  const { permissions, setPermissions } = useChatStore();
  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ["permissions", module, subModule],
    queryFn: () => fetchZevaConnectPermissions(module, subModule),
  });

  useEffect(() => {
    setPermissions(permissionsData ?? null);
  }, [permissionsData]);

  return {
    isLoading,
    permissions,
  };
};

export default usePermissions;
