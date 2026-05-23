import React from 'react';
import { BsCheck2Circle } from 'react-icons/bs';

const About = ({ content }) => (
    <section id="about" className="section">
        <div className="container">
            <h2 className="section-title">{content.title_part1} <span>{content.title_part2}</span></h2>
            <div className="about-content">
                <div className="about-intro">
                    <p>{content.p1}</p>
                    <p>{content.p2}</p>
                    <p>{content.p3}</p>
                </div>
                <div className="founder-profile">
                    <img 
                      src={content.founder.photo}
                      alt={content.founder.name} 
                      className="founder-photo"
                      loading="lazy"
                    />
                    <h3>{content.founder.name}</h3>
                    <p className="role">{content.founder.role}</p>
                    <ul>
                        {content.founder.credentials.map((item, index) => (
                            <li key={index}><BsCheck2Circle /> {item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

export default About;