"use client";
import { useState, useMemo } from "react";

const C = {
  bg: "#F7F4EE", card: "#FFFFFF", green: "#3D6B4F", greenLight: "#EAF3EC",
  amber: "#D48B2E", amberLight: "#FDF3E3", red: "#C0392B", redLight: "#FDEAEA",
  blue: "#2E6EA6", blueLight: "#E8F1FA",
  text: "#2C2C2C", muted: "#888", border: "#E5E0D8",
};

const PLATE_211 = [
  { key: "veggie",   label: "蔬菜 ½",  color: C.green, tip: "佔餐盤½，多色蔬菜最佳" },
  { key: "protein",  label: "蛋白質 ¼", color: C.amber, tip: "魚、豆腐、雞肉、蛋" },
  { key: "carb",     label: "全穀 ¼",  color: "#A07850", tip: "糙米、燕麥、地瓜優先" },
];
const CAT_ORDER = ["veggie", "protein", "carb"];
const CAT_LABEL = { veggie: "蔬菜", protein: "蛋白質", carb: "全穀" };
const CAT_COLOR = { veggie: C.green, protein: C.amber, carb: "#A07850" };

const DAYS_TW = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
const MEAL_TYPES = ["早餐", "晚餐"];
const BUDGET = { breakfast: 100, dinner: 300 };
const TABS = [
  { icon: "📋", label: "食材庫" }, { icon: "🛒", label: "採購" },
  { icon: "🍽️", label: "料理" }, { icon: "📅", label: "週計劃" },
  { icon: "🥡", label: "外食" }, { icon: "📊", label: "月紀錄" },
  { icon: "💹", label: "價格" }, { icon: "📖", label: "料理史" },
];

const UNIT_OPTIONS = ["g", "公斤", "台斤", "斤", "兩", "顆", "把", "包", "袋", "罐", "塊", "份"];
const PURCHASE_UNITS = [
  { label: "台斤", toBase: 600,  baseUnit: "g" },
  { label: "斤",   toBase: 500,  baseUnit: "g" },
  { label: "兩",   toBase: 37.5, baseUnit: "g" },
  { label: "公斤", toBase: 1000, baseUnit: "g" },
  { label: "g",    toBase: 1,    baseUnit: "g" },
  { label: "把",   toBase: null, baseUnit: "把" },
  { label: "顆",   toBase: null, baseUnit: "顆" },
  { label: "包",   toBase: null, baseUnit: "包" },
  { label: "袋",   toBase: null, baseUnit: "袋" },
  { label: "罐",   toBase: null, baseUnit: "罐" },
  { label: "塊",   toBase: null, baseUnit: "塊" },
  { label: "份",   toBase: null, baseUnit: "份" },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const fmt = (n) => `$${Math.round(Number(n))}`;
const fmtDec = (n, u) => `$${Number(n).toFixed(2)}/${u}`;
const today = () => new Date().toISOString().slice(0, 10);
const monthOf = (d) => d?.slice(0, 7) ?? "";

const convertToBase = (qty, purchaseUnit, ingUnit) => {
  const conv = PURCHASE_UNITS.find(u => u.label === purchaseUnit);
  if (!conv || conv.toBase === null || ingUnit !== "g") return Number(qty);
  return Number(qty) * conv.toBase;
};

const calcAvgUnitPrice = (ingId, purchases) => {
  const records = purchases.filter(p => p.ingId === ingId && p.baseQty > 0);
  if (!records.length) return null;
  return records.reduce((s, p) => s + p.price, 0) / records.reduce((s, p) => s + p.baseQty, 0);
};

const calcRecipeCost = (recipe, ingredients, purchases) => {
  let total = 0, hasAll = true;
  recipe.ingredients.forEach(ri => {
    const avg = calcAvgUnitPrice(ri.id, purchases);
    if (avg === null) { hasAll = false; return; }
    total += avg * ri.qty;
  });
  return { total: hasAll ? total : null, hasAll };
};

// merge plate211 from multiple recipes
const mergePlate211 = (rids, recipes) => {
  const merged = { veggie: false, protein: false, carb: false };
  rids.forEach(rid => {
    const r = recipes.find(x => x.id === rid);
    if (!r) return;
    Object.keys(merged).forEach(k => { if (r.plate211[k]) merged[k] = true; });
  });
  return merged;
};

const SEED_ING = [
  { id: "i1", name: "雞胸肉", unit: "g",  category: "protein", stock: 600 },
  { id: "i2", name: "菠菜",   unit: "g",  category: "veggie",  stock: 300 },
  { id: "i3", name: "糙米",   unit: "g",  category: "carb",    stock: 1000 },
  { id: "i4", name: "雞蛋",   unit: "顆", category: "protein", stock: 10 },
  { id: "i5", name: "豆腐",   unit: "塊", category: "protein", stock: 2 },
  { id: "i6", name: "花椰菜", unit: "g",  category: "veggie",  stock: 400 },
];
const SEED_RCP = [
  { id: "r1", name: "雞肉炒菠菜",      ingredients: [{ id: "i1", qty: 200 }, { id: "i2", qty: 150 }, { id: "i3", qty: 100 }], plate211: { veggie: true,  protein: true,  carb: true  } },
  { id: "r2", name: "溏心蛋燕麥粥",    ingredients: [{ id: "i4", qty: 2 }],                                                    plate211: { veggie: false, protein: true,  carb: true  } },
  { id: "r3", name: "清蒸豆腐花椰菜飯", ingredients: [{ id: "i5", qty: 1 }, { id: "i6", qty: 200 }, { id: "i3", qty: 100 }],  plate211: { veggie: true,  protein: true,  carb: true  } },
];
const SEED_PURCHASES = [
  { id: "p1", ingId: "i1", ingName: "雞胸肉", ingUnit: "g", purchaseUnit: "台斤", qty: 1,   baseQty: 600,  price: 90,  date: "2026-04-01" },
  { id: "p2", ingId: "i1", ingName: "雞胸肉", ingUnit: "g", purchaseUnit: "台斤", qty: 1,   baseQty: 600,  price: 85,  date: "2026-04-14" },
  { id: "p3", ingId: "i3", ingName: "糙米",   ingUnit: "g", purchaseUnit: "公斤", qty: 1,   baseQty: 1000, price: 65,  date: "2026-04-01" },
  { id: "p4", ingId: "i4", ingName: "雞蛋",   ingUnit: "顆", purchaseUnit: "顆", qty: 10,  baseQty: 10,   price: 50,  date: "2026-04-07" },
  { id: "p5", ingId: "i4", ingName: "雞蛋",   ingUnit: "顆", purchaseUnit: "顆", qty: 10,  baseQty: 10,   price: 55,  date: "2026-04-21" },
  { id: "p6", ingId: "i2", ingName: "菠菜",   ingUnit: "g", purchaseUnit: "把",  qty: 1,   baseQty: 300,  price: 20,  date: "2026-04-10" },
];

export default function App() {
  const [tab, setTab] = useState(0);
  const [ingredients, setIngredients] = useState(SEED_ING);
  const [recipes, setRecipes] = useState(SEED_RCP);
  const [purchases, setPurchases] = useState(SEED_PURCHASES);
  // weekPlan: { "週一-早餐": { slots: [{ rid, cooked }] } }
  const [weekPlan, setWeekPlan] = useState({});
  const [diningOut, setDiningOut] = useState([]);
  const [cookHistory, setCookHistory] = useState([]);

  // helper: get all rids for a slot key
  const getSlots = (key) => weekPlan[key]?.slots || [{ rid: "", cooked: false }];
  const setSlots = (key, slots) => setWeekPlan(p => ({ ...p, [key]: { slots } }));

  // week cost
  const weekCost = useMemo(() => {
    let bf = 0, dn = 0;
    Object.entries(weekPlan).forEach(([key, val]) => {
      val?.slots?.forEach(slot => {
        const r = recipes.find(x => x.id === slot.rid);
        if (!r) return;
        const { total } = calcRecipeCost(r, ingredients, purchases);
        const cost = total ?? 0;
        if (key.includes("早餐")) bf += cost; else dn += cost;
      });
    });
    return { bf, dn, total: bf + dn };
  }, [weekPlan, recipes, ingredients, purchases]);

  const weekBudget = { bf: BUDGET.breakfast * 7, dn: BUDGET.dinner * 7 };
  const savings = weekBudget.bf + weekBudget.dn - weekCost.total;

  // shopping list
  const shoppingList = useMemo(() => {
    const map = {};
    Object.values(weekPlan).forEach(val => {
      val?.slots?.forEach(slot => {
        const r = recipes.find(x => x.id === slot.rid);
        if (!r) return;
        r.ingredients.forEach(({ id, qty }) => {
          const ing = ingredients.find(x => x.id === id);
          if (!ing) return;
          if (!map[id]) map[id] = { ...ing, needed: 0 };
          map[id].needed += qty;
        });
      });
    });
    return Object.values(map).map(item => ({ ...item, toBuy: Math.max(0, item.needed - item.stock) }));
  }, [weekPlan, recipes, ingredients]);

  const markCooked = (key, slotIdx) => {
    const slots = getSlots(key);
    const slot = slots[slotIdx];
    if (!slot || slot.cooked) return;
    const r = recipes.find(x => x.id === slot.rid);
    if (!r) return;
    const parts = key.split("-");
    setIngredients(prev => prev.map(ing => {
      const used = r.ingredients.find(ri => ri.id === ing.id);
      if (!used) return ing;
      return { ...ing, stock: Math.max(0, ing.stock - used.qty) };
    }));
    const newSlots = slots.map((s, i) => i === slotIdx ? { ...s, cooked: true } : s);
    setSlots(key, newSlots);
    const { total } = calcRecipeCost(r, ingredients, purchases);
    setCookHistory(prev => [{ id: uid(), recipeId: r.id, recipeName: r.name, mtype: parts[1], day: parts[0], date: today(), cost: total ?? 0, plate211: r.plate211 }, ...prev]);
  };

  const exportShopping = () => {
    const lines = ["📋 本週購物清單", "─".repeat(28), ""];
    shoppingList.forEach(item => {
      lines.push(`• ${item.name}　需 ${item.needed}${item.unit}　${item.toBuy > 0 ? `需購買 ${item.toBuy}${item.unit}` : "✅ 庫存足夠"}`);
    });
    lines.push("", "─".repeat(28), `週花費：${fmt(weekCost.total)}　結餘：${fmt(savings)}`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    a.download = "購物清單.txt"; a.click();
  };

  return (
    <div style={{ fontFamily: "'Noto Sans TC', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ background: C.green, padding: "16px 16px 0", color: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🥗 健康廚房計畫</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>211餐盤 · 兩人份 · 精打細算</div>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ background: tab === i ? "#fff" : "transparent", color: tab === i ? C.green : "rgba(255,255,255,0.8)", border: "none", borderRadius: "8px 8px 0 0", padding: "8px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 14, maxWidth: 640, margin: "0 auto" }}>
        {tab === 0 && <IngredientsTab ingredients={ingredients} setIngredients={setIngredients} />}
        {tab === 1 && <PurchasesTab purchases={purchases} setPurchases={setPurchases} ingredients={ingredients} setIngredients={setIngredients} />}
        {tab === 2 && <RecipesTab recipes={recipes} setRecipes={setRecipes} ingredients={ingredients} setIngredients={setIngredients} purchases={purchases} />}
        {tab === 3 && <WeekPlanTab weekPlan={weekPlan} getSlots={getSlots} setSlots={setSlots} recipes={recipes} setRecipes={setRecipes} ingredients={ingredients} setIngredients={setIngredients} purchases={purchases} weekCost={weekCost} weekBudget={weekBudget} savings={savings} shoppingList={shoppingList} onExport={exportShopping} markCooked={markCooked} />}
        {tab === 4 && <DiningOutTab diningOut={diningOut} setDiningOut={setDiningOut} />}
        {tab === 5 && <MonthlyTab purchases={purchases} diningOut={diningOut} cookHistory={cookHistory} weekCost={weekCost} savings={savings} />}
        {tab === 6 && <PriceAnalysisTab purchases={purchases} ingredients={ingredients} shoppingList={shoppingList} />}
        {tab === 7 && <CookHistoryTab cookHistory={cookHistory} />}
      </div>
    </div>
  );
}

// ══ 食材庫 ══════════════════════════════════════════════════
function IngredientsTab({ ingredients, setIngredients }) {
  const [form, setForm] = useState({ name: "", unit: "g", category: "veggie", stock: "" });
  const [show, setShow] = useState(false);
  const add = () => {
    if (!form.name.trim()) return;
    setIngredients(p => [...p, { id: uid(), ...form, stock: Number(form.stock) || 0 }]);
    setForm({ name: "", unit: "g", category: "veggie", stock: "" });
    setShow(false);
  };
  const sortedIng = [...ingredients].sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category));
  return (
    <div>
      <SectionHeader title="食材庫" action="＋ 新增食材" onAction={() => setShow(s => !s)} />
      {show && (
        <Card mb>
          <Grid2>
            <Fi label="名稱" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Fs label="基本單位" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} options={UNIT_OPTIONS.map(u => ({ value: u, label: u }))} />
            <Fs label="分類" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={[{ value: "veggie", label: "🥦 蔬菜" }, { value: "protein", label: "🥚 蛋白質" }, { value: "carb", label: "🌾 全穀" }]} />
            <Fi label="目前庫存" type="number" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} />
          </Grid2>
          <Gbtn onClick={add} full>確認新增</Gbtn>
        </Card>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {PLATE_211.map(p => (
          <div key={p.key} style={{ flex: 1, background: p.color + "18", borderRadius: 10, padding: "8px 10px", borderTop: `3px solid ${p.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.tip}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {sortedIng.map(ing => {
          const low = ing.unit === "g" ? ing.stock <= 100 : ing.stock <= 1;
          return (
            <Card key={ing.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <div style={{ width: 6, height: 36, borderRadius: 3, background: CAT_COLOR[ing.category] || C.muted, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ing.name}</div>
                <div style={{ fontSize: 12, color: low ? C.red : C.muted }}>庫存 {ing.stock} {ing.unit}{low ? " ⚠️ 偏低" : ""}</div>
              </div>
              <Chip color={CAT_COLOR[ing.category]}>{CAT_LABEL[ing.category]}</Chip>
              <Xbtn onClick={() => setIngredients(p => p.filter(x => x.id !== ing.id))} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══ 採購（含單位換算）══════════════════════════════════════
function PurchasesTab({ purchases, setPurchases, ingredients, setIngredients }) {
  const [form, setForm] = useState({ ingId: "", qty: "", purchaseUnit: "台斤", price: "", date: today() });
  const [show, setShow] = useState(false);

  const selectedIng = ingredients.find(x => x.id === form.ingId);
  const conv = PURCHASE_UNITS.find(u => u.label === form.purchaseUnit);
  const isWeightConv = conv?.toBase !== null && selectedIng?.unit === "g";
  const previewQty = isWeightConv && form.qty ? (Number(form.qty) * conv.toBase).toFixed(0) : null;

  // sort by category
  const sortedIng = [...ingredients].sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category));

  const add = () => {
    if (!form.ingId || !form.qty || !form.price) return;
    const ing = ingredients.find(x => x.id === form.ingId);
    const baseQty = convertToBase(form.qty, form.purchaseUnit, ing?.unit || "g");
    setPurchases(p => [{ id: uid(), ingId: form.ingId, ingName: ing?.name, ingUnit: ing?.unit, purchaseUnit: form.purchaseUnit, qty: Number(form.qty), baseQty, price: Number(form.price), date: form.date }, ...p]);
    setIngredients(p => p.map(x => x.id === form.ingId ? { ...x, stock: x.stock + baseQty } : x));
    setForm({ ingId: "", qty: "", purchaseUnit: "台斤", price: "", date: today() });
    setShow(false);
  };

  return (
    <div>
      <SectionHeader title="採購紀錄" action="＋ 新增採購" onAction={() => setShow(s => !s)} />
      {show && (
        <Card mb>
          <div style={{ marginBottom: 8 }}>
            <Fs label="食材" value={form.ingId} onChange={v => setForm(f => ({ ...f, ingId: v }))}
              options={[{ value: "", label: "— 選擇食材 —" }, ...sortedIng.map(x => ({ value: x.id, label: `${x.name}` }))]} />
          </div>
          <Grid2>
            <Fi label="購買數量" type="number" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} />
            <Fs label="購買單位" value={form.purchaseUnit} onChange={v => setForm(f => ({ ...f, purchaseUnit: v }))} options={PURCHASE_UNITS.map(u => ({ value: u.label, label: u.label }))} />
            <Fi label="金額 ($)" type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} />
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              {previewQty && (
                <div style={{ background: C.greenLight, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: C.green, fontWeight: 600, width: "100%", boxSizing: "border-box" }}>
                  ≈ {previewQty}{selectedIng?.unit} 存入庫存
                </div>
              )}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <Fi label="日期" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            </div>
          </Grid2>
          <Gbtn onClick={add} full>確認新增（庫存自動增加）</Gbtn>
        </Card>
      )}
      {purchases.length === 0 && <Empty text="尚無採購紀錄" />}
      <div style={{ display: "grid", gap: 8 }}>
        {purchases.map(p => {
          const unitPrice = p.baseQty > 0 ? p.price / p.baseQty : 0;
          return (
            <Card key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.ingName}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.date} · {p.qty}{p.purchaseUnit}{p.purchaseUnit !== p.ingUnit ? ` (${p.baseQty}${p.ingUnit})` : ""}</div>
                <div style={{ fontSize: 11, color: C.blue }}>{fmtDec(unitPrice, p.ingUnit)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 16 }}>{fmt(p.price)}</div>
                <Xbtn onClick={() => setPurchases(p2 => p2.filter(x => x.id !== p.id))} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══ 料理庫 ══════════════════════════════════════════════════
function RecipesTab({ recipes, setRecipes, ingredients, setIngredients, purchases }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", plate211: { veggie: false, protein: false, carb: false }, ingIds: [], ingQty: {} });
  // quick-add ingredient inside recipe form
  const [newIng, setNewIng] = useState({ name: "", unit: "g", category: "veggie" });
  const [showNewIng, setShowNewIng] = useState(false);

  const toggle211 = k => setForm(f => ({ ...f, plate211: { ...f.plate211, [k]: !f.plate211[k] } }));
  const toggleIng = id => setForm(f => {
    const has = f.ingIds.includes(id);
    const ingIds = has ? f.ingIds.filter(x => x !== id) : [...f.ingIds, id];
    const ingQty = { ...f.ingQty }; if (has) delete ingQty[id]; else ingQty[id] = "";
    return { ...f, ingIds, ingQty };
  });

  const addIngredient = () => {
    if (!newIng.name.trim()) return;
    const newItem = { id: uid(), ...newIng, stock: 0 };
    setIngredients(p => [...p, newItem]);
    setForm(f => ({ ...f, ingIds: [...f.ingIds, newItem.id], ingQty: { ...f.ingQty, [newItem.id]: "" } }));
    setNewIng({ name: "", unit: "g", category: "veggie" });
    setShowNewIng(false);
  };

  const add = () => {
    if (!form.name.trim()) return;
    setRecipes(p => [...p, { id: uid(), name: form.name, plate211: form.plate211, ingredients: form.ingIds.map(id => ({ id, qty: Number(form.ingQty[id]) || 1 })) }]);
    setForm({ name: "", plate211: { veggie: false, protein: false, carb: false }, ingIds: [], ingQty: {} });
    setShowNewIng(false);
    setShow(false);
  };

  const sortedIng = [...ingredients].sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category));

  return (
    <div>
      <SectionHeader title="料理庫" action="＋ 新增料理" onAction={() => setShow(s => !s)} />
      <div style={{ background: C.blueLight, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.blue }}>
        💡 料理費用根據採購紀錄平均單價自動計算
      </div>
      {show && (
        <Card mb>
          <Fi label="料理名稱" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <div style={{ marginTop: 10 }}>
            <Lbl>211餐盤符合度</Lbl>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {PLATE_211.map(p => (
                <button key={p.key} onClick={() => toggle211(p.key)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `2px solid ${form.plate211[p.key] ? p.color : C.border}`, background: form.plate211[p.key] ? p.color + "22" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, color: form.plate211[p.key] ? p.color : C.muted }}>{p.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Lbl>選用食材</Lbl>
              <button onClick={() => setShowNewIng(s => !s)} style={{ fontSize: 11, color: C.blue, background: "none", border: `1px solid ${C.blue}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontWeight: 600 }}>＋ 新增食材</button>
            </div>
            {showNewIng && (
              <div style={{ background: C.blueLight, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <Grid2>
                  <Fi label="食材名稱" value={newIng.name} onChange={v => setNewIng(f => ({ ...f, name: v }))} />
                  <Fs label="單位" value={newIng.unit} onChange={v => setNewIng(f => ({ ...f, unit: v }))} options={UNIT_OPTIONS.map(u => ({ value: u, label: u }))} />
                  <div style={{ gridColumn: "1/-1" }}>
                    <Fs label="分類" value={newIng.category} onChange={v => setNewIng(f => ({ ...f, category: v }))} options={[{ value: "veggie", label: "🥦 蔬菜" }, { value: "protein", label: "🥚 蛋白質" }, { value: "carb", label: "🌾 全穀" }]} />
                  </div>
                </Grid2>
                <Gbtn onClick={addIngredient} full>新增並選用此食材</Gbtn>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sortedIng.map(ing => (
                <button key={ing.id} onClick={() => toggleIng(ing.id)} style={{ padding: "4px 10px", borderRadius: 99, border: `1.5px solid ${form.ingIds.includes(ing.id) ? CAT_COLOR[ing.category] : C.border}`, background: form.ingIds.includes(ing.id) ? CAT_COLOR[ing.category] + "22" : "#fff", color: form.ingIds.includes(ing.id) ? CAT_COLOR[ing.category] : C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{ing.name}</button>
              ))}
            </div>
            {form.ingIds.length > 0 && (
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {form.ingIds.map(id => {
                  const ing = ingredients.find(x => x.id === id);
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, flex: 1, fontWeight: 600, color: CAT_COLOR[ing?.category] }}>{ing?.name}</span>
                      <input type="number" placeholder={`用量 (${ing?.unit})`} value={form.ingQty[id] || ""} onChange={e => setForm(f => ({ ...f, ingQty: { ...f.ingQty, [id]: e.target.value } }))}
                        style={{ width: 110, padding: "5px 8px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Gbtn onClick={add} full>確認新增料理</Gbtn>
        </Card>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {recipes.map(r => {
          const { total, hasAll } = calcRecipeCost(r, ingredients, purchases);
          const ingDisplay = r.ingredients.map(ri => { const ing = ingredients.find(x => x.id === ri.id); return ing ? `${ing.name} ${ri.qty}${ing.unit}` : null; }).filter(Boolean);
          return (
            <Card key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{ingDisplay.join("、") || "尚無食材"}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontWeight: 800, color: hasAll ? C.green : C.muted, fontSize: 17 }}>{total !== null ? fmt(total) : "估算中"}</div>
                  {!hasAll && <div style={{ fontSize: 10, color: C.muted }}>需更多採購紀錄</div>}
                  <Xbtn onClick={() => setRecipes(p => p.filter(x => x.id !== r.id))} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══ 週計劃 ══════════════════════════════════════════════════
function WeekPlanTab({ weekPlan, getSlots, setSlots, recipes, setRecipes, ingredients, setIngredients, purchases, weekCost, weekBudget, savings, shoppingList, onExport, markCooked }) {
  const [view, setView] = useState("plan");
  const [confirmInfo, setConfirmInfo] = useState(null); // { key, slotIdx }

  const cookedCount = Object.values(weekPlan).reduce((s, val) => s + (val?.slots?.filter(x => x.cooked).length || 0), 0);
  const totalMeals = Object.values(weekPlan).reduce((s, val) => s + (val?.slots?.filter(x => x.rid).length || 0), 0);
  const confirmRecipe = confirmInfo ? recipes.find(x => x.id === getSlots(confirmInfo.key)[confirmInfo.slotIdx]?.rid) : null;

  // quick add recipe inline
  const [quickAdd, setQuickAdd] = useState(null); // key where adding
  const [qForm, setQForm] = useState({ name: "", plate211: { veggie: false, protein: false, carb: false }, ingIds: [], ingQty: {} });

  const addQuickRecipe = (key) => {
    if (!qForm.name.trim()) return;
    const newR = { id: uid(), name: qForm.name, plate211: qForm.plate211, ingredients: qForm.ingIds.map(id => ({ id, qty: Number(qForm.ingQty[id]) || 1 })) };
    setRecipes(p => [...p, newR]);
    const slots = getSlots(key);
    const updated = slots.map((s, i) => i === slots.length - 1 && !s.rid ? { ...s, rid: newR.id } : s);
    setSlots(key, updated);
    setQForm({ name: "", plate211: { veggie: false, protein: false, carb: false }, ingIds: [], ingQty: {} });
    setQuickAdd(null);
  };

  const sortedIng = [...ingredients].sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category));

  return (
    <div>
      {/* confirm modal */}
      {confirmInfo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 300, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>🍳</div>
            <div style={{ fontWeight: 800, fontSize: 16, textAlign: "center", marginBottom: 6 }}>確認已料理完成？</div>
            <div style={{ fontSize: 14, color: C.green, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>「{confirmRecipe?.name}」</div>
            <div style={{ fontSize: 12, color: C.amber, background: C.amberLight, borderRadius: 8, padding: "8px 12px", textAlign: "center", marginBottom: 20 }}>確認後將自動扣除食材庫存，無法復原</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setConfirmInfo(null)} style={{ padding: "11px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>取消</button>
              <button onClick={() => { markCooked(confirmInfo.key, confirmInfo.slotIdx); setConfirmInfo(null); }} style={{ padding: "11px", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✅ 確認</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["plan", "📅 週計劃"], ["shopping", "🛍️ 購物清單"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: view === v ? C.green : C.card, color: view === v ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: view === v ? "0 2px 8px rgba(61,107,79,0.3)" : "0 1px 3px rgba(0,0,0,0.08)" }}>{label}</button>
        ))}
      </div>

      {view === "plan" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <MiniStat label="早餐" value={fmt(weekCost.bf)} sub={`預算 ${fmt(weekBudget.bf)}`} ok={weekCost.bf <= weekBudget.bf} />
            <MiniStat label="晚餐" value={fmt(weekCost.dn)} sub={`預算 ${fmt(weekBudget.dn)}`} ok={weekCost.dn <= weekBudget.dn} />
            <MiniStat label="結餘" value={fmt(savings)} sub="可儲蓄 💰" ok={savings >= 0} />
          </div>
          {totalMeals > 0 && (
            <div style={{ background: C.blueLight, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, color: C.blue }}>✅ 已料理進度</div>
              <div style={{ fontWeight: 800, color: C.blue }}>{cookedCount} / {totalMeals} 餐</div>
            </div>
          )}
          {DAYS_TW.map(day => {
            // compute daily 211 across all meals
            const allRids = [];
            MEAL_TYPES.forEach(mtype => {
              const key = `${day}-${mtype}`;
              getSlots(key).forEach(s => { if (s.rid) allRids.push(s.rid); });
            });
            const daily211 = mergePlate211(allRids, recipes);
            const daily211Score = Object.values(daily211).filter(Boolean).length;

            return (
              <Card key={day} style={{ marginBottom: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: C.green }}>{day}</div>
                  {allRids.length > 0 && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {PLATE_211.map(p => (
                        <span key={p.key} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: daily211[p.key] ? p.color + "22" : "#eee", color: daily211[p.key] ? p.color : "#bbb", fontWeight: 600 }}>{p.label}</span>
                      ))}
                      <span style={{ fontSize: 10, color: daily211Score === 3 ? C.green : C.amber, fontWeight: 700, marginLeft: 2 }}>{daily211Score}/3</span>
                    </div>
                  )}
                </div>
                {MEAL_TYPES.map(mtype => {
                  const key = `${day}-${mtype}`;
                  const slots = getSlots(key);
                  return (
                    <div key={mtype} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{mtype}</div>
                      {slots.map((slot, si) => {
                        const r = recipes.find(x => x.id === slot.rid);
                        const { total: rcost } = r ? calcRecipeCost(r, ingredients, purchases) : { total: null };
                        const stockOk = r ? r.ingredients.every(ri => { const ing = ingredients.find(x => x.id === ri.id); return ing && ing.stock >= ri.qty; }) : true;
                        return (
                          <div key={si} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                            <select value={slot.rid || ""} onChange={e => {
                              const newSlots = slots.map((s, i) => i === si ? { ...s, rid: e.target.value, cooked: false } : s);
                              setSlots(key, newSlots);
                            }} disabled={slot.cooked}
                              style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${slot.cooked ? C.green : r ? (stockOk ? C.green : C.amber) : C.border}`, background: slot.cooked ? C.greenLight : r ? (stockOk ? C.greenLight : C.amberLight) : "#fff", fontSize: 12, color: slot.cooked ? C.green : C.text, fontWeight: r ? 600 : 400 }}>
                              <option value=""></option>
                              {recipes.map(rx => {
                                const { total: rc } = calcRecipeCost(rx, ingredients, purchases);
                                return <option key={rx.id} value={rx.id}>{rx.name}{rc !== null ? ` ${fmt(rc)}` : ""}</option>;
                              })}
                            </select>
                            {r && !slot.cooked && (
                              <>
                                {!stockOk && <span style={{ fontSize: 10, color: C.amber }}>⚠️庫存不足</span>}
                                <button onClick={() => setConfirmInfo({ key, slotIdx: si })} style={{ padding: "5px 8px", borderRadius: 8, border: `1.5px solid ${C.green}`, background: "#fff", color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✅煮好了</button>
                              </>
                            )}
                            {slot.cooked && <span style={{ fontSize: 11, color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>已完成</span>}
                            {!slot.cooked && slots.length > 1 && (
                              <Xbtn onClick={() => setSlots(key, slots.filter((_, i) => i !== si))} />
                            )}
                          </div>
                        );
                      })}
                      {/* 當天所需食材 */}
                      {(() => {
                        const allIng = {};
                        slots.forEach(slot => {
                          const r = recipes.find(x => x.id === slot.rid);
                          if (!r) return;
                          r.ingredients.forEach(ri => {
                            const ing = ingredients.find(x => x.id === ri.id);
                            if (!ing) return;
                            if (!allIng[ri.id]) allIng[ri.id] = { ...ing, needed: 0 };
                            allIng[ri.id].needed += ri.qty;
                          });
                        });
                        const ingList = Object.values(allIng);
                        if (ingList.length === 0) return null;
                        return (
                          <div style={{ marginTop: 6, padding: "8px 10px", background: C.bg, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {ingList.map(item => {
                              const enough = item.stock >= item.needed;
                              return (
                                <span key={item.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: enough ? C.greenLight : C.amberLight, color: enough ? C.green : C.amber, fontWeight: 600 }}>
                                  {item.name} {item.needed}{item.unit}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {/* add second dish */}
                      {!slots.some(s => !s.rid) && (
                        <button onClick={() => setSlots(key, [...slots, { rid: "", cooked: false }])} style={{ fontSize: 11, color: C.blue, background: "none", border: `1px dashed ${C.blue}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, marginTop: 2 }}>＋ 再加一道料理</button>
                      )}
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </>
      )}

      {view === "shopping" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: C.muted }}>依週計劃 vs 現有庫存自動計算</div>
            <button onClick={onExport} style={{ background: C.amber, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⬇️ 匯出</button>
          </div>
          {shoppingList.length === 0 && <Empty text="請先在週計劃選擇料理" />}
          {shoppingList.length > 0 && shoppingList.every(x => x.toBuy === 0) && (
            <div style={{ background: C.greenLight, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: C.green, fontWeight: 600 }}>✅ 所有食材庫存充足！</div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {shoppingList.filter(item => item.toBuy > 0).sort((a, b) => b.toBuy - a.toBuy).map(item => (
              <Card key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${C.red}` }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>本週需 {item.needed}{item.unit} · 庫存 {item.stock}{item.unit}</div>
                </div>
                <span style={{ background: C.redLight, color: C.red, fontWeight: 700, fontSize: 13, padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap" }}>買 {item.toBuy}{item.unit}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══ 外食紀錄 ════════════════════════════════════════════════
function DiningOutTab({ diningOut, setDiningOut }) {
  const [form, setForm] = useState({ name: "", type: "早餐", price: "", date: today(), note: "", plate211: { veggie: false, protein: false, carb: false } });
  const [show, setShow] = useState(false);
  const toggle211 = k => setForm(f => ({ ...f, plate211: { ...f.plate211, [k]: !f.plate211[k] } }));
  const add = () => {
    if (!form.name.trim() || !form.price) return;
    setDiningOut(p => [{ id: uid(), ...form, price: Number(form.price) }, ...p]);
    setForm({ name: "", type: "早餐", price: "", date: today(), note: "", plate211: { veggie: false, protein: false, carb: false } });
    setShow(false);
  };
  const totalOut = diningOut.reduce((s, d) => s + d.price, 0);
  return (
    <div>
      <SectionHeader title="外食紀錄" action="＋ 新增外食" onAction={() => setShow(s => !s)} />
      {show && (
        <Card mb>
          <Grid2>
            <div style={{ gridColumn: "1/-1" }}><Fi label="店家／餐點名稱" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></div>
            <Fs label="類型" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: "早餐", label: "早餐" }, { value: "晚餐", label: "晚餐" }, { value: "其他", label: "其他" }]} />
            <Fi label="金額 ($)" type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} />
            <div style={{ gridColumn: "1/-1" }}><Fi label="日期" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} /></div>
            <div style={{ gridColumn: "1/-1" }}><Fi label="備註（選填）" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} /></div>
          </Grid2>
          <div style={{ marginTop: 10 }}>
            <Lbl>這餐有吃到哪些？（211檢核）</Lbl>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {PLATE_211.map(p => (
                <button key={p.key} onClick={() => toggle211(p.key)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `2px solid ${form.plate211[p.key] ? p.color : C.border}`, background: form.plate211[p.key] ? p.color + "22" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, color: form.plate211[p.key] ? p.color : C.muted }}>{p.label}</button>
              ))}
            </div>
          </div>
          <Gbtn onClick={add} full>確認新增</Gbtn>
        </Card>
      )}
      {diningOut.length > 0 && (
        <div style={{ background: C.amberLight, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: C.muted }}>外食總花費</div>
          <div style={{ fontWeight: 800, color: C.amber, fontSize: 18 }}>{fmt(totalOut)}</div>
        </div>
      )}
      {diningOut.length === 0 && <Empty text="尚無外食紀錄" />}
      <div style={{ display: "grid", gap: 8 }}>
        {diningOut.map(d => {
          const score = Object.values(d.plate211).filter(Boolean).length;
          return (
            <Card key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <Chip color={d.type === "早餐" ? C.amber : C.green}>{d.type}</Chip>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{d.date}{d.note ? ` · ${d.note}` : ""}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {PLATE_211.map(p => <span key={p.key} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: d.plate211[p.key] ? p.color + "22" : "#eee", color: d.plate211[p.key] ? p.color : "#bbb", fontWeight: 600 }}>{p.label}</span>)}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontWeight: 700, color: C.amber, fontSize: 16 }}>{fmt(d.price)}</div>
                <div style={{ fontSize: 10, color: score >= 2 ? C.green : C.red, fontWeight: 600 }}>211: {score}/3</div>
                <Xbtn onClick={() => setDiningOut(p => p.filter(x => x.id !== d.id))} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══ 月紀錄 ══════════════════════════════════════════════════
function MonthlyTab({ purchases, diningOut, cookHistory, weekCost, savings }) {
  const months = useMemo(() => {
    const set = new Set([today().slice(0, 7)]);
    [...purchases, ...diningOut, ...cookHistory].forEach(x => set.add(monthOf(x.date)));
    return [...set].sort().reverse();
  }, [purchases, diningOut, cookHistory]);
  const [month, setMonth] = useState(months[0]);

  const mp = purchases.filter(x => monthOf(x.date) === month);
  const md = diningOut.filter(x => monthOf(x.date) === month);
  const mc = cookHistory.filter(x => monthOf(x.date) === month);
  const purchaseTotal = mp.reduce((s, x) => s + x.price, 0);
  const diningTotal = md.reduce((s, x) => s + x.price, 0);
  const cookTotal = mc.reduce((s, x) => s + x.cost, 0);
  const totalSpent = purchaseTotal + diningTotal;
  const monthBudget = (BUDGET.breakfast + BUDGET.dinner) * 30;
  const monthSavings = monthBudget - totalSpent;
  const daysInMonth = new Date(month.slice(0, 4), month.slice(5, 7), 0).getDate();
  const avgDaily = totalSpent / daysInMonth;

  const totalMeals = md.length + mc.length;
  const compliant = md.filter(x => Object.values(x.plate211).filter(Boolean).length >= 2).length + mc.filter(x => Object.values(x.plate211).filter(Boolean).length >= 2).length;
  const compRate = totalMeals > 0 ? Math.round((compliant / totalMeals) * 100) : null;

  const cookRatio = totalMeals > 0 ? Math.round((mc.length / totalMeals) * 100) : null;

  return (
    <div>
      <SectionHeader title="月紀錄總覽" />
      <div style={{ marginBottom: 14 }}>
        <Fs label="選擇月份" value={month} onChange={setMonth} options={months.map(m => ({ value: m, label: m }))} />
      </div>

      {/* 主要統計 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "🛒 採購花費", val: fmt(purchaseTotal), sub: `月預算 ${fmt(monthBudget)}`, color: purchaseTotal > monthBudget ? C.red : C.green },
          { label: "🥡 外食花費", val: fmt(diningTotal), sub: `${md.length} 次外食`, color: C.amber },
          { label: "📅 每日平均", val: fmt(avgDaily), sub: `預算 ${fmt(BUDGET.breakfast + BUDGET.dinner)}/天`, color: avgDaily > (BUDGET.breakfast + BUDGET.dinner) ? C.red : C.green },
          { label: "💰 預算結餘", val: fmt(monthSavings), sub: "本月可儲蓄", color: monthSavings >= 0 ? C.green : C.red },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* 自煮 vs 外食比例 */}
      {totalMeals > 0 && (
        <Card mb>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 12 }}>🍳 自煮 vs 外食比例</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span>自煮 {mc.length} 餐 ({cookRatio}%)</span>
            <span>外食 {md.length} 餐 ({100 - cookRatio}%)</span>
          </div>
          <div style={{ height: 12, background: C.amberLight, borderRadius: 99, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${cookRatio}%`, background: C.green, borderRadius: "99px 0 0 99px", transition: "width .4s" }} />
            <div style={{ flex: 1, background: C.amber, borderRadius: "0 99px 99px 0" }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
            <span style={{ color: C.green }}>● 自煮 {fmt(cookTotal)}</span>
            <span style={{ color: C.amber }}>● 外食 {fmt(diningTotal)}</span>
          </div>
        </Card>
      )}

      {/* 211 */}
      <Card mb>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 8 }}>🥗 211達標率</div>
        {compRate !== null ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: compRate >= 70 ? C.green : C.amber, marginBottom: 6 }}>{compRate}%</div>
            <div style={{ height: 8, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${compRate}%`, background: compRate >= 70 ? C.green : C.amber, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>自煮+外食合計 {totalMeals} 餐，達標 {compliant} 餐</div>
          </>
        ) : <div style={{ fontSize: 12, color: C.muted }}>新增料理或外食紀錄後顯示</div>}
      </Card>

      {/* 採購明細 */}
      <Card mb>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: C.green }}>本月採購明細</div>
        {mp.length === 0 && <Empty text="本月無採購紀錄" />}
        {mp.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <span>{p.ingName} {p.qty}{p.purchaseUnit}</span>
            <span style={{ fontWeight: 600, color: C.green }}>{fmt(p.price)}</span>
          </div>
        ))}
      </Card>

      <div style={{ background: C.greenLight, borderRadius: 12, padding: 14, borderLeft: `4px solid ${C.green}` }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 8 }}>💡 健康建議</div>
        {compRate !== null ? compRate >= 70
          ? <div style={{ fontSize: 12 }}>✅ 211達標率 {compRate}%，表現優秀！</div>
          : <div style={{ fontSize: 12 }}>⚠️ 211達標率 {compRate}%，建議每餐多補充蔬菜。</div>
          : <div style={{ fontSize: 12, color: C.muted }}>新增紀錄後，這裡會出現健康分析。</div>}
        <div style={{ marginTop: 6, fontSize: 11, color: C.muted }}>211餐盤：蔬菜½ + 蛋白質¼ + 全穀¼</div>
      </div>
    </div>
  );
}

// ══ 價格分析 ════════════════════════════════════════════════
function PriceAnalysisTab({ purchases, ingredients, shoppingList }) {
  const analysis = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      if (!p.ingId || !p.baseQty || !p.price) return;
      const unitPrice = p.price / p.baseQty;
      if (!map[p.ingId]) map[p.ingId] = { ingId: p.ingId, name: p.ingName, unit: p.ingUnit, records: [] };
      map[p.ingId].records.push({ date: p.date, unitPrice, price: p.price, qty: p.qty, purchaseUnit: p.purchaseUnit });
    });
    return Object.values(map).map(item => {
      const prices = item.records.map(r => r.unitPrice);
      const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
      const min = Math.min(...prices); const max = Math.max(...prices);
      const sorted = [...item.records].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      const trend = sorted.length >= 2 ? latest.unitPrice > sorted[1].unitPrice ? "up" : latest.unitPrice < sorted[1].unitPrice ? "down" : "same" : "same";
      return { ...item, avg, min, max, latest, trend, count: item.records.length };
    }).sort((a, b) => b.count - a.count);
  }, [purchases]);

  // 本週採購預算估算
  const weekShoppingBudget = useMemo(() => {
    let total = 0, hasAll = true;
    shoppingList.filter(x => x.toBuy > 0).forEach(item => {
      const avg = calcAvgUnitPrice(item.id, purchases);
      if (avg === null) { hasAll = false; return; }
      total += avg * item.toBuy;
    });
    return { total, hasAll, count: shoppingList.filter(x => x.toBuy > 0).length };
  }, [shoppingList, purchases]);

  return (
    <div>
      <SectionHeader title="食材價格分析" />

      {/* 本週採購預算 */}
      <Card mb style={{ borderLeft: `4px solid ${C.blue}` }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.blue, marginBottom: 8 }}>🛒 本週採購預算估算</div>
        {weekShoppingBudget.count === 0 ? (
          <div style={{ fontSize: 12, color: C.muted }}>週計劃未設定，或庫存充足不需採購</div>
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.blue }}>{weekShoppingBudget.total > 0 ? fmt(weekShoppingBudget.total) : "—"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>需採購 {weekShoppingBudget.count} 項食材{!weekShoppingBudget.hasAll ? "（部分食材無採購紀錄，未計入）" : ""}</div>
          </>
        )}
      </Card>

      <div style={{ background: C.blueLight, borderRadius: 12, padding: 12, marginBottom: 14, borderLeft: `4px solid ${C.blue}`, fontSize: 12, color: C.blue }}>
        💡 根據採購紀錄分析每種食材單價趨勢，幫你判斷什麼時候買比較划算
      </div>
      {analysis.length === 0 && <Empty text="新增採購紀錄後，這裡會顯示價格分析" />}
      <div style={{ display: "grid", gap: 12 }}>
        {analysis.map(item => {
          const trendIcon = item.trend === "up" ? "📈" : item.trend === "down" ? "📉" : "➡️";
          const trendColor = item.trend === "up" ? C.red : item.trend === "down" ? C.green : C.muted;
          const savings = item.avg > 0 ? ((item.avg - item.min) / item.avg * 100).toFixed(0) : 0;
          return (
            <Card key={item.ingId}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{item.count} 次採購</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: trendColor, fontWeight: 700 }}>{trendIcon} {item.trend === "up" ? "漲" : item.trend === "down" ? "跌" : "持平"}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>最近 ${item.latest.unitPrice.toFixed(2)}/{item.unit}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[{ label: "最低", val: item.min, color: C.green }, { label: "平均", val: item.avg, color: C.blue }, { label: "最高", val: item.max, color: C.red }].map(s => (
                  <div key={s.label} style={{ background: s.color + "12", borderRadius: 8, padding: "8px 6px", textAlign: "center", borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: s.color }}>${s.val.toFixed(1)}/{item.unit}</div>
                  </div>
                ))}
              </div>
              {savings > 10 && <div style={{ background: C.greenLight, borderRadius: 8, padding: "7px 10px", fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 6 }}>💡 選最低價買可省約 {savings}%</div>}
              {item.trend === "down" && <div style={{ background: C.greenLight, borderRadius: 8, padding: "7px 10px", fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 6 }}>✅ 近期價格下跌，現在是採購好時機！</div>}
              {item.trend === "up" && <div style={{ background: C.redLight, borderRadius: 8, padding: "7px 10px", fontSize: 11, color: C.red, fontWeight: 600, marginBottom: 6 }}>⚠️ 近期價格上漲，可提前多買或找替代</div>}
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>採購歷史</div>
              {item.records.slice(0, 4).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.muted }}>{r.date}</span>
                  <span>{r.qty}{r.purchaseUnit}</span>
                  <span style={{ fontWeight: 600, color: r.unitPrice <= item.avg ? C.green : C.red }}>${r.unitPrice.toFixed(2)}/{item.unit}</span>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══ 料理歷史 ════════════════════════════════════════════════
function CookHistoryTab({ cookHistory }) {
  const [filter, setFilter] = useState("全部");
  const filtered = filter === "全部" ? cookHistory : cookHistory.filter(x => x.mtype === filter);
  const total = cookHistory.length;
  const totalCost = cookHistory.reduce((s, x) => s + x.cost, 0);
  const compliant = cookHistory.filter(x => Object.values(x.plate211).filter(Boolean).length >= 2).length;
  const compRate = total > 0 ? Math.round((compliant / total) * 100) : null;
  const countMap = {};
  cookHistory.forEach(x => { countMap[x.recipeName] = (countMap[x.recipeName] || 0) + 1; });
  const topRecipes = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div>
      <SectionHeader title="料理歷史紀錄" />
      {cookHistory.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
          <div style={{ color: C.muted, fontSize: 13 }}>尚無料理紀錄</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>在週計劃按「✅ 煮好了」就會記錄在這裡</div>
        </div>
      )}
      {cookHistory.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <Card><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>總料理次數</div><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{total}</div><div style={{ fontSize: 10, color: C.muted }}>餐</div></Card>
            <Card><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>累積花費</div><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{fmt(totalCost)}</div><div style={{ fontSize: 10, color: C.muted }}>自煮合計</div></Card>
            <Card><div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>211達標率</div><div style={{ fontSize: 22, fontWeight: 800, color: compRate >= 70 ? C.green : C.amber }}>{compRate ?? "—"}%</div><div style={{ fontSize: 10, color: C.muted }}>自煮紀錄</div></Card>
          </div>
          {topRecipes.length > 0 && (
            <Card mb>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 10 }}>🏆 最常煮的料理</div>
              {topRecipes.map(([name, count], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 99, background: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{name}</div>
                  <div style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>{count} 次</div>
                </div>
              ))}
            </Card>
          )}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["全部", "早餐", "晚餐"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 99, border: "none", background: filter === f ? C.green : C.card, color: filter === f ? "#fff" : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>{f}</button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted, alignSelf: "center" }}>{filtered.length} 筆</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map(h => {
              const score = Object.values(h.plate211).filter(Boolean).length;
              return (
                <Card key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{h.recipeName}</span>
                      <Chip color={h.mtype === "早餐" ? C.amber : C.green}>{h.mtype}</Chip>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{h.date} {h.day}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {PLATE_211.map(p => <span key={p.key} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: h.plate211[p.key] ? p.color + "22" : "#eee", color: h.plate211[p.key] ? p.color : "#bbb", fontWeight: 600 }}>{p.label}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: C.green, fontSize: 16 }}>{h.cost > 0 ? fmt(h.cost) : "—"}</div>
                    <div style={{ fontSize: 10, color: score >= 2 ? C.green : C.red, fontWeight: 600, marginTop: 4 }}>211: {score}/3 {score >= 2 ? "✅" : "⚠️"}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ══ 共用元件 ════════════════════════════════════════════════
function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      {action && <Gbtn onClick={onAction}>{action}</Gbtn>}
    </div>
  );
}
function Card({ children, style, mb }) {
  return <div style={{ background: C.card, borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: mb ? 12 : 0, ...style }}>{children}</div>;
}
function Gbtn({ children, onClick, full }) {
  return <button onClick={onClick} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", width: full ? "100%" : "auto", marginTop: full ? 10 : 0, display: "block" }}>{children}</button>;
}
function Xbtn({ onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px" }}>×</button>;
}
function Chip({ children, color }) {
  return <span style={{ fontSize: 10, background: color + "22", color, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{children}</span>;
}
function Lbl({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3 }}>{children}</div>;
}
function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{children}</div>;
}
function Fi({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}
function Fs({ label, value, onChange, options }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function MiniStat({ label, value, sub, ok }) {
  return (
    <div style={{ background: ok ? C.greenLight : C.redLight, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: ok ? C.green : C.red }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ textAlign: "center", color: C.muted, padding: "28px 0", fontSize: 13 }}>{text}</div>;
}
