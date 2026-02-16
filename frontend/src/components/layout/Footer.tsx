import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    const socialLinks = [
        { icon: Instagram, url: import.meta.env.VITE_INSTAGRAM_URL, label: 'Instagram' },
        { icon: Facebook, url: import.meta.env.VITE_FACEBOOK_URL, label: 'Facebook' },
        { icon: Twitter, url: import.meta.env.VITE_TWITTER_URL, label: 'Twitter' },
    ];

    return (
        <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                {/* Brand & Mission */}
                <div className="space-y-8">
                    <Link to="/" className="group inline-block">
                        <h3 className="text-3xl font-serif font-bold tracking-tight text-black italic group-hover:opacity-70 transition-opacity">
                            SÉRRA FASHION
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs font-medium italic">
                        "Curating timeless elegance for the modern individual. Every piece is a testament to premium craftsmanship and minimalist luxury."
                    </p>
                    <div className="flex items-center space-x-4">
                        {socialLinks.map(({ icon: Icon, url, label }) => (
                            <a
                                key={label}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all hover:-translate-y-1 shadow-sm"
                                aria-label={label}
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Collections */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-8">Collections</h4>
                    <ul className="space-y-4">
                        {[
                            { label: 'Men', path: '/men' },
                            { label: 'Women', path: '/women' },
                            { label: 'New Arrivals', path: '/new' },
                            { label: 'Special Offers', path: '/sale' },
                            { label: 'Full Gallery', path: '/collection' }
                        ].map((item) => (
                            <li key={item.label}>
                                <Link
                                    to={item.path}
                                    className="text-sm text-gray-500 hover:text-black transition-colors flex items-center group font-medium"
                                >
                                    <span className="w-0 group-hover:w-4 h-[1px] bg-black mr-0 group-hover:mr-2 transition-all"></span>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-8">Customer Care</h4>
                    <ul className="space-y-4 text-sm text-gray-500 font-medium">
                        <li><Link to="/orders" className="hover:text-black">Track Order</Link></li>
                        <li><Link to="/shipping" className="hover:text-black">Shipping Policy</Link></li>
                        <li><Link to="/privacy-policy" className="hover:text-black">Privacy Policy</Link></li>
                        <li><Link to="/contact" className="hover:text-black">Contact Concierge</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-8">Find Us</h4>
                    <ul className="space-y-5 text-sm text-gray-500 font-medium">
                        <li className="flex items-start space-x-3">
                            <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
                            <span>Avadi, Chennai <br />Tamil Nadu 600065, India</span>
                        </li>
                        <li className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-black shrink-0" />
                            <a href="mailto:serrafashion123@gmail.com" className="hover:text-black">serrafashion123</a>
                        </li>
                        <li className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-black shrink-0" />
                            <a href="tel:+919080376899" className="hover:text-black">+91 9080376899</a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 mt-20 pt-8 border-t border-gray-100/50 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                <p>&copy; {new Date().getFullYear()} SÉRRA FASHION. Crafted with Passion.</p>
                <div className="flex items-center space-x-8 mt-6 md:mt-0">
                    <span className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Secure SSL Payment</span>
                    </span>
                    <span className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        <span>Worldwide Express Shipping</span>
                    </span>
                </div>
            </div>
        </footer>
    );
}
