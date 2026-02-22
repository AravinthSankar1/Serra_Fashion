import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ShoppingBag, Eye, EyeOff, Paperclip, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import PremiumLoader from '../../components/ui/PremiumLoader';
import api from '../../api/client';
import type { Product, Category, Brand, SizeGuide } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCurrency } from '../../hooks/useCurrency';
import { sanitizeNumericInput } from '../../utils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

const STANDARD_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FREE SIZE'];

export default function AdminProducts() {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const { format, convert } = useCurrency();

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/products/${id}/approve`);
            toast.success('Product approved and published.');
            fetchData();
        } catch (error) {
            toast.error('Failed to approve product.');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return;
        try {
            await api.patch(`/products/${id}/reject`, { reason });
            toast.warning('Product rejected.');
            fetchData();
        } catch (error) {
            toast.error('Failed to reject product.');
        }
    };

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [gender, setGender] = useState<'MEN' | 'WOMEN' | 'UNISEX'>('UNISEX');
    const [images, setImages] = useState<any[]>(['']);
    const [variants, setVariants] = useState<any[]>([]);
    const [stock, setStock] = useState(0);
    const [isPublished, setIsPublished] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productFiles, setProductFiles] = useState<File[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
    const [sizeGuideId, setSizeGuideId] = useState('');
    const [isUploadingVariantId, setIsUploadingVariantId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [prodRes, catRes, brandRes, guideRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/brands'),
                api.get('/size-guides')
            ]);
            setProducts(prodRes.data.data.products || prodRes.data.data);
            setCategories(catRes.data.data);
            setBrands(brandRes.data.data);
            setSizeGuides(guideRes.data.data.sizeGuides || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to sync collection data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('basePrice', basePrice.toString());
        formData.append('discountPercentage', discountPercentage.toString());
        formData.append('category', categoryId);
        formData.append('brand', brandId);
        formData.append('gender', gender);
        formData.append('stock', stock.toString());
        formData.append('isPublished', isPublished.toString());
        if (sizeGuideId) formData.append('sizeGuide', sizeGuideId);

        const validImages = images.filter(img => {
            if (typeof img === 'string') return img.trim() !== '';
            return img && img.imageUrl;
        });

        if (variants.some(v => v.isBulk)) {
            toast.error('Please click "Apply" on all color bundles before saving.');
            setIsSubmitting(false);
            return;
        }

        formData.append('images', JSON.stringify(validImages));
        formData.append('variants', JSON.stringify(variants));

        productFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Collection item updated successfully.');
            } else {
                await api.post('/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('New piece added to the collection.');
            }
            fetchData();
            closeModal();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save product changes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await api.delete(`/products/${productToDelete}`);
            toast.success('Piece removed from the collection.');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove product.');
        } finally {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const openModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setTitle(product.title);
            setDescription(product.description);
            setBasePrice(product.basePrice);
            setDiscountPercentage(product.discountPercentage);
            setCategoryId(typeof product.category === 'object' ? product.category._id : product.category);
            setBrandId(typeof product.brand === 'object' ? product.brand._id : product.brand);
            setGender(product.gender);
            setImages(product.images.length > 0 ? [...product.images] : ['']);
            setVariants(product.variants || []);
            setStock(product.stock);
            setIsPublished(product.isPublished);
            setSizeGuideId(typeof product.sizeGuide === 'string' ? product.sizeGuide : (product.sizeGuide as any)?._id || '');
        } else {
            setEditingProduct(null);
            setTitle('');
            setDescription('');
            setBasePrice(0);
            setDiscountPercentage(0);
            setCategoryId('');
            setBrandId('');
            setGender('UNISEX');
            setImages(['']);
            setVariants([]);
            setStock(0);
            setIsPublished(false);
            setSizeGuideId('');
        }
        setProductFiles([]);
        setIsModalOpen(true);
    };

    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', colorCode: '', variantImage: { imageUrl: '' }, sku: '', price: basePrice, stock: 10 }]);
    };

    const addBulkVariant = () => {
        // Just add a template row with size as an array
        setVariants([...variants, { size: [], color: '', colorCode: '', variantImage: { imageUrl: '' }, sku: '', price: basePrice, stock: 10, isBulk: true }]);
    };

    const applyBulkVariant = (index: number) => {
        const row = variants[index];
        if (!row.size || row.size.length === 0) {
            toast.error('Please select at least one size');
            return;
        }

        const newEntries = row.size.map((s: string) => ({
            ...row,
            size: s,
            sku: row.sku ? `${row.sku}-${s}` : '',
            isBulk: false
        }));

        const newVariants = [...variants];
        newVariants.splice(index, 1, ...newEntries);
        setVariants(newVariants);
    };

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const handleVariantImageUpload = async (index: number, file: File) => {
        setIsUploadingVariantId(index);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/products/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateVariant(index, 'variantImage', res.data.data);
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setIsUploadingVariantId(null);
        }
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your luxury inventory and collection drops</p>
                </div>
                <Button onClick={() => openModal()} className="shadow-lg shadow-black/10 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Post New Product</span>
                </Button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setApprovalFilter(filter as any)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${approvalFilter === filter
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products by title..."
                            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:ring-2 focus:ring-black/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Product Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Category / Brand</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Price / Stock</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Approval</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        <div className="flex justify-center">
                                            <PremiumLoader size="md" text="Refreshing Collection..." />
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        No products found in the collection.
                                    </td>
                                </tr>
                            ) : (
                                products
                                    .filter((p: Product) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .filter((p: Product) => approvalFilter === 'ALL' || p.approvalStatus === approvalFilter)
                                    .map((prod: Product) => (
                                        <tr key={prod._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-16 w-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                                                        {prod.images[0]?.imageUrl ? (
                                                            <img src={prod.images[0].imageUrl} alt={prod.title} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <ShoppingBag className="h-5 w-5 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{prod.title}</p>
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.gender}</p>
                                                            {prod.vendor && (
                                                                <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Vendor</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-700">{typeof prod.category === 'object' ? prod.category.name : 'Unknown Category'}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{typeof prod.brand === 'object' ? prod.brand.name : 'Unknown Brand'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-gray-900">{format(convert(prod.finalPrice || prod.basePrice))}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${prod.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {prod.stock} in stock
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {prod.approvalStatus === 'APPROVED' && (
                                                    <span className="flex items-center space-x-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Approved</span>
                                                    </span>
                                                )}
                                                {prod.approvalStatus === 'PENDING' && (
                                                    <span className="flex items-center space-x-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Request</span>
                                                    </span>
                                                )}
                                                {prod.approvalStatus === 'REJECTED' && (
                                                    <span className="flex items-center space-x-1.5 text-[9px] font-black text-red-600 uppercase tracking-widest">
                                                        <XCircle className="h-3 w-3" />
                                                        <span>Rejected</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-2">
                                                    {prod.isPublished ? (
                                                        <span className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                                                            <Eye className="h-3 w-3" />
                                                            <span>Live</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-widest border border-gray-200">
                                                            <EyeOff className="h-3 w-3" />
                                                            <span>Draft</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right space-x-2 whitespace-nowrap">
                                                {isAdmin && prod.approvalStatus === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(prod._id)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(prod._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => openModal(prod)}
                                                    className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setProductToDelete(prod._id);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                                <h2 className="text-2xl font-serif">{editingProduct ? 'Update Inventory' : 'Post to Collection'}</h2>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="h-5 w-5 rotate-45 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
                                {/* Role-specific Status Alert */}
                                {!isAdmin && (editingProduct?.approvalStatus === 'PENDING' || editingProduct?.approvalStatus === 'REJECTED') && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "p-6 rounded-[24px] border flex items-center justify-between gap-4",
                                            editingProduct.approvalStatus === 'PENDING' ? "bg-amber-50 border-amber-100 text-amber-900" : "bg-red-50 border-red-100 text-red-900"
                                        )}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={cn("p-3 rounded-2xl", editingProduct.approvalStatus === 'PENDING' ? "bg-amber-200/50" : "bg-red-200/50")}>
                                                {editingProduct.approvalStatus === 'PENDING' ? <Clock className="h-6 w-6 text-amber-700" /> : <XCircle className="h-6 w-6 text-red-700" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-wider">
                                                    {editingProduct.approvalStatus === 'PENDING' ? 'Submission Under Review' : 'Submission Rejected'}
                                                </h4>
                                                <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight mt-0.5">
                                                    {editingProduct.approvalStatus === 'PENDING'
                                                        ? 'Our curators are currently verifying this piece. It will be live once approved.'
                                                        : editingProduct.rejectionReason || 'This piece did not meet our collection standards. Please check the details.'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Basic Info */}
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Basic Information</p>
                                        <Input label="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                                            <textarea
                                                className="w-full bg-white border-b-2 border-gray-100 py-3 text-sm focus:border-black focus:outline-none min-h-[120px] transition-colors"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                                <select
                                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-black/5"
                                                    value={categoryId}
                                                    onChange={(e) => setCategoryId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Brand</label>
                                                <select
                                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-black/5"
                                                    value={brandId}
                                                    onChange={(e) => setBrandId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Brand</option>
                                                    {brands.map(brand => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & Stock */}
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Pricing & Logistics</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Base Price (INR)"
                                                value={basePrice}
                                                onChange={(e) => setBasePrice(Number(sanitizeNumericInput(e.target.value)))}
                                                required
                                            />
                                            <Input
                                                label="Discount %"
                                                value={discountPercentage}
                                                onChange={(e) => setDiscountPercentage(Number(sanitizeNumericInput(e.target.value)))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="Total Stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                                                <select
                                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-black/5"
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value as any)}
                                                >
                                                    <option value="MEN">MEN</option>
                                                    <option value="WOMEN">WOMEN</option>
                                                    <option value="UNISEX">UNISEX</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Size Guide</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-black/5"
                                                value={sizeGuideId}
                                                onChange={(e) => setSizeGuideId(e.target.value)}
                                            >
                                                <option value="">No Size Guide</option>
                                                {sizeGuides.map(guide => (
                                                    <option key={guide._id} value={guide._id}>{guide.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Image Assets */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Assets</p>
                                                <label className="text-[10px] font-bold text-black cursor-pointer flex items-center space-x-1 hover:underline">
                                                    <Paperclip className="h-3 w-3" />
                                                    <span>Upload Files</span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files) {
                                                                setProductFiles([...productFiles, ...Array.from(e.target.files)]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {/* Existing Image URLs */}
                                            <div className="space-y-3">
                                                {images.map((img, idx) => {
                                                    const imgValue = typeof img === 'string' ? img : img.imageUrl;
                                                    return (
                                                        <div key={`url-${idx}`} className="group relative">
                                                            <input
                                                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-xs font-medium focus:ring-2 focus:ring-black/5 transition-all"
                                                                value={imgValue}
                                                                onChange={(e) => {
                                                                    const newImgs = [...images];
                                                                    if (typeof newImgs[idx] === 'object' && newImgs[idx] !== null) {
                                                                        (newImgs[idx] as any).imageUrl = e.target.value;
                                                                    } else {
                                                                        newImgs[idx] = e.target.value;
                                                                    }
                                                                    setImages(newImgs);
                                                                }}
                                                                placeholder="Paste Image URL..."
                                                            />
                                                            {images.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Newly Uploaded Files */}
                                            {productFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-3 pt-2">
                                                    {productFiles.map((file, idx) => (
                                                        <div key={`file-${idx}`} className="relative h-16 w-16 rounded-xl overflow-hidden group border border-gray-100">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                className="h-full w-full object-cover"
                                                                alt=""
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setProductFiles(productFiles.filter((_, i) => i !== idx))}
                                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-4 w-4 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setImages([...images, ''])}
                                                className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-gray-200 hover:text-black transition-all"
                                            >
                                                Add Another URL Placeholder
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Variants Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Variants (Size, SKU, Stock)</p>
                                            <p className="text-[8px] text-gray-400 uppercase">Manage specific options for this piece</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={addBulkVariant}
                                                className="text-[10px] font-bold text-amber-600 border-2 border-amber-600 px-3 py-1 rounded-full hover:bg-amber-600 hover:text-white transition-all uppercase tracking-tight"
                                            >
                                                Add Color Bundle
                                            </button>
                                            <button
                                                type="button"
                                                onClick={addVariant}
                                                className="text-[10px] font-bold text-black border-2 border-black px-3 py-1 rounded-full hover:bg-black hover:text-white transition-all uppercase tracking-tight"
                                            >
                                                Add Single Variant
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {variants.length === 0 ? (
                                            <div className="py-10 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                                                <p className="text-xs text-gray-400">No variants defined. Add sizes or colors if applicable.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">
                                                            <th className="pb-3 pl-4">Size Selection</th>
                                                            <th className="pb-3">Color Info</th>
                                                            <th className="pb-3">Variant Image</th>
                                                            <th className="pb-3">SKU</th>
                                                            <th className="pb-3">Price</th>
                                                            <th className="pb-3">Stock</th>
                                                            <th className="pb-3 text-right pr-4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="space-y-2">
                                                        {variants.map((v, idx) => (
                                                            <tr key={idx} className={`bg-gray-50/30 ${v.isBulk ? 'ring-2 ring-amber-100 rounded-2xl' : ''}`}>
                                                                <td className="py-2 pl-2">
                                                                    {v.isBulk ? (
                                                                        <div className="flex flex-wrap gap-1 max-w-[200px] py-1">
                                                                            {STANDARD_SIZES.map(s => (
                                                                                <button
                                                                                    key={s}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const current = Array.isArray(v.size) ? v.size : [];
                                                                                        const next = current.includes(s)
                                                                                            ? current.filter((x: string) => x !== s)
                                                                                            : [...current, s];
                                                                                        updateVariant(idx, 'size', next);
                                                                                    }}
                                                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${Array.isArray(v.size) && v.size.includes(s) ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-100'}`}
                                                                                >
                                                                                    {s}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-1 py-1">
                                                                            <select
                                                                                className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs focus:ring-1 focus:ring-black outline-none"
                                                                                value={STANDARD_SIZES.includes(v.size) ? v.size : 'CUSTOM'}
                                                                                onChange={(e) => updateVariant(idx, 'size', e.target.value === 'CUSTOM' ? '' : e.target.value)}
                                                                            >
                                                                                <option value="CUSTOM">Custom Size</option>
                                                                                {STANDARD_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                                            </select>
                                                                            {!STANDARD_SIZES.includes(v.size) && (
                                                                                <input
                                                                                    className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs focus:ring-1 focus:ring-black outline-none"
                                                                                    placeholder="M"
                                                                                    value={v.size || ''}
                                                                                    onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <div className="flex flex-col gap-1.5 py-1">
                                                                        <input
                                                                            className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs focus:ring-1 focus:ring-black outline-none"
                                                                            placeholder="Color Name"
                                                                            value={v.color || ''}
                                                                            onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                                                                        />
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="color"
                                                                                className="w-8 h-8 rounded-lg cursor-pointer bg-white border border-gray-100 p-0.5"
                                                                                value={v.colorCode || '#888888'}
                                                                                onChange={(e) => updateVariant(idx, 'colorCode', e.target.value)}
                                                                            />
                                                                            <input
                                                                                className="flex-1 bg-white border border-gray-100 rounded-xl px-2 py-1.5 text-[10px] font-mono focus:ring-1 focus:ring-black outline-none"
                                                                                placeholder="#HEX"
                                                                                value={v.colorCode || ''}
                                                                                onChange={(e) => updateVariant(idx, 'colorCode', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-center">
                                                                    <div className="relative group mx-auto py-1">
                                                                        {v.variantImage?.imageUrl ? (
                                                                            <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-gray-100 mx-auto">
                                                                                <img src={v.variantImage.imageUrl} className="w-full h-full object-cover" alt="" />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => updateVariant(idx, 'variantImage', { imageUrl: '' })}
                                                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                                                                >
                                                                                    <X className="h-4 w-4 text-white" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <label className="flex flex-col items-center justify-center w-12 h-16 bg-white border-2 border-dashed border-gray-100 rounded-lg cursor-pointer hover:border-gray-200 transition-all mx-auto">
                                                                                {isUploadingVariantId === idx ? (
                                                                                    <div className="h-4 w-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                                                                                ) : (
                                                                                    <Paperclip className="h-4 w-4 text-gray-300" />
                                                                                )}
                                                                                <input
                                                                                    type="file"
                                                                                    className="hidden"
                                                                                    accept="image/*"
                                                                                    onChange={(e) => e.target.files?.[0] && handleVariantImageUpload(idx, e.target.files[0])}
                                                                                />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input
                                                                        className="w-24 bg-white border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-mono focus:ring-1 focus:ring-black outline-none"
                                                                        placeholder={v.isBulk ? "Base SKU" : "SKU"}
                                                                        value={v.sku}
                                                                        onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input
                                                                        className="w-16 bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs focus:ring-1 focus:ring-black outline-none"
                                                                        value={v.price}
                                                                        onChange={(e) => updateVariant(idx, 'price', Number(sanitizeNumericInput(e.target.value)))}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input
                                                                        className="w-16 bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs focus:ring-1 focus:ring-black outline-none"
                                                                        value={v.stock}
                                                                        onChange={(e) => updateVariant(idx, 'stock', Number(sanitizeNumericInput(e.target.value)))}
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2 text-right">
                                                                    <div className="flex flex-col gap-1 items-end">
                                                                        {v.isBulk && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => applyBulkVariant(idx)}
                                                                                className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                                                                            >
                                                                                Apply
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeVariant(idx)}
                                                                            className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(!isAdmin && editingProduct && editingProduct.approvalStatus !== 'APPROVED') ? (
                                    <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-amber-900">Awaiting Review</p>
                                            <p className="text-[10px] text-amber-700 font-medium tracking-wide uppercase">Visibility is restricted until admin approval.</p>
                                        </div>
                                        <div className="h-8 w-8 bg-amber-200/50 rounded-full flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-amber-700" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-6 bg-gray-900 rounded-[24px] text-white">
                                        <div>
                                            <p className="text-sm font-bold">Publish to Online Store</p>
                                            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Visible to all premium members</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsPublished(!isPublished)}
                                            className={`w-14 h-7 rounded-full transition-all relative ${isPublished ? 'bg-emerald-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isPublished ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                )}

                                <div className="shrink-0 flex space-x-4 pt-4 border-t border-gray-50">
                                    <Button variant="outline" type="button" onClick={closeModal} className="flex-1">Discard</Button>
                                    <Button type="submit" className="flex-[2] h-14" isLoading={isSubmitting}>
                                        {editingProduct ? 'Update Collection' : 'Confirm & Publish'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Remove from Collection"
                message="Are you sure you want to remove this piece? This action is permanent and will disappear from all premium catalogs."
                confirmText="Remove Piece"
                cancelText="Keep piece"
                variant="danger"
            />
        </div>
    );
}
