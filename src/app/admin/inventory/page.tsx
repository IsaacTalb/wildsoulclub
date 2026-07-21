"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/admin/resource-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InventoryTransaction = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity_delta: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  products?: { name?: string | null; sku?: string | null } | null;
  product_variants?: { size?: string | null; color?: string | null; sku?: string | null } | null;
  users?: { full_name?: string | null; email?: string | null } | null;
};

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getSession() {
  const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
  return session;
}

function formatVariant(transaction: InventoryTransaction) {
  const variant = transaction.product_variants;
  if (!variant) return "Base product";
  return [variant.size, variant.color, variant.sku].filter(Boolean).join(" / ") || "Variant";
}

export default function Page() {
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const session = await getSession();
        const response = await fetch("/api/admin/inventory-transactions", {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const result = await readJson(response);
        if (!response.ok) throw new Error(result.error ?? "Unable to load inventory history");
        setHistory(result.data ?? []);
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "Unable to load inventory history");
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, []);

  return <div className="space-y-8">
    <ResourceManager title="Inventory" resource="products" fields={[{ key: "name", label: "Product name", required: true }, { key: "slug", label: "Slug", required: true }, { key: "description", label: "Description", type: "textarea", required: true }, { key: "price", label: "Price", type: "number", required: true }, { key: "stock", label: "Stock", type: "number", required: true }, { key: "sku", label: "SKU" }, { key: "is_active", label: "Active", type: "boolean" }]} />

    <Card>
      <CardHeader>
        <CardTitle>Inventory history</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {historyError ? <p role="alert" className="px-4 pb-4 text-sm text-destructive">{historyError}</p> : null}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Actor</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={7}>Loading history…</td></tr> : history.length === 0 ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={7}>No inventory movements yet.</td></tr> : history.map((transaction) => <tr key={transaction.id} className="border-b last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(transaction.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{transaction.products?.name ?? transaction.product_id}</td>
              <td className="px-4 py-3">{formatVariant(transaction)}</td>
              <td className="px-4 py-3"><Badge variant={transaction.quantity_delta > 0 ? "default" : "secondary"}>{transaction.quantity_delta > 0 ? "+" : ""}{transaction.quantity_delta}</Badge></td>
              <td className="px-4 py-3">{transaction.reason.replaceAll("_", " ")}</td>
              <td className="px-4 py-3">{transaction.reference_type ? `${transaction.reference_type}: ${transaction.reference_id}` : "—"}</td>
              <td className="px-4 py-3">{transaction.users?.full_name ?? transaction.users?.email ?? "System"}</td>
            </tr>)}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>;
}
