import mongoose, { Schema } from 'mongoose';
import { IProduct, ProductGender } from './product.interface';
import slugify from 'slugify';

const variantSchema = new Schema({
    size: String,
    color: String,
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
});

const productSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        name: { type: String, trim: true }, // Sync with title
        slug: { type: String, unique: true, index: true },
        description: { type: String, required: true },
        brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        gender: { type: String, enum: Object.values(ProductGender), default: ProductGender.UNISEX },
        images: [{
            imageUrl: String,
            imagePublicId: String
        }],
        basePrice: { type: Number, required: true },
        costPrice: { type: Number, select: false }, // Internal cost for profit calculation
        currency: { type: String, default: 'INR' },
        discountPercentage: { type: Number, default: 0 },
        finalPrice: { type: Number },
        isPublished: { type: Boolean, default: false, index: true },
        stock: { type: Number, default: 0 },
        variants: [variantSchema],
        sizeGuide: { type: Schema.Types.ObjectId, ref: 'SizeGuide' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtuals for alias
productSchema.virtual('brandId').get(function (this: any) { return this.brand; });
productSchema.virtual('categoryId').get(function (this: any) { return this.category; });
productSchema.virtual('price').get(function (this: any) { return this.basePrice; });
productSchema.virtual('discount').get(function (this: any) { return this.discountPercentage; });

// Pre-save hooks
productSchema.pre('save', function (this: any, next) {
    // Sync name with title
    this.name = this.title;

    // Generate slug from title if not present or title changed
    if (this.isModified('title') || !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }

    // Calculate final price
    if (this.discountPercentage > 0) {
        this.finalPrice = Math.round(this.basePrice - (this.basePrice * this.discountPercentage) / 100);
    } else {
        this.finalPrice = this.basePrice;
    }
    next();
});

productSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;
    if (update.basePrice !== undefined || update.discountPercentage !== undefined) {
        const basePrice = update.basePrice !== undefined ? update.basePrice : (this as any)._conditions.basePrice;
        // Note: this is tricky because findOneAndUpdate doesn't have the full doc.
        // But for simplicity, if either is updated, we should ideally have both or fetch the doc.
        // However, in our service we usually pass the whole object.
    }
    next();
});

productSchema.index({ title: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
