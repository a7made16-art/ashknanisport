import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingVideo from './components/FloatingVideo'; 
import ChatBot from './components/ChatBot';
import WhatsAppButton from './components/WhatsAppButton';
import { Language, AppContent } from './types';
import { Analytics } from "@vercel/analytics/react"
import './styles/index.css'; 
import { Helmet } from "react-helmet";
import Home from './pages/Home';
import SponsorsListing from './pages/SponsorsListing';
import SponsorProfile from './pages/SponsorProfile';

function App() {
    const [language, setLanguage] = useState<Language>('ar');
    const [content, setContent] = useState<AppContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/company.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    
    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'en' ? 'ar' : 'en');
    }, []);

    const currentContent = useMemo(() => {
        if (!content) return null;
        return content[language];
    }, [content, language]);

    if (loading) return <div className="loading-container">Loading...</div>;
    if (error) return <div className="error-container">Error loading data: {error}</div>;
    if (!content || !currentContent) return <div className="error-container">No data available</div>;

    return (
        <Router>
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
            
            <Routes>
                <Route path="/" element={<Home currentContent={currentContent} language={language} />} />
                <Route path="/sponsors" element={<SponsorsListing language={language} />} />
                <Route path="/sponsors/:id" element={<SponsorProfile language={language} />} />
            </Routes>

            <Footer 
                content={{
                    ...currentContent.footer, 
                    nav: currentContent.header.nav,
                    transferMarket: currentContent.transferMarket 
                }} 
            />
            
            <Analytics />
            <WhatsAppButton />
            <FloatingVideo />
            <ChatBot />
        </Router>
    );
}

export default App;