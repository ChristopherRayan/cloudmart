export default function Footer() {
    return (
        <footer className="border-t border-dark-800 mt-auto">
            <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <span className="text-sm font-semibold gradient-text">Cloudimart</span>
                    </div>
                    <p className="text-dark-400 text-sm">
                        &copy; {new Date().getFullYear()} Cloudimart — Mzuzu University Campus Delivery
                    </p>
                    <div className="flex items-center space-x-4 text-dark-400 text-sm">
                        <span>📍 Mzuzu, Malawi</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
