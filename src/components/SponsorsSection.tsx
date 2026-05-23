import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sponsor, Language } from '../types';
import '../styles/sponsors-sections.css';

interface SponsorsSectionProps {
    language: Language;
}

const SponsorsSection: React.FC<SponsorsSectionProps> = ({ language }) => {
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
                console.error('Error fetching sponsors Section:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsors();
    }, []);

    if (loading || sponsors.length === 0) return null;

    return (
        <section className="sponsors-logos-section">
            <div className="container">
                <div className="section-header-centered">
                    <h2 className="section-title">
                        {isAr ? 'الرعاة' : 'Our Sponsors'}
                    </h2>
                </div>
                
                <div className="logos-scroll-container">
                    <div className="logos-wrapper">
                        {/* Duplicate lists for infinite scroll effect if needed, or just a grid */}
                        {sponsors.map(sponsor => (
                            <Link 
                                to={`/sponsors/${sponsor.id}`} 
                                key={sponsor.id} 
                                className="sponsor-logo-item"
                                title={isAr ? sponsor.name_ar : sponsor.name_en}
                            >
                                <img src={sponsor.logo_url} alt={isAr ? sponsor.name_ar : sponsor.name_en} />
                            </Link>
                        ))}
                    </div>
                </div>
                
                <div className="view-all-container">
                    <Link to="/sponsors" className="view-all-link">
                        {isAr ? 'مشاهدة جميع الشركاء' : 'View All Partners'}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default SponsorsSection;
