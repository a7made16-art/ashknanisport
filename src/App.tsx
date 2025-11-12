import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Achievements from './components/Achievements';
import Deals from './components/Deals';
import Gallery from './components/Gallery';
import Documents from './components/Documents';
import Contact from './components/Contact';
import Footer from './components/Footer';
import PlayerSigning from './components/PlayerSigning'; 
import TransferMarket from './components/TransferMarket'; 
import AgentBenefits from './components/AgentBenefits'; 
import FloatingVideo from './components/FloatingVideo'; 
import ChatBot from './components/ChatBot';
import ConsultationBooking from './components/ConsultationBooking'; 
import WhatsAppButton from './components/WhatsAppButton';
import { Language, AppContent, LanguageContent } from './types';
import AshkaniChampionship from './components/AshkaniChampionship';
import { Analytics } from "@vercel/analytics/react"
import './styles/index.css'; 
import { Helmet } from "react-helmet";

function App() {
    const [language, setLanguage] = useState<Language>('ar');
    const [content, setContent] = useState<AppContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // دالة لجلب البيانات من الملف المحلي
    const fetchData = useCallback(async () => {
        setLoading(true);
        
        try {
            console.log('Fetching data from local file');
            const response = await fetch('/company.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: AppContent = await response.json();
            setContent(data);
        } catch (err) {
            console.error("Failed to load company data:", err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        document.documentElement.lang = language;
        document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    useEffect(() => {
        if (!content) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const sections = document.querySelectorAll('.section');
        sections.forEach((section) => {
            observer.observe(section);
        });

        return () => sections.forEach((section) => observer.unobserve(section));
    }, [content]);
    
    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'en' ? 'ar' : 'en');
    }, []);

    // استخدام useMemo لمنع إعادة التصيير غير الضروري
    const currentContent = useMemo(() => {
        if (!content) return null;
        return content[language];
    }, [content, language]);

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (error) {
        return <div className="error-container">Error loading data: {error}</div>;
    }

    if (!content) {
        return <div className="error-container">No data available</div>;
    }

    return (
        <>
            <Helmet>
            <title>شركة أشكناني سبورت - إدارة وتسويق الرياضيين بالعالم</title>
            <meta name="description" content="شركة أشكناني سبورت الكويتية لإدارة وتسويق الرياضيين، متخصصة في اللاعبين والمدربين والإداريين بجميع الرياضات منذ 2019." />
            <meta name="keywords" content="أشكناني سبورت, إدارة الرياضيين, التسويق الرياضي, الكويت, إدارة اللاعبين, sports management, athlete management, sports marketing, Kuwait" />
            <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} />
        </Helmet>

            <Header
                content={currentContent.header}
                language={language}
                toggleLanguage={toggleLanguage}
            />
            <main>
                <Hero content={currentContent.hero} />
                <About content={currentContent.about} />
                <AgentBenefits content={currentContent.agentBenefits} />
                <Services content={currentContent.services} language={language} /> 
                
                {/* حاوية الأقسام الجانبية (الإنجازات والعقود فقط) */}
                <div className="sections-grid-container">
                    <div className="sections-grid">
                        <Deals content={currentContent.deals} language={language} />
                        <Achievements content={currentContent.achievements} language={language} />
                    </div>
                </div>
                
                {/* معرض الصور منفصل تحت الأقسام الجانبية */}
                <Gallery content={currentContent.gallery} language={language} />
                <AshkaniChampionship 
                        content={currentContent.ashkaniChampionship} 
                        language={language} 
                    />    
                <PlayerSigning content={currentContent.playerSigning} language={language} />
                <ConsultationBooking content={currentContent.consultationBooking} language={language} />
            </main>
            <Footer 
                content={{
                    ...currentContent.footer, 
                    nav: currentContent.header.nav,
                    transferMarket: currentContent.transferMarket 
                }} 
            />
            
            <Analytics />
        </>
    );
}

export default App;