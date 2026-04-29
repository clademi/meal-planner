"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Plus, Search, Utensils, Calendar, ShoppingCart, 
  Settings, ChevronRight, ChevronLeft, Trash2, Save 
} from "lucide-react";

// --- 1. 初始化 Supabase 連線 ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const C = {
  bg: "#F7F4EE", card: "#FFFFFF", green: "#3D6B4F", greenLight: "#EAF3EC",
  amber: "#D48B2E", amberLight: "#FDF3E3", red: "#C0392B", redLight: "#FDEAEA",
  blue: "#2E6EA6", blueLight: "#E8F1FA",
  text: "#2C2C2C", muted: "#888", border: "#E5E0D8",
};

export default function MealPlanner() {
  // --- 2. 狀態管理 ---
  const [activeTab, setActiveTab] = useState("ingredients");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 3. 從資料庫讀取資料 ---
  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setIngredients(data);
    }
    setLoading(false);
  }

  // --- 4. 功能邏輯 (串接資料庫) ---
  const handleAddIngredient = async () => {
    const name = prompt("請輸入食材名稱：");
    if (!name) return;

    const newIng = {
      id: crypto.randomUUID(),
      name,
      unit: "g",
      category: "veggie",
      stock: 0
    };

    const { error } = await supabase.from('ingredients').insert([newIng]);
    if (error) {
      alert("儲存失敗：" + error.message);
    } else {
      fetchIngredients(); // 成功後重新抓取
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("確定要刪除嗎？")) return;
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (!error) fetchIngredients();
  };

  // --- 5. 介面渲染 (保留你原本的設計) ---
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, paddingBottom: 80, fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: "800", color: C.green, margin: 0 }}>健康廚房計畫</h1>
        <div style={{ background: C.card, padding: "8px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          {loading ? "連線中..." : "雲端已同步"}
        </div>
      </div>

      <main style={{ padding: "0 16px" }}>
        {activeTab === "ingredients" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button 
                onClick={handleAddIngredient}
                style={{ flex: 1, backgroundColor: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Plus size={20} /> 新增食材
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {ingredients.map(ing => (
                <div key={ing.id} style={{ backgroundColor: C.card, padding: 16, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: 16 }}>{ing.name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>庫存：{ing.stock} {ing.unit}</div>
                  </div>
                  <button onClick={() => handleDelete(ing.id)} style={{ color: C.red, background: "none", border: "none" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {ingredients.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: 40, color: C.muted }}>目前沒有資料</div>
              )}
            </div>
          </div>
        )}
        
        {/* 這裡可以繼續放入你原本的 211 餐盤與週計畫介面代碼 */}
      </main>

      {/* 底部導覽列 */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 70, backgroundColor: C.card, borderTop: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: 10 }}>
        <NavBtn active={activeTab === "ingredients"} onClick={() => setActiveTab("ingredients")} icon={<Database size={22} />} label="庫存" />
        <NavBtn active={activeTab === "recipes"} onClick={() => setActiveTab("recipes")} icon={<Utensils size={22} />} label="食譜" />
        <NavBtn active={activeTab === "plan"} onClick={() => setActiveTab("plan")} icon={<Calendar size={22} />} label="計畫" />
      </nav>
    </div>
  );
}

function NavBtn({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: active ? C.green : C.muted, cursor: "pointer" }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? "700" : "500" }}>{label}</span>
    </button>
  );
}
