import React, { useEffect, useState } from 'react';
import { Discount, Language } from '../types';
import { FiTag, FiCopy, FiCheck } from 'react-icons/fi';
import '../styles/sponsors-sections.css';

interface DiscountsSectionProps {
    language: Language;
}

const DiscountsSection: React.FC<DiscountsSectionProps> = ({ language }) => {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const isAr = language === 'ar';

    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const response = await fetch('/api/v1/public/content');
                const data = await response.json();
                setDiscounts(data.discounts || []);
            } catch (error) {
                console.error('Error fetching discounts Section:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscounts();
    }, []);

    const copyToClipboard = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading || discounts.length === 0) return null;

    return (
        <section className="discounts-offer-section">
            <div className="container">
                <div className="section-header-left">
                    <h2 className="section-title">
                        {isAr ? 'العروض و' : 'Exclusive'} <span>{isAr ? 'الخصومات' : 'Offers'}</span>
                    </h2>
                    <p className="section-subtitle">
                        {isAr ? 'استمتع بخصومات حصرية من شركائنا المعتمدين' : 'Enjoy exclusive discounts from our certified partners'}
                    </p>
                </div>

                <div className="discounts-grid">
                    {discounts.map(discount => (
                        <div key={discount.id} className="discount-card-premium">
                            {/* Sponsor Branding - Requested Feature */}
                            {discount.sponsor && (
                                <div className="discount-sponsor-branding">
                                    <img src={discount.sponsor.logo_url} alt={isAr ? discount.sponsor.name_ar : discount.sponsor.name_en} />
                                    <span>{isAr ? discount.sponsor.name_ar : discount.sponsor.name_en}</span>
                                </div>
                            )}
                            
                            <div className="discount-image">
                                <img src={discount.image_url || '/images/discount-placeholder.jpg'} alt={isAr ? discount.title_ar : discount.title_en} />
                                <div className="discount-badge">
                                    <FiTag />
                                    <span>OFFER</span>
                                </div>
                            </div>
                            
                            <div className="discount-details">
                                <h3>{isAr ? discount.title_ar : discount.title_en}</h3>
                                <p>{isAr ? discount.description_ar : discount.description_en}</p>
                                
                                {discount.code && (
                                    <div className="discount-code-wrapper">
                                        <div className="code-box">
                                            <span className="code-label">{isAr ? 'كود الخصم:' : 'PROMO CODE:'}</span>
                                            <code className="promo-code-text">{discount.code}</code>
                                        </div>
                                        <button 
                                            className={`copy-btn ${copiedId === discount.id ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(discount.code!, discount.id)}
                                        >
                                            {copiedId === discount.id ? <FiCheck /> : <FiCopy />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DiscountsSection;
