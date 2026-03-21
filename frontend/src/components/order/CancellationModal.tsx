import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const CANCEL_REASONS = [
    "Ordered by mistake",
    "Found a better price elsewhere",
    "Delivery date is too late",
    "Wrong shipping address",
    "Item price reduced",
    "Duplicate order",
    "Changed my mind",
    "Other"
];

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, description: string) => void;
    isLoading: boolean;
}

export default function CancellationModal({ isOpen, onClose, onConfirm, isLoading }: CancellationModalProps) {
    const [selectedReason, setSelectedReason] = useState("");
    const [description, setDescription] = useState("");

    if (!isOpen) return null;

    return (
        <AnimatePresence>
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
                    className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden m-4"
                >
                    {/* Header */}
                    <div className="p-5 md:p-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-gray-900">Cancel Order</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Please tell us why you're cancelling</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Reason for Cancellation</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {CANCEL_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setSelectedReason(reason)}
                                        className={`text-left px-4 py-3 rounded-xl border text-xs transition-all duration-200 ${
                                            selectedReason === reason 
                                            ? 'border-black bg-black text-white font-bold shadow-lg shadow-black/10' 
                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Additional Details (Optional)</label>
                            <textarea
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black/5 rounded-2xl py-4 px-4 text-sm focus:ring-0 outline-none min-h-[100px] resize-none transition-all placeholder:text-gray-300"
                                placeholder="Help us improve by sharing more details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                <strong>Note:</strong> Once cancelled, this action cannot be undone. If you've already paid, your refund will be processed to the original payment method within 5-7 business days.
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 md:p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4 shrink-0">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                            Go Back
                        </button>
                        <Button
                            onClick={() => onConfirm(selectedReason, description)}
                            disabled={!selectedReason || isLoading}
                            isLoading={isLoading}
                            className="flex-[2] h-14 rounded-2xl shadow-xl shadow-black/10 text-[11px] uppercase tracking-[0.2em]"
                        >
                            Confirm Cancel
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
