import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    variant?: 'default' | 'floating';
    containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, variant = 'default', containerClassName, ...props }, ref) => {
        return (
            <div className={cn("w-full space-y-2", containerClassName)}>
                {label && variant === 'default' && (
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        className={cn(
                            'w-full px-4 py-3.5 text-sm bg-white transition-all duration-200',
                            variant === 'default'
                                ? 'border-b-2 border-gray-200 focus:border-black focus:outline-none'
                                : 'border border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none',
                            error && 'border-red-500 focus:border-red-500',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {label && variant === 'floating' && (
                        <label className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {label}
                        </label>
                    )}
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export default Input;
