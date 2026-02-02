"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Coffee } from '@/types/coffee';

interface FlavorRadarProps {
    coffee: Coffee;
}

export default function FlavorRadar({ coffee }: FlavorRadarProps) {
    // 數據預處理：確保有值，若無則預設為 3 (中間值)
    const data = [
        { subject: '酸度', A: Number(coffee.acid) || 3, fullMark: 5 },
        { subject: '香氣', A: Number(coffee.aroma) || 3, fullMark: 5 },
        { subject: '苦味', A: Number(coffee.bitter) || 3, fullMark: 5 },
        { subject: '醇度', A: Number(coffee.body) || 3, fullMark: 5 },
    ];

    return (
        <div className="w-full h-[180px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Radar
                        name="Flavor"
                        dataKey="A"
                        stroke="#333333"
                        fill="#333333"
                        fillOpacity={0.1}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
