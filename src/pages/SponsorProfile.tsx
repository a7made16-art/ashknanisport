import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Language, Sponsor, Discount } from '../types';
import { FiGlobe, FiTag, FiImage, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import '../styles/sponsor-profile.css';

interface SponsorProfileProps {
    language: Language;
}

const SponsorProfile: React.FC<SponsorProfileProps> = ({ language }) => {
    const { id } = useParams<{ id: string }>();
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [loading, setLoading] = useState(true);
    const isAr = language === 'ar';

    useEffect(() => {
        const fetchSponsorDetails = async () => {
            try {
                const response = await fetch(`/api/v1/public/sponsors/${id}`);
                const resData = await response.json();
                setSponsor(resData.data || resData);
            } catch (error) {
                console.error('Error fetching sponsor details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorDetails();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return <div className="loading-state">Loading Profile...</div>;
    if (!sponsor) return <div className="error-state">Sponsor not found</div>;

    return (
        <div className="sponsor-profile">
            {/* Header / Hero */}
            <div className="profile-hero">
                <div className="container">
                    <Link to="/sponsors" className="back-link">
                        {isAr ? <FiArrowRight /> : <FiArrowLeft />}
                        <span>{isAr ? 'العودة للرعاة' : 'Back to Sponsors'}</span>
                    </Link>
                    <div className="hero-content">
                        <div className="profile-logo">
                            <img src={sponsor.logo_url} alt={isAr ? sponsor.name_ar : sponsor.name_en} />
                        </div>
                        <div className="profile-title">
                            <div className="tier-badge">{t_tier(sponsor.tier, isAr)}</div>
                            <h1>{isAr ? sponsor.name_ar : sponsor.name_en}</h1>
                            {sponsor.website_url && (
                                <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="website-link">
                                    <FiGlobe />
                                    <span>{sponsor.website_url.replace('https://', '').replace('http://', '')}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container profile-body">
                <div className="profile-grid">
                    {/* Main Content */}
                    <div className="main-info">
                        <section className="info-section">
                            <h2>{isAr ? 'عن الشريك' : 'About the Partner'}</h2>
                            <p className="description">
                                {isAr ? sponsor.services_ar : sponsor.services_en}
                            </p>
                        </section>

                        {/* Gallery */}
                        {sponsor.images && sponsor.images.length > 0 && (
                            <section className="gallery-section">
                                <div className="section-header">
                                    <FiImage />
                                    <h2>{isAr ? 'معرض الصور' : 'Photo Gallery'}</h2>
                                </div>
                                <div className="image-grid">
                                    {sponsor.images.map((img, index) => (
                                        <div key={img.id} className="gallery-item">
                                            <img src={img.image_url} alt={`Gallery ${index}`} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar / Offers */}
                    <div className="profile-sidebar">
                        {sponsor.discounts && sponsor.discounts.length > 0 && (
                            <div className="offers-card">
                                <div className="card-header">
                                    <FiTag />
                                    <h3>{isAr ? 'عروض حصرية' : 'Exclusive Offers'}</h3>
                                </div>
                                <div className="offers-list">
                                    {sponsor.discounts.map(discount => (
                                        <div key={discount.id} className="offer-item">
                                            <h4>{isAr ? discount.title_ar : discount.title_en}</h4>
                                            <p>{isAr ? discount.description_ar : discount.description_en}</p>
                                            {discount.code && (
                                                <div className="promo-code">
                                                    <span>{isAr ? 'الكود:' : 'Code:'}</span>
                                                    <code>{discount.code}</code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const t_tier = (tier: string | undefined, isAr: boolean) => {
    const tiers: any = {
        diamond: isAr ? 'راعي ماسي' : 'Diamond Sponsor',
        gold: isAr ? 'راعي ذهبي' : 'Gold Sponsor',
        silver: isAr ? 'راعي فضي' : 'Silver Sponsor',
        partner: isAr ? 'شريك رسمي' : 'Official Partner',
    };
    return tiers[tier || 'partner'] || tiers.partner;
};

export default SponsorProfile;
