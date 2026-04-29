"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Database, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

// --- 初始化連線 ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

export default function MealPlanner() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState("checking");

  // 1. 診斷與讀取
  useEffect(() => {
    async function init() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setDbStatus("missing_env");
        setLoading(false);
        return;
      }
      fetchData();
    }
    init();
  }, []);

  async function fetchData() {
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setIngredients(data || []);
      setDbStatus("success");
    } catch (err) {
      console.error(err);
      setDbStatus("error");
    } finally {
      setLoading(false);
    }
  }

  // 2. 新增食材
  const addIng = async () => {
    const name = prompt("輸入食材名稱:");
    if (!name) return;
    const { error } = await supabase.from('ingredients').insert([{ 
      id: crypto.randomUUID(), 
      name, 
      stock: 0, 
      unit: 'g', 
      category: 'veggie' 
    }]);
    if (!error) fetchData();
    else alert("儲存失敗，請檢查資料表權限(RLS)");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EE', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* 診斷面板：讓你一眼看出哪裡壞了 */}
      <div style={{ maxWidth: '500px', margin: '0 auto 20px', padding: '15px', borderRadius: '12px', backgroundColor: dbStatus === 'success' ? '#EAF3EC' : '#FDEAEA', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {dbStatus === 'success' ? <CheckCircle2 color="#3D6B4F" /> : <AlertCircle color="#C0392B" />}
        <span style={{ fontWeight: 'bold' }}>
          {dbStatus === "checking" && "檢查連線中..."}
          {dbStatus === "success" && "資料庫連線成功！"}
          {dbStatus === "missing_env" && "錯誤：Vercel 沒讀到環境變數 (請檢查 Key 名稱)"}
          {dbStatus === "error" && "錯誤：連線失敗 (可能是 API Key 填錯或網址不對)"}
        </span>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#3D6B4F', textAlign: 'center' }}>我的雲端廚房</h1>
        
        <button onClick={addIng} style={{ width: '100%', padding: '12px', backgroundColor: '#3D6B4F', color: '#fff', border: 'none', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer' }}>
          ＋ 新增測試食材
        </button>

        {loading ? <p style={{ textAlign: 'center' }}>載入中...</p> : (
          <div>
            {ingredients.map(ing => (
              <div key={ing.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>{ing.name}</span>
                <span style={{ color: '#888' }}>{ing.stock} {ing.unit}</span>
              </div>
            ))}
            {ingredients.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>資料庫目前沒有資料</p>}
          </div>
        )}
      </div>
    </div>
  );
}
