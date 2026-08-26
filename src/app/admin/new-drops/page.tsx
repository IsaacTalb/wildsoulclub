import { ResourceManager } from "@/components/admin/resource-manager";

export default function Page() {
  return (
    <ResourceManager
      title="Drops"
      resource="drops"
      fields={[
        { key: "name", label: "Drop name", required: true },
        { key: "slug", label: "Slug", required: true },
        { key: "season", label: "Season (for example, Spring 2026)", required: true },
        { key: "status", label: "Status", type: "select", required: true, options: ["draft", "scheduled", "active", "archived"], defaultValue: "draft" },
        { key: "release_date", label: "Release date", type: "datetime-local" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "collection_id", label: "Collection", type: "select", optionResource: "collections" },
        { key: "banner_image_url", label: "Banner image", type: "image", folder: "new-drops", objectKeyField: "banner_object_key", focalPoint: { xField: "banner_position_x", yField: "banner_position_y" } },
      ]}
    />
  );
}
