"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Package, Upload } from "lucide-react";
import Image from "next/image";
import ProductModal from "./ProductModal";
import * as XLSX from 'xlsx';

interface Coffee {
    id: string;
    name: string;
    price_display: string;
    stock: number;
    is_available: boolean;
    image_url: string;
    origin?: string;
    roast_level?: string;
    processing_method?: string; // DB column is 'process' based on setup_full.sql
    process?: string; // Add this
    flavor?: string;
    features?: string;
}

export default function AdminProductTable() {
    const [coffees, setCoffees] = useState<Coffee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);

    useEffect(() => {
        fetchCoffees();
    }, []);

    const fetchCoffees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("coffees")
            .select("*")
            .order("sort_order", { ascending: true }) // Changed sort to sort_order
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching coffees:", error);
        } else {
            setCoffees(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除這個商品嗎？此動作無法復原。")) return;

        const { error } = await supabase.from("coffees").delete().eq("id", id);
        if (error) {
            alert("刪除失敗: " + error.message);
        } else {
            setCoffees(coffees.filter(c => c.id !== id));
        }
    };

    const toggleAvailability = async (coffee: Coffee) => {
        const newValue = !coffee.is_available;
        // Optimistic update
        setCoffees(coffees.map(c => c.id === coffee.id ? { ...c, is_available: newValue } : c));

        const { error } = await supabase
            .from("coffees")
            .update({ is_available: newValue })
            .eq("id", coffee.id);

        if (error) {
            alert("更新狀態失敗");
            fetchCoffees(); // Revert on error
        }
    };

    const handleEdit = (coffee: Coffee) => {
        setEditingCoffee(coffee);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCoffee(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        fetchCoffees(); // Refresh list
    };

    const handleExportExcel = () => {
        const exportData = coffees.map(c => ({
            id: c.id,
            name: c.name,
            stock: c.stock,
            price_display: c.price_display,
            origin: c.origin,
            roast_level: c.roast_level,
            process: c.process,
            flavor: c.flavor,
            features: c.features,
            is_available: c.is_available ? 'TRUE' : 'FALSE',
            image_url: c.image_url
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        XLSX.writeFile(wb, `coffee_products_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("確定要匯入 Excel 嗎？\n有 ID 的資料將會被更新 (Update)，沒有 ID 的資料將會新增 (Create)。")) {
            e.target.value = "";
            return;
        }

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            let successCount = 0;
            let errorCount = 0;

            for (const row of jsonData as any[]) {
                // Determine if Insert or Update
                const payload = {
                    name: row.name,
                    stock: Number(row.stock || 0),
                    price_display: row.price_display?.toString() || '',
                    origin: row.origin || '',
                    roast_level: row.roast_level || '',
                    process: row.process || '', // DB column is 'process'
                    flavor: row.flavor || '',
                    features: row.features || '',
                    is_available: row.is_available === 'TRUE' || row.is_available === true,
                    image_url: row.image_url || ''
                };

                // ID check
                if (row.id) {
                    // Update
                    const { error } = await supabase.from('coffees').update(payload).eq('id', row.id);
                    if (error) { console.error('Update failed', row, error); errorCount++; }
                    else successCount++;
                } else {
                    // Insert (Remove ID from payload explicitly if needed, but we built clean payload)
                    const { error } = await supabase.from('coffees').insert([payload]);
                    if (error) { console.error('Insert failed', row, error); errorCount++; }
                    else successCount++;
                }
            }

            alert(`匯入完成！\n成功: ${successCount} 筆\n失敗: ${errorCount} 筆`);
            fetchCoffees();

        } catch (error: any) {
            alert("匯入失敗: " + error.message);
        } finally {
            setLoading(false);
            e.target.value = ""; // Reset input
        }
    };

    if (loading) return <div className="flex justify-center p-10 text-gray-400"><Loader2 className="animate-spin w-6 h-6" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-medium text-gray-900 tracking-wider">商品列表 ({coffees.length})</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-sm hover:bg-gray-50 transition-colors shadow-sm"
                        title="下載現有商品 Excel，可以用來修改庫存後再匯入"
                    >
                        <Package className="w-4 h-4" />
                        匯出/下載範本
                    </button>
                    <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <Upload className="w-4 h-4" />
                        批量上架/更新
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleImportExcel}
                        />
                    </label>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-sm hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        新增商品
                    </button>
                </div>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                coffee={editingCoffee}
                onSave={handleSave}
            />

            <div className="grid gap-4">
                {coffees.map((coffee) => (
                    <div key={coffee.id} className="bg-white p-4 rounded-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-gray-50 transition-colors">
                        {/* Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 relative">
                            {coffee.image_url ? (
                                <Image
                                    src={coffee.image_url}
                                    alt={coffee.name}
                                    fill
                                    className={`object-cover ${!coffee.is_available ? 'grayscale opacity-50' : ''}`}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Package className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-gray-900 truncate ${!coffee.is_available ? 'text-gray-400 line-through' : ''}`}>
                                    {coffee.name}
                                </h4>
                                {!coffee.is_available && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">已下架</span>}
                            </div>
                            <div className="text-xs text-gray-500 space-x-2">
                                <span>{coffee.roast_level}</span>
                                <span>|</span>
                                <span>庫存: {coffee.stock}</span>
                                <span>|</span>
                                <span className="font-medium text-gray-700">{coffee.price_display} <span className="text-[10px] text-gray-400 font-normal">/ 半磅</span></span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-2 md:mt-0">
                            <button
                                onClick={() => toggleAvailability(coffee)}
                                className={`p-2 rounded-full transition-colors ${coffee.is_available
                                    ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                    }`}
                                title={coffee.is_available ? "下架" : "上架"}
                            >
                                {coffee.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleEdit(coffee)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="編輯"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(coffee.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="刪除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
