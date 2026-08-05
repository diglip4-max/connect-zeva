export interface PermissionDTO {
  module: string;
  subModule: string;
  permission: {
    all: boolean;
    create: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
    read: boolean;
    update: boolean;
  };
}
