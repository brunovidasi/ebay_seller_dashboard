import { useEffect, useState } from "react";
import type { InventoryItem } from "shared";
import { api } from "../api/client";

interface EditState {
  selected: boolean;
  price: string;
  quantity: string;
}

export default function Products() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function loadItems() {
    setLoading(true);
    setError(null);
    api
      .getInventoryItems()
      .then((res) => {
        setItems(res.items);
        setEdits(
          Object.fromEntries(
            res.items.map((item) => [
              item.sku,
              { selected: false, price: String(item.price), quantity: String(item.quantity) },
            ]),
          ),
        );
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadItems, []);

  function updateEdit(sku: string, patch: Partial<EditState>) {
    setEdits((prev) => {
      const current = prev[sku] ?? { selected: false, price: "", quantity: "" };
      return { ...prev, [sku]: { ...current, ...patch } };
    });
  }

  async function applyBulkUpdate() {
    const updates = Object.entries(edits)
      .filter(([, edit]) => edit.selected)
      .map(([sku, edit]) => ({
        sku,
        price: edit.price === "" ? undefined : Number(edit.price),
        quantity: edit.quantity === "" ? undefined : Number(edit.quantity),
      }));

    if (updates.length === 0) {
      setMessage("Select at least one row to update.");
      return;
    }

    setMessage(null);
    setError(null);
    try {
      const { results } = await api.bulkUpdate({ updates });
      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        setMessage(`Updated ${results.length} item(s) successfully.`);
      } else {
        setMessage(`${results.length - failed.length} succeeded, ${failed.length} failed.`);
      }
      loadItems();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) return <p>Loading inventory…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <h2>Products</h2>
      {message && <p className="notice">{message}</p>}
      <table>
        <thead>
          <tr>
            <th></th>
            <th>SKU</th>
            <th>Title</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const edit = edits[item.sku];
            if (!edit) return null;
            return (
              <tr key={item.sku}>
                <td>
                  <input
                    type="checkbox"
                    checked={edit.selected}
                    onChange={(e) => updateEdit(item.sku, { selected: e.target.checked })}
                  />
                </td>
                <td>{item.sku}</td>
                <td>{item.title}</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={edit.price}
                    onChange={(e) => updateEdit(item.sku, { price: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={edit.quantity}
                    onChange={(e) => updateEdit(item.sku, { quantity: e.target.value })}
                  />
                </td>
                <td>{item.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && <p>No inventory items found yet.</p>}
      <button className="button" onClick={applyBulkUpdate}>
        Apply bulk update to selected rows
      </button>
    </section>
  );
}
