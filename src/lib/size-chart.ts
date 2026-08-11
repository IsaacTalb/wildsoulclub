export type SizeChart = {
  title: string;
  columns: string[];
  rows: string[][];
};

export const SIZE_CHART_TEMPLATES: Record<string, SizeChart> = {
  Shirt: {
    title: "Measurements (inches)",
    columns: ["Size", "Length", "Chest", "Shoulder", "Sleeve"],
    rows: [["S", "", "", "", ""], ["M", "", "", "", ""], ["L", "", "", "", ""], ["XL", "", "", "", ""]],
  },
  Jacket: {
    title: "Measurements (inches)",
    columns: ["Size", "Body length", "Chest", "Shoulder", "Sleeve"],
    rows: [["S", "", "", "", ""], ["M", "", "", "", ""], ["L", "", "", "", ""], ["XL", "", "", "", ""]],
  },
  Pants: {
    title: "Measurements (inches)",
    columns: ["Size", "Waist", "Hip", "Rise", "Inseam"],
    rows: [["S", "", "", "", ""], ["M", "", "", "", ""], ["L", "", "", "", ""], ["XL", "", "", "", ""]],
  },
};

export function normalizeSizeChart(value: unknown): SizeChart | null {
  if (value == null || value === "") return null;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Size chart must be a table.");

  const chart = value as Partial<SizeChart>;
  if (!Array.isArray(chart.columns) || chart.columns.length < 2 || chart.columns.length > 12) {
    throw new Error("Size chart must have between 2 and 12 columns.");
  }
  if (!Array.isArray(chart.rows) || chart.rows.length < 1 || chart.rows.length > 30) {
    throw new Error("Size chart must have between 1 and 30 rows.");
  }

  const columns = chart.columns.map((column) => String(column ?? "").trim());
  if (columns.some((column) => !column)) throw new Error("Every size chart column needs a heading.");
  const rows = chart.rows.map((row) => {
    if (!Array.isArray(row) || row.length !== columns.length) throw new Error("Every size chart row must match its columns.");
    return row.map((cell) => String(cell ?? "").trim());
  });
  if (rows.some((row) => !row[0])) throw new Error("Every size chart row needs a size label.");

  return { title: String(chart.title ?? "Size chart").trim() || "Size chart", columns, rows };
}
