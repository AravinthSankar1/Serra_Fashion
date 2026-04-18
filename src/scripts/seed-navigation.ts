import mongoose from 'mongoose';
import { Navigation } from '../modules/navigation/navigation.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedNavigation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const initialItems = [
            { label: 'Collection', type: 'CUSTOM', path: '/collection', order: 1 },
            { label: 'Men', type: 'GENDER', gender: 'MEN', order: 2 },
            { label: 'Women', type: 'GENDER', gender: 'WOMEN', order: 3 },
            { label: 'Sale', type: 'CUSTOM', path: '/sale', order: 4 },
        ];

        // Clear existing
        await Navigation.deleteMany({});

        // Insert new
        await Navigation.insertMany(initialItems);

        console.log('Navigation items seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding navigation items:', error);
        process.exit(1);
    }
};

seedNavigation();
