import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary'
}: ConfirmationModalProps) {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[99999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative bg-white w-full max-w-md mx-4 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-black/5"
                    >
                        <div className="p-8 sm:p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div
                                    className={`p-4 rounded-2xl ${variant === 'danger'
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <AlertCircle className="h-6 w-6" />
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-full text-gray-400 hover:bg-gray-100 hover:text-black transition"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-10">
                                <h3 className="text-3xl font-serif text-gray-900">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-16 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em]"
                                    onClick={onClose}
                                >
                                    {cancelText}
                                </Button>

                                <Button
                                    className={`flex-1 h-16 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] ${variant === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                                        : 'bg-black shadow-lg shadow-black/20'
                                        }`}
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
