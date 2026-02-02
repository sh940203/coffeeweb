import { Coffee } from "@/types/coffee";
import CoffeeCard from "./CoffeeCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";

interface ProductGridProps {
    coffees: Coffee[];
}

export default function ProductGrid({ coffees }: ProductGridProps) {
    if (coffees.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-gray-400">
                <p className="tracking-widest">目前沒有上架的咖啡豆</p>
                <p className="text-sm mt-2 font-light">請稍後再回來查看</p>
            </div>
        );
    }

    return (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {coffees.map((coffee) => (
                <StaggerItem key={coffee.id}>
                    <CoffeeCard coffee={coffee} />
                </StaggerItem>
            ))}
        </StaggerContainer>
    );
}
