import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { Product } from '../modules/product/product.model';
import { Category } from '../modules/category/category.model';
import { Brand } from '../modules/brand/brand.model';
import { UserRole } from '../modules/user/user.interface';
import { config } from '../config';
import dotenv from 'dotenv';
import { CategoryGender } from '../modules/category/category.model';
import { ProductGender } from '../modules/product/product.interface';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to DB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Brand.deleteMany({});

        console.log('Database cleared.');

        // 1. Create Admins
        const admin = await User.create({
            name: 'Serra Admin',
            email: 'admin@serra.com',
            password: 'Password@123',
            role: UserRole.ADMIN,
        });

        const customer = await User.create({
            name: 'John Doe',
            email: 'john@gmail.com',
            password: 'Password@123',
            role: UserRole.CUSTOMER,
        });

        // 2. Create Categories
        const categories = await Category.insertMany([
            { name: 'T-Shirts', slug: 't-shirts', gender: CategoryGender.MEN, isActive: true },
            { name: 'Dresses', slug: 'dresses', gender: CategoryGender.WOMEN, isActive: true },
            { name: 'Hoodies', slug: 'hoodies', gender: CategoryGender.UNISEX, isActive: true },
            { name: 'Jewelry', slug: 'jewelry', gender: CategoryGender.WOMEN, isActive: true },
        ]);

        // 3. Create Brands
        const brands = await Brand.insertMany([
            { name: 'ZARA', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg', isActive: true },
            { name: 'H&M', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg', isActive: true },
            { name: 'NIKE', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', isActive: true },
        ]);

        // 4. Create Products
        const products = [
            {
                title: 'Oversized Cotton T-Shirt',
                description: 'Premium heavyweight cotton t-shirt with a relaxed fit.',
                basePrice: 45,
                discountPercentage: 10,
                category: categories[0]._id,
                brand: brands[0]._id,
                gender: ProductGender.MEN,
                images: [{ imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780', imagePublicId: '' }],
                stock: 100,
                isPublished: true,
            },
            {
                title: 'Silk Midi Dress',
                description: 'Elegant silk dress for evening occasions.',
                basePrice: 120,
                discountPercentage: 0,
                category: categories[1]._id,
                brand: brands[1]._id,
                gender: ProductGender.WOMEN,
                images: [{ imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1983', imagePublicId: '' }],
                stock: 50,
                isPublished: true,
            },
            {
                title: 'Tech Fleece Hoodie',
                description: 'Warm and stylish fleece hoodie for all seasons.',
                basePrice: 85,
                discountPercentage: 15,
                category: categories[2]._id,
                brand: brands[2]._id,
                gender: ProductGender.UNISEX,
                images: [{ imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1887', imagePublicId: '' }],
                stock: 80,
                isPublished: true,
            },
        ];

        await Product.create(products);

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
