import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Language, Sponsor } from '../types';
import { FiExternalLink, FiArrowRight } from 'react-icons/fi';
import '../styles/sponsors.css';

interface SponsorsListingProps {
    language: Language;
}

const SponsorsListing: React.FC<SponsorsListingProps> = ({ language }) => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);

    const isAr = language === 'ar';

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const response = await fetch('/api/v1/public/sponsors');
                const data = await response.json();
                setSponsors(data.data || data);
            } catch (error) {
                console.error('Error fetching sponsors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsors();
        window.scrollTo(0, 0);
    }, []);

    const tiers = {
        diamond: sponsors.filter(s => s.tier === 'diamond'),
        gold: sponsors.filter(s => s.tier === 'gold'),
        silver: sponsors.filter(s => s.tier === 'silver'),
        partner: sponsors.filter(s => s.tier === 'partner' || !s.tier),
    };

    const TierSection = ({ title, sponsorsList, className }: { title: string, sponsorsList: Sponsor[], className: string }) => {
        if (sponsorsList.length === 0) return null;
        return (
            <div className={`tier-section ${className}`}>
                <h2 className="tier-title">{title}</h2>
                <div className="sponsors-grid">
                    {sponsorsList.map(sponsor => (
                        <Link to={`/sponsors/${sponsor.id}`} key={sponsor.id} className="sponsor-card">
                            <div className="sponsor-logo-container">
                                <img src={sponsor.logo_url} alt={isAr ? sponsor.name_ar : sponsor.name_en} />
                            </div>
                            <div className="sponsor-info">
                                <h3>{isAr ? sponsor.name_ar : sponsor.name_en}</h3>
                                <p>{isAr ? sponsor.services_ar : sponsor.services_en}</p>
                                <div className="card-footer">
                                    <span>{isAr ? 'عرض الملف' : 'View Profile'}</span>
                                    <FiArrowRight />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-state">Loading Partners...</div>;

    return (
        <div className="sponsors-page">
            <div className="sponsors-hero">
                <h1>{isAr ? 'الرعاة' : 'Our Sponsors'}</h1>
                <p>{isAr ? 'نفخر بالتعاون مع كبرى الشركات والجهات الرياضية عالمياً' : 'We take pride in collaborating with leading companies and sports entities worldwide'}</p>
            </div>

            <div className="container">
                <TierSection 
                    title={isAr ? 'الشركاء الماسيون' : 'Diamond Partners'} 
                    sponsorsList={tiers.diamond} 
                    className="diamond-tier" 
                />
                <TierSection 
                    title={isAr ? 'الشركاء الذهبيون' : 'Gold Partners'} 
                    sponsorsList={tiers.gold} 
                    className="gold-tier" 
                />
                <TierSection 
                    title={isAr ? 'الشركاء الفضيون' : 'Silver Partners'} 
                    sponsorsList={tiers.silver} 
                    className="silver-tier" 
                />
                <TierSection 
                    title={isAr ? 'الشركاء الرسميون' : 'Official Partners'} 
                    sponsorsList={tiers.partner} 
                    className="standard-tier" 
                />
            </div>
        </div>
    );
};

export default SponsorsListing;
