import { ResourceManager } from "@/components/admin/resource-manager";

export default function Page() {
  const fields = [
    { key: "key", label: "Setting key", required: true },
    { key: "value", label: "Value", required: true },
    { key: "group_name", label: "Group", required: true },
  ];

  return (
    <ResourceManager title="Site settings" resource="site_settings" fields={fields} />
  );
}