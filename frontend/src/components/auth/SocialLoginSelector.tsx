import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface SocialAccount {
    id: string;
    email: string;
    name: string;
    image: string;
    idToken?: string;
    accessToken?: string;
}

// Facebook login disabled for now
// const FACEBOOK_APP_ID = "your_facebook_app_id";

interface SocialLoginSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    provider: 'Google' | 'Facebook';
    onSelect: (account: SocialAccount) => void;
}


export default function SocialLoginSelector({ isOpen, onClose, provider, onSelect }: SocialLoginSelectorProps) {
    const handleGoogleSuccess = (credentialResponse: any) => {
        const decoded: any = jwtDecode(credentialResponse.credential);
        onSelect({
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            image: decoded.picture,
            idToken: credentialResponse.credential
        });
    };

    /* const handleFacebookResponse = (response: any) => {
        if (response.accessToken) {
            onSelect({
                id: response.userID,
                email: response.email,
                name: response.name,
                image: response.picture?.data?.url,
                accessToken: response.accessToken
            });
        } else {
            toast.error('Facebook authentication failed');
        }
    }; */

    const handleClose = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-sm overflow-hidden border border-gray-100"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={provider === 'Google' ? 'https://www.svgrepo.com/show/475656/google-color.svg' : 'https://www.svgrepo.com/show/475643/facebook-color.svg'}
                                        className="h-6 w-6"
                                        alt={provider}
                                    />
                                    <h3 className="text-xl font-serif text-gray-900">Sign in with {provider}</h3>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {provider === 'Google' ? (
                                    <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                                        <div className="p-3 bg-white rounded-full shadow-sm">
                                            <Shield className="h-6 w-6 text-emerald-500" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-gray-900">Official Google Auth</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest px-4">Secure biometric/one-tap access</p>
                                        </div>
                                        <div className="w-full flex justify-center scale-110 py-2">
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={() => toast.error('Google Auth Failed')}
                                                useOneTap
                                                theme="outline"
                                                shape="pill"
                                                size="large"
                                                width="100%"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                                        <div className="p-3 bg-white rounded-full shadow-sm">
                                            <Shield className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-gray-900">Facebook Meta Auth</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest px-4">Secure multi-factor access</p>
                                        </div>
                                        <div className="w-full flex justify-center py-2">
                                            <FacebookLogin
                                                appId={FACEBOOK_APP_ID}
                                                autoLoad={false}
                                                fields="name,email,picture"
                                                callback={handleFacebookResponse}
                                                render={(renderProps: any) => (
                                                    <Button
                                                        onClick={renderProps.onClick}
                                                        className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166fe5]"
                                                    >
                                                        <img src="https://www.svgrepo.com/show/475643/facebook-color.svg" className="h-5 w-5 brightness-0 invert" alt="Facebook" />
                                                        <span>Continue with Facebook</span>
                                                    </Button>
                                                )}
                                            />
                                        </div>
                                    </div> */
                                    <div className="text-center p-8 bg-gray-50 rounded-[24px]">
                                        <p className="text-sm text-gray-500">Facebook login is currently unavailable.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-10 pt-6 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 leading-relaxed text-center px-4">
                                    To continue, {provider} will share your name, email address, language preference, and profile picture with SÉRRA FASHION STUDIO.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
