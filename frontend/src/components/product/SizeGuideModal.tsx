import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Info } from 'lucide-react';
import type { SizeGuide } from '../../types';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    sizeGuide?: SizeGuide;
}

export default function SizeGuideModal({ isOpen, onClose, sizeGuide }: SizeGuideModalProps) {
    const defaultChart = [
        { size: 'XS', chest: '34-36', waist: '28-30', hips: '36-38' },
        { size: 'S', chest: '36-38', waist: '30-32', hips: '38-40' },
        { size: 'M', chest: '38-40', waist: '32-34', hips: '40-42' },
        { size: 'L', chest: '40-42', waist: '34-36', hips: '42-44' },
        { size: 'XL', chest: '42-44', waist: '36-38', hips: '44-46' },
        { size: 'XXL', chest: '44-46', waist: '38-40', hips: '46-48' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-10"
                    >
                        <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-9 w-9 bg-black rounded-xl flex items-center justify-center">
                                    <Ruler className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-gray-900">{sizeGuide?.name || 'Size Guide'}</h2>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Find Your Perfect Fit</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
                            {sizeGuide?.image?.imageUrl ? (
                                <div className="space-y-8">
                                    {sizeGuide.description && (
                                        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl">
                                            <Info className="w-5 h-5 text-black shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium">{sizeGuide.description}</p>
                                        </div>
                                    )}
                                    <div className="rounded-[40px] overflow-hidden bg-gray-50 border-8 border-gray-50">
                                        <img
                                            src={sizeGuide.image.imageUrl}
                                            alt={sizeGuide.name}
                                            className="w-full h-auto object-contain max-h-[60vh]"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    <div className="p-8 bg-gray-50 rounded-[40px]">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-black rounded-full" />
                                            How to Measure
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {[
                                                { label: 'Chest', text: 'Measure around the fullest part of your chest, keeping the tape measure horizontal.' },
                                                { label: 'Waist', text: 'Measure around your natural waistline, keeping the tape comfortably loose.' },
                                                { label: 'Hips', text: 'Measure around the fullest part of your hips, approximately 8" below waist.' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 0{idx + 1}</span>
                                                    <p className="font-bold text-gray-900">{item.label}</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b-2 border-black">
                                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-900">Size</th>
                                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-900">Chest (in)</th>
                                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-900">Waist (in)</th>
                                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-900">Hips (in)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 italic font-medium">
                                                {defaultChart.map((row) => (
                                                    <tr key={row.size} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4 font-bold text-black font-serif">{row.size}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 font-sans">{row.chest}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 font-sans">{row.waist}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 font-sans">{row.hips}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 p-8 bg-amber-50/50 border border-amber-100 rounded-[32px]">
                                <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                                    Essential Note
                                </p>
                                <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                                    All measurements are indicative. If you find yourself between sizes, our designers suggest choosing the larger size for a signature relaxed silhouette.
                                </p>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-gray-100 flex justify-end">
                            <button onClick={onClose} className="px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10">
                                Confirm Sizing
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
