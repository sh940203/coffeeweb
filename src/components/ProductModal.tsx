"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Save, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface Coffee {
    id?: string;
    name: string;
    origin: string;
    process: string;
    roast_level: string;
    flavor: string;
    features: string;
    price_display: string; // Store as string "NT$ 450" for display consistency, or change to number in DB? 
    // DB schema says 'price_display' TEXT. But order system parses number.
    // Let's keep it robust. Input as number, format on save?
    // Actually, AdminProductTable uses `price_half_lb: number`. 
    // Let's correct the Interface to match DB Schema: `price_display` (TEXT).
    stock: number;
    image_url: string;
    is_available: boolean;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    coffee: Coffee | null; // null = new
    onSave: () => void;
}

export default function ProductModal({ isOpen, onClose, coffee, onSave }: ProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<Coffee>({
        name: "",
        origin: "",
        process: "水洗 Washed",
        roast_level: "中烘焙 Medium Roast",
        flavor: "",
        features: "",
        price_display: "NT$ 450",
        stock: 10,
        image_url: "",
        is_available: true
    });

    // Reset or populate form when opening
    useEffect(() => {
        if (isOpen) {
            if (coffee) {
                setFormData(coffee);
            } else {
                setFormData({
                    name: "",
                    origin: "",
                    process: "水洗 Washed",
                    roast_level: "中烘焙 Medium Roast",
                    flavor: "",
                    features: "",
                    price_display: "NT$ ",
                    stock: 10,
                    image_url: "",
                    is_available: true
                });
            }
        }
    }, [isOpen, coffee]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate
            if (!formData.name) throw new Error("請輸入商品名稱");

            const payload = {
                name: formData.name,
                origin: formData.origin,
                process: formData.process,
                roast_level: formData.roast_level,
                flavor: formData.flavor,
                features: formData.features,
                price_display: formData.price_display, // Ensure format?
                stock: Number(formData.stock),
                image_url: formData.image_url,
                is_available: formData.is_available
            };

            if (coffee?.id) {
                // Update
                const { error } = await supabase
                    .from("coffees")
                    .update(payload)
                    .eq("id", coffee.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("coffees")
                    .insert([payload]);
                if (error) throw error;
            }

            onSave();
        } catch (error: any) {
            alert("儲存失敗: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {coffee ? "編輯商品" : "新增商品"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">商品名稱</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="例如：衣索比亞 耶加雪菲"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        {/* Origin */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">產地 (英文/中文)</label>
                            <input
                                type="text"
                                name="origin"
                                value={formData.origin}
                                onChange={handleChange}
                                placeholder="Ethiopia Yirgacheffe"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">價格顯示 (含幣別)</label>
                            <input
                                type="text"
                                name="price_display"
                                value={formData.price_display}
                                onChange={handleChange}
                                placeholder="NT$ 450"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">系統會自動抓取數字進行計算</p>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">庫存數量 (包)</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none mb-2"
                            />

                            {/* Stock Helper */}
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                                <span className="block text-xs font-semibold text-gray-500 mb-2">📦 進貨小幫手 (自動換算半磅包數)</span>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        placeholder="重量"
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                        id="stock-helper-value"
                                    />
                                    <select
                                        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                                        id="stock-helper-unit"
                                    >
                                        <option value="kg">公斤 (Kg)</option>
                                        <option value="lb">磅 (Lb)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const valInput = document.getElementById('stock-helper-value') as HTMLInputElement;
                                            const unitInput = document.getElementById('stock-helper-unit') as HTMLSelectElement;
                                            const val = parseFloat(valInput.value);
                                            if (!val || val <= 0) return;

                                            // Conversion: 1 Bag = 0.5 Lb
                                            let bags = 0;
                                            if (unitInput.value === 'kg') {
                                                // 1 Kg = 2.20462 Lb. Total Lb / 0.5 = Bags.
                                                // => Kg * 2.20462 * 2
                                                bags = Math.floor(val * 2.20462 * 2);
                                            } else {
                                                // Lb / 0.5 = Bags. => Lb * 2
                                                bags = Math.floor(val * 2);
                                            }

                                            setFormData(prev => ({ ...prev, stock: Number(prev.stock) + bags }));
                                            valInput.value = ''; // Reset
                                        }}
                                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs transition-colors whitespace-nowrap"
                                    >
                                        + 加入庫存
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    * 1 公斤 ≈ 4.4 包 (半磅) | 1 磅 = 2 包 (半磅)
                                </p>
                            </div>
                        </div>

                        {/* Roast Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">烘焙度</label>
                            <select
                                name="roast_level"
                                value={formData.roast_level}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
                            >
                                <option value="淺烘焙 Light Roast">淺烘焙 Light Roast</option>
                                <option value="淺中烘焙 Light-Medium Roast">淺中烘焙 Light-Medium Roast</option>
                                <option value="中烘焙 Medium Roast">中烘焙 Medium Roast</option>
                                <option value="中深烘焙 Medium-Dark Roast">中深烘焙 Medium-Dark Roast</option>
                                <option value="深烘焙 Dark Roast">深烘焙 Dark Roast</option>
                            </select>
                        </div>

                        {/* Process */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">處理法</label>
                            <input
                                type="text"
                                name="process"
                                value={formData.process}
                                onChange={handleChange}
                                placeholder="水洗 Washed"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">特色標籤</label>
                            <input
                                type="text"
                                name="features"
                                value={formData.features}
                                onChange={handleChange}
                                placeholder="G1 等級 / 冠軍豆"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Flavor */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">風味描述</label>
                            <textarea
                                name="flavor"
                                value={formData.flavor}
                                onChange={handleChange}
                                rows={3}
                                placeholder="檸檬、柑橘、茉莉花香，口感清爽明亮。"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片</label>

                            <div className="space-y-4">
                                {/* File Upload Area */}
                                <div className="flex items-center gap-4">
                                    <label className="relative cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors w-full h-24 bg-gray-50/50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                setIsUploading(true);
                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${Date.now()}.${fileExt}`;
                                                    const { error: uploadError } = await supabase.storage
                                                        .from('product-images')
                                                        .upload(fileName, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('product-images')
                                                        .getPublicUrl(fileName);

                                                    setFormData(prev => ({ ...prev, image_url: publicUrl }));
                                                } catch (error: any) {
                                                    alert('上傳失敗: ' + error.message);
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }}
                                        />
                                        {isUploading ? (
                                            <div className="flex flex-col items-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mb-1" />
                                                <span className="text-xs">上傳中...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-500">
                                                <Upload className="w-6 h-6 mb-1" />
                                                <span className="text-xs font-medium">點擊選擇圖片或拖曳至此</span>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* URL Input (Fallback) */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500">或是輸入圖片連結</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-600"
                                    />
                                </div>

                                {/* Preview */}
                                {formData.image_url && (
                                    <div className="mt-2 w-full h-48 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200 group">
                                        <Image
                                            src={formData.image_url}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="移除圖片"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>處理中...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>儲存商品</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
