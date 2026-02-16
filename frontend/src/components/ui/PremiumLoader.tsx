import { motion } from 'framer-motion';

interface PremiumLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export default function PremiumLoader({ size = 'md', text, className = '' }: PremiumLoaderProps) {
    const sizeMap = {
        sm: 'w-24',
        md: 'w-48',
        lg: 'w-64'
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 1.02, 1]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`${sizeMap[size]} flex flex-col items-center space-y-2`}
            >
                {/* Recreated Logo in SVG for maximum quality and performance */}
                <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <text
                        x="50%"
                        y="50"
                        textAnchor="middle"
                        fontFamily="'Playfair Display', serif"
                        fontWeight="700"
                        fontSize="42"
                        letterSpacing="0.05em"
                        fill="black"
                    >
                        SÉRRA
                    </text>
                    <text
                        x="50%"
                        y="85"
                        textAnchor="middle"
                        fontFamily="'Inter', sans-serif"
                        fontWeight="400"
                        fontSize="14"
                        letterSpacing="0.4em"
                        fill="black"
                        className="opacity-80"
                    >
                        FASHION
                    </text>
                </svg>

                {/* Subtle progress line */}
                <div className="w-1/2 h-[1px] bg-gray-100 relative overflow-hidden mt-4">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-black w-full"
                        animate={{
                            x: ['-100%', '100%']
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </motion.div>

            {text && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400"
                >
                    {text}
                </motion.span>
            )}
        </div>
    );
}
