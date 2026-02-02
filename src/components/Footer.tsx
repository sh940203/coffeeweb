export default function Footer() {
    return (
        <footer className="w-full py-12 mt-16 text-center text-sm text-gray-400 border-t border-gray-100">
            <p className="tracking-widest">Copyright © {new Date().getFullYear()} 家庭手作烘焙咖啡</p>
            <p className="mt-3 text-xs tracking-[0.15em] opacity-80">用心烘焙每一顆咖啡豆</p>
        </footer>
    );
}
