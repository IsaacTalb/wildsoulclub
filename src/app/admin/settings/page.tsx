import { ResourceManager } from "@/components/admin/resource-manager";

export default function Page() {
  const fields = [
    { key: "key", label: "Setting key", required: true },
    { key: "value", label: "Value", required: true },
    { key: "group_name", label: "Group", required: true },
    { key: "description", label: "Description", type: "textarea" as const, required: false },
  ];

  return (
    <ResourceManager title="Website settings" resource="admin_settings" fields={fields} />
  );
}