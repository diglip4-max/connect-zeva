// src/components/settings/DeviceList.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosClient from "@/api/axiosClient";
import { toast } from "sonner";

interface Device {
  _id: string;
  deviceLabel: string;
  osName?: string;
  lastUsedAt: string;
}

const fetchDevices = async (): Promise<Device[]> => {
  const { data } = await axiosClient.get("/push/devices");
  return data.data;
};

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const DeviceList = () => {
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery({
    queryKey: ["push-devices"],
    queryFn: fetchDevices,
  });

  const handleRevoke = async (id: string) => {
    try {
      await axiosClient.delete(`/push/devices/${id}`);
      queryClient.invalidateQueries({ queryKey: ["push-devices"] });
      toast.success("Device removed");
    } catch {
      toast.error("Failed to remove device");
    }
  };

  if (isLoading) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Loading devices...
      </p>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          No devices are currently receiving notifications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => {
        const isMobile = device.osName === "Android" || device.osName === "iOS";
        return (
          <div
            key={device._id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                {isMobile ? (
                  <Smartphone className="h-4 w-4 text-primary" />
                ) : (
                  <Laptop className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{device.deviceLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Active {formatRelativeTime(device.lastUsedAt)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRevoke(device._id)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceList;
