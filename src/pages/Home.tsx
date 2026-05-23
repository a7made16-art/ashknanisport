import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Achievements from '../components/Achievements';
import Deals from '../components/Deals';
import Gallery from '../components/Gallery';
import PlayerSigning from '../components/PlayerSigning';
import AgentBenefits from '../components/AgentBenefits';
import ConsultationBooking from '../components/ConsultationBooking';
import AshkaniChampionship from '../components/AshkaniChampionship';
import { Language, LanguageContent } from '../types';

import SponsorsSection from '../components/SponsorsSection';
import DiscountsSection from '../components/DiscountsSection';

interface HomeProps {
    currentContent: LanguageContent;
    language: Language;
}

const Home: React.FC<HomeProps> = ({ currentContent, language }) => {
    return (
        <main>
            <Hero content={currentContent.hero} language={language} />
            <About content={currentContent.about} />
            <AgentBenefits content={currentContent.agentBenefits} />
            <Services content={currentContent.services} language={language} />
            
            <DiscountsSection language={language} />

            <div className="sections-grid-container">
                <div className="sections-grid">
                    <Deals content={currentContent.deals} language={language} />
                    <Achievements content={currentContent.achievements} language={language} />
                </div>
            </div>

            <Gallery content={currentContent.gallery} language={language} />
            <AshkaniChampionship
                content={currentContent.ashkaniChampionship}
                language={language}
            />
            <PlayerSigning content={currentContent.playerSigning} language={language} />
            <ConsultationBooking content={currentContent.consultationBooking} language={language} />
            
            <SponsorsSection language={language} />
        </main>
    );
};

export default Home;
