export function ProductCardSkeleton() {
    return (
        <div className="group relative animate-pulse">
            {/* Image Skeleton */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl sm:rounded-[32px] bg-gray-200" />

            {/* Content Skeleton */}
            <div className="mt-4 sm:mt-5 px-1 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-16 bg-gray-200 rounded" />
                        <div className="h-4 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function ProductDetailsSkeleton() {
    return (
        <div className="animate-pulse max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24">
                {/* Left: Image Skeleton */}
                <div className="space-y-4">
                    <div className="aspect-[3/4] rounded-[40px] bg-gray-200" />
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-gray-200" />
                        ))}
                    </div>
                </div>

                {/* Right: Content Skeleton */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                        <div className="h-12 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>

                    <div className="h-8 w-32 bg-gray-200 rounded" />

                    <div className="h-20 w-full bg-gray-200 rounded" />

                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 w-16 bg-gray-200 rounded-2xl" />
                            ))}
                        </div>
                    </div>

                    <div className="h-14 w-full bg-gray-200 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function CollectionHeaderSkeleton() {
    return (
        <div className="pt-20 pb-10 border-b border-gray-50 bg-gradient-to-b from-gray-50/50 to-white animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
                <div className="h-14 w-96 mx-auto bg-gray-200 rounded" />
                <div className="h-3 w-40 mx-auto bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export function OrderCardSkeleton() {
    return (
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden animate-pulse">
            <div className="p-8 md:p-10 space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-gray-50">
                    <div className="flex items-center space-x-6">
                        <div className="h-14 w-14 bg-gray-200 rounded-2xl" />
                        <div className="space-y-2">
                            <div className="h-2 w-20 bg-gray-200 rounded" />
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-6 w-24 bg-gray-200 rounded-full" />
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-20 w-16 bg-gray-200 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full bg-gray-200 rounded" />
                                    <div className="h-3 w-24 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-48 bg-gray-200 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}

export function CheckoutFormSkeleton() {
    return (
        <div className="animate-pulse space-y-8">
            <div className="space-y-6">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded-2xl" />
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
                    ))}
                </div>
            </div>

            <div className="h-14 w-full bg-gray-200 rounded-2xl" />
        </div>
    );
}
