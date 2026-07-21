import { ResourceManager } from "@/components/admin/resource-manager";

export default function Page() {
  return (
    <ResourceManager
      title="Drops"
      resource="drops"
      fields={[
        { key: "name", label: "Drop name", required: true },
        { key: "slug", label: "Slug", required: true },
        { key: "status", label: "Status", type: "select", required: true, options: ["draft", "scheduled", "active", "archived"], defaultValue: "draft" },
        { key: "release_date", label: "Release date", type: "datetime-local" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "collection_id", label: "Collection ID" },
        { key: "banner_image_url", label: "Banner image", type: "image", folder: "drops", objectKeyField: "banner_object_key" },
      ]}
    />
  );
}
