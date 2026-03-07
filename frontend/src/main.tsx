import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, CartProvider } from './context';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = "1007959241581-88u54cqnah0lrbd98cc3r8b88decn9ke.apps.googleusercontent.com";

import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <AuthProvider>
                        <ThemeProvider>
                            <CartProvider>
                                <App />
                            </CartProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </GoogleOAuthProvider>
            </QueryClientProvider>
        </HelmetProvider>
    </React.StrictMode>,
)
