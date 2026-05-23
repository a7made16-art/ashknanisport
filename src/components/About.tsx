import React, { useState } from 'react';
import { BsCheck2Circle } from 'react-icons/bs';
import { FaEye, FaTimes, FaAward } from 'react-icons/fa';

interface CredentialItem {
  text: string;
  image?: string;
}

const About = ({ content, language }: { content: any; language: string }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const openLightbox = (img: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxImage(img);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = 'auto';
  };

  const viewCertLabel = language === 'ar' ? 'عرض الشهادة' : 'View Cert';

  return (
    <>
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">
            {content.title_part1} <span>{content.title_part2}</span>
          </h2>
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
                {content.founder.credentials.map((item: string | CredentialItem, index: number) => {
                  const isRich = typeof item === 'object' && item !== null;
                  const text = isRich ? (item as CredentialItem).text : (item as string);
                  const image = isRich ? (item as CredentialItem).image : undefined;

                  return (
                    <li
                      key={index}
                      className={image ? 'credential-has-cert' : ''}
                    >
                      <BsCheck2Circle />
                      <span className="credential-text">{text}</span>
                      {image && (
                        <button
                          className="view-cert-badge"
                          onClick={(e) => openLightbox(image, e)}
                          aria-label={viewCertLabel}
                          title={viewCertLabel}
                        >
                          <FaEye />
                          <span>{viewCertLabel}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Lightbox */}
      {lightboxImage && (
        <div
          className="cert-lightbox-overlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={viewCertLabel}
        >
          <div className="cert-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="cert-lightbox-close"
              onClick={closeLightbox}
              aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <FaTimes />
            </button>
            <div className="cert-lightbox-header">
              <FaAward className="cert-lightbox-icon" />
              <span>
                {language === 'ar' ? 'شهادة حضور - سفراء السلام' : 'Attendance Certificate - Peace Ambassadors'}
              </span>
            </div>
            <div className="cert-lightbox-body">
              <img
                src={lightboxImage}
                alt={language === 'ar' ? 'شهادة حضور' : 'Attendance Certificate'}
                className="cert-lightbox-image"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default About;