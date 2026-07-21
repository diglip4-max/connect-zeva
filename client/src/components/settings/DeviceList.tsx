// src/components/settings/DeviceList.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosClient from "@/api/axiosClient";

interface Device {
  _id: string;
  deviceLabel: string;
  lastUsedAt: string;
}

const fetchDevices = async (): Promise<Device[]> => {
  const { data } = await axiosClient.get("/push/devices");
  return data.data;
};

const DeviceList = () => {
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery({
    queryKey: ["push-devices"],
    queryFn: fetchDevices,
  });

  const handleRevoke = async (id: string) => {
    await axiosClient.delete(`/push/devices/${id}`);
    queryClient.invalidateQueries({ queryKey: ["push-devices"] });
  };

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-2">
      {devices?.map((device) => (
        <div
          key={device._id}
          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
        >
          <div className="flex items-center gap-2.5">
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{device.deviceLabel}</p>
              <p className="text-xs text-muted-foreground">
                Last used {new Date(device.lastUsedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRevoke(device._id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default DeviceList;
