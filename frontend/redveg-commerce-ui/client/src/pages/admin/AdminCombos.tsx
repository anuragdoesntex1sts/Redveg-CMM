import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { prepareUploadImage } from "@/lib/prepareUploadImage";
import { Edit3, Loader2, Plus, Save, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ComboComponent = { productId: string; variantId: string; quantity: number };
type Combo = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string | null;
  price: number;
  listPrice: number;
  discountPercentage: number;
  stockCount: number;
  componentStock?: number;
  isActive: boolean;
  enabled: boolean;
  variants?: Array<{ stock?: number }>;
  components: Array<ComboComponent & { name: string; variant: string; stock: number; isAvailable: boolean }>;
};
type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  variants: Array<{ id: string; label: string; price: number; stock: number; isAvailable: boolean }>;
};
type Draft = { name: string; shortDescription: string; description: string; imageUrl: string; price: string; discountPercentage: string; stockCount: string; items: ComboComponent[] };

const emptyDraft = (): Draft => ({ name: "", shortDescription: "", description: "", imageUrl: "", price: "", discountPercentage: "0", stockCount: "0", items: [] });

export default function AdminCombos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [comboResponse, productResponse] = await Promise.all([
        apiFetch("combos/admin"),
        apiFetch("admin/products?limit=1000"),
      ]);
      const comboPayload = await comboResponse.json().catch(() => null);
      const productPayload = await productResponse.json().catch(() => null);
      if (!comboResponse.ok || comboPayload?.success !== true) throw new Error(comboPayload?.message || "Could not load combos.");
      if (!productResponse.ok || productPayload?.success !== true) throw new Error(productPayload?.message || "Could not load the product catalogue.");
      setCombos(Array.isArray(comboPayload.data) ? comboPayload.data : []);
      const rows = Array.isArray(productPayload.data) ? productPayload.data : [];
      setProducts(rows.map((product: any) => {
        let variants = product.variants;
        if (typeof variants === "string") {
          try { variants = JSON.parse(variants); } catch { variants = []; }
        }
        if (!Array.isArray(variants)) variants = [];
        return {
          id: String(product.id),
          name: String(product.name || "Unnamed product"),
          category: String(product.category || ""),
          isActive: Boolean(product.is_active ?? product.isActive),
          variants: variants.map((variant: any) => ({
            id: String(variant.id),
            label: String(variant.label || variant.size || variant.weight || variant.sku || "Variant"),
            price: Number(variant.price || 0),
            stock: Number(variant.stock ?? variant.stock_count ?? variant.stockCount ?? 0),
            isAvailable: Number(variant.is_available ?? variant.isAvailable ?? 1) === 1,
          })),
        };
      }));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load combos.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const eligibleProducts = useMemo(() => products.filter(product => {
    const category = product.category.trim().toLowerCase();
    return !["combos", "offers"].includes(category);
  }), [products]);

  const openNew = () => { setEditingId(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (combo: Combo) => {
    setEditingId(combo.id);
    setDraft({
      name: combo.name,
      shortDescription: combo.shortDescription || "",
      description: combo.description || "",
      imageUrl: combo.imageUrl || "",
      price: String(combo.listPrice ?? combo.price),
      discountPercentage: String(combo.discountPercentage || 0),
      stockCount: String(combo.stockCount ?? 0),
      items: combo.components.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    });
    setOpen(true);
  };

  const updateItem = (index: number, changes: Partial<ComboComponent>) => setDraft(current => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
  }));
  const addItem = () => setDraft(current => ({ ...current, items: [...current.items, { productId: "", variantId: "", quantity: 1 }] }));
  const removeItem = (index: number) => setDraft(current => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));

  const uploadComboImage = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Choose a JPEG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Choose an image smaller than 5 MB.");
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("image", await prepareUploadImage(file));
      const response = await apiFetch("media/upload/products", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false || !payload?.data?.url) throw new Error(payload?.message || `Image upload failed (HTTP ${response.status}).`);
      setDraft(current => ({ ...current, imageUrl: String(payload.data.url) }));
      toast.success("Combo image uploaded");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Combo image upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!draft.name.trim()) return toast.error("Enter a combo name.");
    if (!Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0) return toast.error("Enter the fixed combo price.");
    if (!Number.isFinite(Number(draft.discountPercentage)) || Number(draft.discountPercentage) < 0 || Number(draft.discountPercentage) >= 100) return toast.error("Enter a discount from 0% to less than 100%.");
    if (!Number.isInteger(Number(draft.stockCount)) || Number(draft.stockCount) < 0 || Number(draft.stockCount) > 1000000) return toast.error("Enter combo stock as a whole number from 0 to 1,000,000.");
    if (draft.items.length < 2 || new Set(draft.items.map(item => item.productId).filter(Boolean)).size < 2) {
      return toast.error("Add variants from at least two different products.");
    }
    if (draft.items.some(item => !item.productId || !item.variantId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 99)) {
      return toast.error("Choose a product variant and a quantity from 1 to 99 for each item.");
    }
    setSaving(true);
    try {
      const response = await apiFetch(editingId ? `combos/admin/${encodeURIComponent(editingId)}` : "combos/admin", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          shortDescription: draft.shortDescription,
          description: draft.description,
          imageUrl: draft.imageUrl,
          price: Number(draft.price),
          discountPercentage: Number(draft.discountPercentage),
          stockCount: Number(draft.stockCount),
          items: draft.items.map(item => ({ ...item, quantity: Number(item.quantity) })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success !== true) throw new Error(payload?.message || `Could not save combo (HTTP ${response.status}).`);
      toast.success(editingId ? "Combo updated" : "Combo created");
      setOpen(false);
      setDraft(emptyDraft());
      setEditingId(null);
      await load();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Could not save combo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (combo: Combo) => {
    setBusyId(combo.id);
    try {
      const response = await apiFetch(`combos/admin/${encodeURIComponent(combo.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !combo.enabled }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success !== true) throw new Error(payload?.message || "Could not update combo status.");
      await load();
      toast.success(combo.enabled ? "Combo hidden from the storefront" : "Combo published to the storefront");
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Could not update combo status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Combos" subtitle="Group product variants and set the price customers pay for the whole bundle." action={<Button onClick={openNew} className="h-11 rounded-full bg-[#B4232C] px-5 font-black text-white hover:bg-[#951D24]"><Plus className="mr-2 size-4" />Create combo</Button>}>
      {loading ? <div className="flex items-center gap-3 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Loading combos…</div> : error ? <div className="space-y-4 rounded-2xl bg-white p-6"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Try again</Button></div> : combos.length === 0 ? <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center"><h2 className="text-xl font-black">No combos yet</h2><p className="mt-2 text-sm text-muted-foreground">Choose product variants, set one combo price, and publish the bundle.</p><Button onClick={openNew} className="mt-5 rounded-full bg-[#B4232C] text-white"><Plus className="mr-2 size-4" />Create your first combo</Button></div> : <div className="grid gap-4 xl:grid-cols-2">{combos.map(combo => <article key={combo.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"><div className="flex gap-4 p-5">{combo.imageUrl ? <img src={combo.imageUrl} alt="" className="size-24 shrink-0 rounded-xl bg-[#F6F1EC] object-cover" /> : <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-[#F6F1EC] text-[#B4232C]"><PackageIcon /></div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{combo.name}</h2><p className="mt-1 text-xs text-muted-foreground">{combo.enabled ? combo.isActive ? "Published" : "Published · out of stock" : "Hidden"} · {combo.stockCount} combo stock set by admin · {combo.componentStock ?? combo.variants?.[0]?.stock ?? 0} supported by component stock</p></div><div className="shrink-0 text-right"><strong className="block text-xl">₹{Number(combo.price).toLocaleString("en-IN")}</strong>{combo.discountPercentage > 0 && <p className="text-xs text-muted-foreground"><span className="line-through">₹{Number(combo.listPrice).toLocaleString("en-IN")}</span><span className="ml-1 font-bold text-[#267345]">{combo.discountPercentage}% off</span></p>}</div></div><ul className="mt-3 space-y-1 text-sm text-muted-foreground">{combo.components.map(component => <li key={`${component.productId}:${component.variantId}`}>{component.quantity} × {component.name}{component.variant ? ` · ${component.variant}` : ""}</li>)}</ul><div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(combo)}><Edit3 className="mr-2 size-4" />Edit</Button><Button variant="outline" size="sm" disabled={busyId === combo.id} onClick={() => void toggleActive(combo)}>{busyId === combo.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{combo.enabled ? "Hide" : "Publish"}</Button></div></div></div></article>)}</div>}

      {open && <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 p-3 backdrop-blur-sm sm:p-6"><div className="mx-auto my-4 max-w-3xl rounded-3xl bg-[#FFFDF9] p-5 shadow-2xl sm:my-8 sm:p-8"><header className="flex items-start justify-between gap-4"><div><p className="text-xs font-black text-[#B4232C]">Bundle setup</p><h2 className="mt-1 font-display text-3xl font-black">{editingId ? "Edit combo" : "Create a combo"}</h2><p className="mt-2 text-sm text-muted-foreground">The price is for the complete bundle. Stock availability is calculated from the included variants.</p></div><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}><X className="size-5" /></Button></header>
        <div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="Combo name"><Input value={draft.name} maxLength={160} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Family dinner combo" /></Field><Field label="Fixed combo price before discount (₹)"><Input type="number" min="0.01" step="0.01" value={draft.price} onChange={event => setDraft(current => ({ ...current, price: event.target.value }))} placeholder="Price for the full combo" /></Field><Field label="Discount (%)"><Input type="number" min="0" max="99.99" step="0.01" value={draft.discountPercentage} onChange={event => setDraft(current => ({ ...current, discountPercentage: event.target.value }))} placeholder="0" /><span className="block text-xs font-normal text-muted-foreground">Customer price: ₹{(Number(draft.price || 0) * (1 - Number(draft.discountPercentage || 0) / 100)).toFixed(2)}</span></Field><Field label="Quantity (stock)"><Input type="number" min="0" max="1000000" step="1" value={draft.stockCount} onChange={event => setDraft(current => ({ ...current, stockCount: event.target.value }))} placeholder="Available combo quantity" /><span className="block text-xs font-normal text-muted-foreground">Remaining bundles available to sell. Component stock may limit this quantity.</span></Field><Field label="Short description"><Input value={draft.shortDescription} maxLength={300} onChange={event => setDraft(current => ({ ...current, shortDescription: event.target.value }))} placeholder="Optional storefront description" /></Field><Field label="Combo image"><div className="space-y-2"><div className="flex flex-wrap items-center gap-3">{draft.imageUrl && <img src={draft.imageUrl} alt="Combo preview" className="size-12 rounded-lg border border-black/10 object-cover" />}<input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose combo image" onChange={event => void uploadComboImage(event.target.files?.[0])} /><Button type="button" variant="outline" className="h-11 rounded-xl bg-white" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>{uploadingImage ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}{uploadingImage ? "Uploading…" : "Add your image"}</Button><span className="text-xs font-normal text-muted-foreground">JPEG, PNG, or WebP · max 5 MB</span></div><Input value={draft.imageUrl} onChange={event => setDraft(current => ({ ...current, imageUrl: event.target.value }))} placeholder="Or paste an image URL" /></div></Field></div>
        <div className="mt-4"><Field label="Description"><Textarea value={draft.description} maxLength={2000} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} className="min-h-24" placeholder="What is included or who this combo suits" /></Field></div>
        <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Included products</h3><p className="mt-1 text-xs text-muted-foreground">Choose a variant and how many packs go in each combo.</p></div><Button type="button" variant="outline" onClick={addItem}><Plus className="mr-2 size-4" />Add product</Button></div>
          {draft.items.length === 0 ? <p className="mt-4 rounded-xl bg-[#F8F5F1] p-4 text-sm text-muted-foreground">Add at least two different products.</p> : <div className="mt-4 space-y-3">{draft.items.map((item, index) => {
            const selectedProduct = products.find(product => product.id === item.productId);
            const selectedVariant = selectedProduct?.variants.find(variant => variant.id === item.variantId);
            const rowProducts = eligibleProducts.filter(product => (product.isActive || product.id === item.productId) && (product.id === item.productId || !draft.items.some((other, otherIndex) => otherIndex !== index && other.productId === product.id)));
            const rowVariants = selectedProduct?.variants.filter(variant => variant.isAvailable && variant.stock > 0 || variant.id === item.variantId) || [];
            return <div key={index} className="grid gap-3 rounded-xl border border-black/5 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_132px_auto]"><Field label="Product"><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm" value={item.productId} onChange={event => updateItem(index, { productId: event.target.value, variantId: "" })}><option value="">Choose a product</option>{rowProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field><Field label="Variant"><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm" value={item.variantId} onChange={event => updateItem(index, { variantId: event.target.value })}><option value="">Choose a variant</option>{rowVariants.map(variant => <option key={variant.id} value={variant.id}>{variant.label} · ₹{variant.price} · stock {variant.stock}</option>)}</select></Field><Field label="Packs per combo"><Input type="number" min="1" max="99" step="1" value={item.quantity} onChange={event => updateItem(index, { quantity: Number(event.target.value) })} /></Field><Button type="button" variant="ghost" size="icon" className="self-end text-[#B4232C]" aria-label="Remove product" onClick={() => removeItem(index)}><X className="size-4" /></Button>{selectedVariant && selectedVariant.stock === 0 && <p className="sm:col-span-4 text-xs text-amber-700">This variant is out of stock. Restock it before enabling the combo.</p>}</div>;
          })}</div>}
        </section>
        <footer className="mt-6 flex justify-end gap-3 border-t border-black/5 pt-5"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" disabled={saving} onClick={() => void save()} className="bg-[#B4232C] text-white hover:bg-[#951D24]">{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{saving ? "Saving…" : "Save combo"}</Button></footer>
      </div></div>}
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-bold"><Label>{label}</Label>{children}</label>; }
function PackageIcon() { return <span aria-hidden="true" className="text-3xl">📦</span>; }
