export const applyDiscountsToProduct = (product: any, categoryDiscounts: any[]) => {
    if (!product) return product;
    const plainProd = product.toObject ? product.toObject() : product;
    const catDiscount = categoryDiscounts.find((d: any) => d.categoryId === String(plainProd.category?._id || plainProd.category));
    
    if (catDiscount && catDiscount.discountPercentage > (plainProd.discountPercentage || 0)) {
        const effectiveDiscount = catDiscount.discountPercentage;
        const newFinalPrice = Math.round(plainProd.basePrice - (plainProd.basePrice * effectiveDiscount) / 100);
        return { 
            ...plainProd, 
            discountPercentage: effectiveDiscount, 
            finalPrice: newFinalPrice,
            isGlobalCategoryDiscount: true 
        };
    }
    return plainProd;
};

export const applyDiscountsToProducts = (products: any[], categoryDiscounts: any[]) => {
    return products.map(p => applyDiscountsToProduct(p, categoryDiscounts));
};
