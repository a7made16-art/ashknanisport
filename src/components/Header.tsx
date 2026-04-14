import React, { useState, useEffect } from 'react';

interface HeaderProps {
    content: {
        nav: {
            about: string;
            services: string;
            achievements: string;
            deals: string;
            gallery: string;
            documents: string;
            contact: string;
            home: string;
            agentBenefits: string;
            playerSigning: string;
            AshknaniChampionship:string;
        };
        transferButton: string;
        lang_toggle: string;
    };
    language: 'en' | 'ar';
    toggleLanguage: () => void;
}

const Header: React.FC<HeaderProps> = ({ content, language, toggleLanguage }) => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        if (!menuOpen) setOpenDropdown(null);
    };

    const closeMenu = () => {
        setMenuOpen(false);
        setOpenDropdown(null);
    };

    const toggleDropdown = (dropdownName: string) => {
        if (openDropdown === dropdownName) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownName);
        }
    };

    const scrollToSection = (sectionId: string, tab?: string) => {
        closeMenu();

        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = document.querySelector('.header')?.clientHeight || 0;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
            });

            // لو فيه تاب بعتاه بالباراميتر
            if (tab) {
            // نخزن التاب في localStorage أو window.event
            window.dispatchEvent(new CustomEvent('switchTab', { detail: { sectionId, tab } }));
            }
        }
        };


    return (
        <header className={`header ${scrolled ? 'scrolled' : ''}`}>
            <nav className="nav">
                <div className="nav-container">
                    <a href="#hero" className="nav-logo" onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('hero');
                    }}>
                         <img src="/images/logo.png" alt="Ashkanani Sport Marketing Logo" loading="lazy"/>
                    </a>
                    
                    <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                         <ul className="nav-links">
                            <li><a href="#hero" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('hero');
                            }}>{content.nav.home}</a></li>
                            <li><a href="#about" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('about');
                            }}>{content.nav.about}</a></li>
                            <li><a href="#agent-benefits" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('agent-benefits');
                            }}>{content.nav.agentBenefits}</a></li>
                            <li><a href="#services" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('services');
                            }}>{content.nav.services}</a></li>
                            
                            {/* روابط مباشرة للشاشات الكبيرة */}
                            <li className="desktop-only">
                                <a href="#achievements" onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection('achievements');
                                }}>{content.nav.achievements}</a>
                            </li>
                            <li className="desktop-only">
                                <a href="#gallery" onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection('gallery');
                                }}>{content.nav.gallery}</a>
                            </li>
                            <li className="desktop-only">
                                <a href="#player-signing" onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection('player-signing');
                                }}>{content.nav.playerSigning}</a></li>

                            
                            {/* قوائم منسدلة للموبايل فقط */}
                            <li className="nav-dropdown mobile-only">
                                <button 
                                    className="nav-dropdown-toggle" 
                                    onClick={() => toggleDropdown('achievements-deals')}
                                >
                                    {language === 'en' ? 'Deals & Honors' : '  الصفقات و التكريمات'}
                                    <span className={`dropdown-arrow ${openDropdown === 'achievements-deals' ? 'open' : ''}`}></span>
                                </button>
                                <ul className={`nav-dropdown-menu ${openDropdown === 'achievements-deals' ? 'open' : ''}`}>
                                    <li><a href="#deals" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('deals');
                                    }}>{language === 'en' ? 'Deals' : 'الصفقات'}</a></li>
                                    <li><a href="#achievements" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('achievements');
                                    }}>{language === 'en' ? 'Honors' : 'التكريمات'}</a></li>
                                </ul>
                            </li>
                            
                            <li className="nav-dropdown mobile-only">
                                <button 
                                    className="nav-dropdown-toggle" 
                                    onClick={() => toggleDropdown('gallery')}
                                >
                                    {content.nav.gallery}
                                    <span className={`dropdown-arrow ${openDropdown === 'gallery' ? 'open' : ''}`}></span>
                                </button>
                                <ul className={`nav-dropdown-menu ${openDropdown === 'gallery' ? 'open' : ''}`}>
                                    <li><a href="#gallery" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('gallery','photos');
                                    }}>{language === 'en' ? 'Photos' : 'الصور'}</a></li>
                                    <li><a href="#gallery" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('gallery','videos');
                                    }}>{language === 'en' ? 'Videos' : 'الفيديوهات'}</a></li>
                                </ul>
                            </li>
                            
                            <li className="nav-dropdown mobile-only">
                                <button 
                                    className="nav-dropdown-toggle" 
                                    onClick={() => toggleDropdown('player-signing')}
                                >
                                    {content.nav.playerSigning}
                                    <span className={`dropdown-arrow ${openDropdown === 'player-signing' ? 'open' : ''}`}></span>
                                </button>
                                <ul className={`nav-dropdown-menu ${openDropdown === 'player-signing' ? 'open' : ''}`}>
                                    <li><a href="#player-signing" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('player-signing','professional');
                                    }}>{language === 'en' ? 'Player & Coach Signing' : 'توقيع اللاعب او المدرب' }</a></li>
                                    <li><a href="#player-signing" onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('player-signing','individual');
                                    }}>{language === 'en' ? 'Individual Players' : 'لاعبو الألعاب الفردية'}</a></li>
                                </ul>
                            </li>
                            <li><a href="#ashkani-championship" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('ashkani-championship');
                            }}>{content.nav.AshknaniChampionship}</a></li>
                            <li><a href="#consultation-booking" onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('consultation-booking');
                            }}>{content.nav.contact}</a></li>

                        </ul>
                        
                        <a 
                            href="https://ashkananisport.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="official-btn"
                        >
                            {language === 'en' ? 'Official Website' : 'الموقع الرسمي'}
                        </a>

                        <a 
                            href="https://ashkananitransfer.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="transfer-btn"
                        >
                            {content.transferButton}
                        </a>

                        <button onClick={() => { toggleLanguage(); closeMenu(); }} className="lang-switcher">
                            {language === 'en' ? 'ع' : 'EN'}
                        </button>
                    </div>
                </div>
                
                <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                    <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
                </button>
            </nav>
        </header>
    );
};

export default Header;

