import { type ButtonHTMLAttributes, type FC } from 'react';
import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button: FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-95',
        secondary: 'bg-white text-black border-2 border-black hover:bg-black hover:text-white hover:shadow-lg active:scale-95',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-900 text-gray-900 active:scale-95',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 active:scale-95',
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    return (
        <button
            className={cn(
                'flex items-center justify-center font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
