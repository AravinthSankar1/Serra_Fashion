import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import { Shield, Lock, Eye, Share2, ClipboardList, Cookie, UserCheck, ExternalLink, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const sections = [
        {
            title: "1. Introduction",
            icon: <Shield className="h-6 w-6 text-black" />,
            content: "At SÉRRA FASHION, your privacy is a cornerstone of our relationship. We recognize the importance of protecting your personal information and are committed to maintaining the highest standards of data security and transparency. This Privacy Policy explains how we collect, use, and protect your data when you interact with our platform."
        },
        {
            title: "2. Information We Collect",
            icon: <ClipboardList className="h-6 w-6 text-black" />,
            content: "We collect information that allows us to provide a curated fashion experience. This includes Personal Information such as your name, email address, and phone number when you create an account or place an order. We also collect Usage Data, including pages visited, app interactions, and device/browser information. Lastly, we use Cookies and similar tracking technologies to enhance your browsing experience."
        },
        {
            title: "3. How We Use Information",
            icon: <Eye className="h-6 w-6 text-black" />,
            content: "Your information is used primarily to provide and improve our services. This includes processing orders, personalizing your shopping experience, and communicating with you about your account. We also use data for internal security monitoring, advanced analytics to refine our collections, and to meet our legal obligations."
        },
        {
            title: "4. Cookies Policy",
            icon: <Cookie className="h-6 w-6 text-black" />,
            content: "Cookies are small data files stored on your device that help us remember your preferences and recognize you on return visits. We use them for session management and to understand site traffic patterns. You can choose to disable cookies through your browser settings, though some features of our platform may not function correctly without them."
        },
        {
            title: "5. Data Sharing and Disclosure",
            icon: <Share2 className="h-6 w-6 text-black" />,
            content: "We firmly do not sell your personal data to third parties. Data is only shared with trusted partners essential to our operations (such as payment processors and logistics providers) or when required by law to protect our rights or the safety of our community."
        },
        {
            title: "6. Data Security",
            icon: <Lock className="h-6 w-6 text-black" />,
            content: "We implement industry-standard security measures, including encryption and secure server protocols, to safeguard your information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security."
        },
        {
            title: "7. User Rights",
            icon: <UserCheck className="h-6 w-6 text-black" />,
            content: "You maintain significant rights over your data. You may access, update, or request the deletion of your personal information at any time through your account settings. You also have the right to withdraw your consent for data processing by contacting our privacy team."
        },
        {
            title: "8. Third-Party Links",
            icon: <ExternalLink className="h-6 w-6 text-black" />,
            content: "Our website may contain links to external sites not operated by us. Please be aware that we have no control over the content and practices of these sites and cannot accept responsibility or liability for their respective privacy policies."
        },
        {
            title: "9. Children’s Privacy",
            icon: <UserCheck className="h-6 w-6 text-black" />, // Using UserCheck as a fallback or could use a custom icon
            content: "SÉRRA FASHION is intended for a general audience and is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with data, we will take immediate steps to delete it."
        },
        {
            title: "10. Changes to This Privacy Policy",
            icon: <RefreshCw className="h-6 w-6 text-black" />,
            content: "We may update our Privacy Policy from time to time to reflect changes in our practices or legal requirements. Any modifications will be posted on this page with an updated 'Last Revised' date. We encourage you to review this policy periodically."
        },
        {
            title: "11. Contact Us",
            icon: <Mail className="h-6 w-6 text-black" />,
            content: "If you have questions or concerns regarding this Privacy Policy or your data, please reach out to our team at support@serrafashion.com. We are dedicated to resolving any privacy-related inquiries promptly."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    <div className="h-1 w-20 bg-black mx-auto mb-8"></div>
                    <p className="text-gray-500 font-medium tracking-widest uppercase text-[10px]">Last Updated: February 2024</p>
                </motion.div>

                <div className="space-y-16">
                    {sections.map((section, index) => (
                        <motion.section
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                    {section.icon}
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-gray-900">{section.title}</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-lg pl-1">
                                {section.content}
                            </p>
                        </motion.section>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 p-12 bg-gray-50 rounded-[40px] text-center border border-gray-100"
                >
                    <h3 className="text-xl font-serif font-bold mb-4">Have specific privacy questions?</h3>
                    <p className="text-gray-500 mb-8">Our specialized data protection team is here to assist you with any inquiries regarding your personal information.</p>
                    <a
                        href="mailto:privacy@serrafashion.com"
                        className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl shadow-black/10"
                    >
                        Contact Privacy Team
                    </a>
                </motion.div>
            </main>

            <footer className="py-20 border-t border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">© 2024 SERRA FASHION — PURE ELEGANCE. PURE PRIVACY.</p>
            </footer>
        </div>
    );
}
