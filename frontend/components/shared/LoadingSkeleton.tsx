export default function LoadingSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card">
                    <div className="skeleton h-48 w-full mb-4 rounded-xl" />
                    <div className="skeleton h-3 w-20 mb-2" />
                    <div className="skeleton h-5 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-full mb-4" />
                    <div className="flex justify-between items-center">
                        <div className="skeleton h-6 w-24" />
                        <div className="skeleton h-10 w-16 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
