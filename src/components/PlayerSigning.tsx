import React, { useState, useRef, useEffect } from 'react';
import { PlayerSigningContent } from '../types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PlayerSigningProps {
  content: PlayerSigningContent;
}

const PlayerSigning: React.FC<PlayerSigningProps> = ({ content,language }) => {
  const [activeTab, setActiveTab] = useState<string>('professional');
  const professionalAudioRef = useRef<HTMLAudioElement>(null);
  const individualAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<string>('');
  
  // حالة جديدة لتكبير الصور
  const [enlargedImage, setEnlargedImage] = useState<{
    src: string;
    alt: string;
    title: string;
    index: number;
    total: number;
    isDefault?: boolean; // إضافة خاصية للتعرف على الصورة الافتراضية
  } | null>(null);
  
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail.sectionId === 'player-signing') {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('switchTab', handler);
    return () => window.removeEventListener('switchTab', handler);
  }, []);

  // تحديد المرجع المناسب بناءً على التبويب النشط
  const getCurrentAudioRef = () => {
    switch (activeTab) {
      case 'professional':
        return professionalAudioRef;
      case 'individual':
        return individualAudioRef;
      default:
        return professionalAudioRef;
    }
  };

  // تحديد مصدر الصوت بناءً على التبويب النشط
  const getCurrentAudioSource = () => {
    switch (activeTab) {
      case 'professional':
        return content.professional.videoUrl;
      case 'individual':
        return content.individual.videoUrl;
      default:
        return content.professional.videoUrl;
    }
  };

  // تحديد عنوان الصوت بناءً على التبويب النشط
  const getCurrentAudioTitle = () => {
    switch (activeTab) {
      case 'professional':
        return content.professional.audiotitle;
      case 'individual':
        return content.individual.audiotitle;
      default:
        return content.audiotitle || "صوت";
    }
  };

  // توقف الصوت عند تبديل التبويبات
  useEffect(() => {
    const currentRef = getCurrentAudioRef();
    if (currentRef.current) {
      currentRef.current.pause();
      setIsPlaying(false);
      setCurrentAudio('');
    }
  }, [activeTab]);

  const togglePlayPause = () => {
    const currentRef = getCurrentAudioRef();
    const audioSource = getCurrentAudioSource();
    
    if (currentRef.current) {
      if (isPlaying && currentAudio === activeTab) {
        currentRef.current.pause();
        setIsPlaying(false);
      } else {
        // إذا كان هناك صوت قيد التشغيل من تبويب آخر، أوقفه
        if (currentAudio !== activeTab && currentAudio !== '') {
          const prevAudioRef = getCurrentAudioRef();
          if (prevAudioRef.current) {
            prevAudioRef.current.pause();
          }
        }
        
        // تحديث مصدر الصوت إذا تغير
        if (currentRef.current.src !== audioSource) {
          currentRef.current.src = audioSource;
          currentRef.current.load();
        }
        
        currentRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setCurrentAudio(activeTab);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  // دالة لفتح الصورة المكبرة
  const openEnlargedImage = (src: string, alt: string, title: string, index: number, total: number, isDefault = false) => {
    setEnlargedImage({ src, alt, title, index, total, isDefault });
    // منع التمرير عند فتح التكبير
    document.body.style.overflow = 'hidden';
  };

  // دالة لإغلاق الصورة المكبرة
  const closeEnlargedImage = () => {
    setEnlargedImage(null);
    // استعادة التمرير عند الإغلاق
    document.body.style.overflow = 'auto';
  };

  // دالة للتنقل بين الصور - معدلة لتطابق Deals
  const handlePrevImage = () => {
    if (!enlargedImage || enlargedImage.isDefault) return; // منع التنقل إذا كانت الصورة الافتراضية
    
    const gallery = activeTab === 'professional' 
      ? content.professional.gallery.images 
      : content.individual.gallery.images;
    
    const newIndex = (enlargedImage.index - 1 + gallery.length) % gallery.length;
    
    setEnlargedImage({
      src: gallery[newIndex],
      alt: `${activeTab === 'professional' ? content.professional.title : content.individual.title} ${newIndex + 1}`,
      title: activeTab === 'professional' ? content.professional.title : content.individual.title,
      index: newIndex,
      total: gallery.length,
      isDefault: false
    });
  };

  const handleNextImage = () => {
    if (!enlargedImage || enlargedImage.isDefault) return; // منع التنقل إذا كانت الصورة الافتراضية
    
    const gallery = activeTab === 'professional' 
      ? content.professional.gallery.images 
      : content.individual.gallery.images;
    
    const newIndex = (enlargedImage.index + 1) % gallery.length;
    
    setEnlargedImage({
      src: gallery[newIndex],
      alt: `${activeTab === 'professional' ? content.professional.title : content.individual.title} ${newIndex + 1}`,
      title: activeTab === 'professional' ? content.professional.title : content.individual.title,
      index: newIndex,
      total: gallery.length,
      isDefault: false
    });
  };
  
  // دالة لفتح المعرض مباشرة
  const openGallery = () => {
    const gallery = activeTab === 'professional' 
      ? content.professional.gallery.images 
      : content.individual.gallery.images;
    
    if (gallery.length > 0) {
      openEnlargedImage(
        gallery[0],
        `${activeTab === 'professional' ? content.professional.title : content.individual.title} 1`,
        activeTab === 'professional' ? content.professional.title : content.individual.title,
        0,
        gallery.length,
        false // هذه ليست الصورة الافتراضية
      );
    }
  };
  
  // نص الزر حسب اللغة
  const galleryButtonText = language === 'en' ? "View Top Signings" : "شاهد أبرز التوقيعات";
  
  // تحديد أيقونات الأسهم بناءً على اللغة - مثل Deals تماماً
  const getPrevIcon = () => {
    return language === 'en' ? <FaChevronLeft /> : <FaChevronRight />;
  };
  
  const getNextIcon = () => {
    return language === 'en' ? <FaChevronRight /> : <FaChevronLeft />;
  };
  
  return (
    <section className="section player-signing" id="player-signing">
      <div className="container">
        <h2 className="section-title">
          {content.title} <span>{content.highlight}</span>
        </h2>
        
        <div className="signing-tabs">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              {content.professional.title}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              {content.individual.title}
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'professional' && (
              <div className="tab-pane">
                <div className="signing-content">
                  <div className="signing-text">
                    <h3>{content.professional.title}</h3>
                    <p>{content.professional.description}</p>
                    <ul>
                      {content.professional.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="signing-media">

                    
                    {/* الصورة الافتراضية تحت الصوت */}
                    <div 
                      className="gallery-trigger-image card-image-container"
                      onClick={() => openEnlargedImage(
                        "/images/sign.jpg", // استبدل هذا بمسار الصورة الثابتة
                        "", 
                        "",
                        0,
                        1,
                        true // هذه هي الصورة الافتراضية
                      )}
                    >
                      <img 
                        src="/images/sign.jpg" // استبدل هذا بمسار الصورة الثابتة
                        alt="" 
                        className="card-image"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* الزر الجديد تحت الصورة */}
                    <button 
                      className="gallery-trigger-btn"
                      onClick={openGallery}
                    >
                      {galleryButtonText}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'individual' && (
              <div className="tab-pane">
                <div className="signing-content">
                  <div className="signing-text">
                    <h3>{content.individual.title}</h3>
                    <p>{content.individual.description}</p>
                    <ul>
                      {content.individual.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="signing-media">

                    
                    {/* الصورة الافتراضية تحت الصوت */}
                    <div 
                      className="gallery-trigger-image card-image-container"
                      onClick={() => openEnlargedImage(
                        "/images/sign.jpg", // استبدل هذا بمسار الصورة الثابتة
                        "", 
                        "",
                        0,
                        1,
                        true // هذه هي الصورة الافتراضية
                      )}
                    >
                      <img 
                        src="/images/sign.jpg" // استبدل هذا بمسار الصورة الثابتة
                        alt="" 
                        className="card-image"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* الزر الجديد تحت الصورة */}
                    <button 
                      className="gallery-trigger-btn"
                      onClick={openGallery}
                    >
                      {galleryButtonText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* تراكب الصورة المكبرة */}
      {enlargedImage && (
        <div 
          className="deals-enlarged-overlay" 
          onClick={closeEnlargedImage}
        >
          <div 
            className="deals-enlarged-container" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="deals-enlarged-close" 
              onClick={closeEnlargedImage}
              aria-label="إغلاق"
            >
              ✕
            </button>
            
            <img 
              src={enlargedImage.src} 
              className="deals-enlarged-image"
              loading="lazy"
            />
            
            
            {/* عرض أزرار التنقل فقط إذا لم تكن الصورة الافتراضية */}
            {!enlargedImage.isDefault && (
              <div className="deals-enlarged-controls">
                <button 
                  className="deals-enlarged-nav deals-enlarged-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="الصورة السابقة"
                >
                  {getPrevIcon()}
                </button>
                
                <div className="deals-enlarged-counter">
                  {enlargedImage.index + 1} / {enlargedImage.total}
                </div>
                
                <button 
                  className="deals-enlarged-nav deals-enlarged-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="الصورة التالية"
                >
                  {getNextIcon()}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  );
};

export default PlayerSigning;