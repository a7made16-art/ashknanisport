import React, { useState, useRef, useEffect } from 'react';
import { FaFutbol, FaBullhorn, FaHandshake, FaAppleAlt, FaGavel, FaGlobe, FaBrain, FaDumbbell, FaCamera, FaTimes, FaPlay, FaVolumeUp, FaVolumeMute, FaPause, FaVideo } from 'react-icons/fa';

const iconMap = {
    FaFutbol: <FaFutbol />,
    FaBullhorn: <FaBullhorn />,
    FaHandshake: <FaHandshake />,
    FaAppleAlt: <FaAppleAlt />,
    FaGavel: <FaGavel />,
    FaGlobe: <FaGlobe />,
    FaBrain: <FaBrain />,
    FaDumbbell: <FaDumbbell />,
    FaCamera: <FaCamera />,
    FaVideo: <FaVideo />,
};

const Services = ({ content, language }) => {
    const [selectedService, setSelectedService] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const videoRef = useRef(null);

    const titlePart1 = language === 'en' ? 'Our' : 'خدمات';
    const titlePart2 = language === 'en' ? 'Services' : 'الشركة';

    const handleServiceClick = (service) => {
        console.log('Service clicked:', service);
        console.log('Before state update - isModalOpen:', isModalOpen);
        setSelectedService(service);
        setIsPlaying(false);
        setIsMuted(true);
        setVideoError(false);
        setIsModalOpen(true);
        console.log('After state update - isModalOpen:', isModalOpen);
        // منع التمرير فقط عند فتح النافذة
        document.body.style.overflow = 'hidden';
    };

    const handleCloseVideo = () => {
        console.log('Closing modal');
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setSelectedService(null);
        setIsPlaying(false);
        setVideoError(false);
        setIsModalOpen(false);
        // استعادة التمرير عند الإغلاق
        document.body.style.overflow = 'auto';
    };

    const handlePlayVideo = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            video.muted = false;
            video.play()
                .then(() => {
                    setIsPlaying(true);
                    setIsMuted(false);
                })
                .catch(error => {
                    console.log("Autoplay with sound failed, trying muted:", error);
                    video.muted = true;
                    video.play()
                        .then(() => {
                            setIsPlaying(true);
                            setIsMuted(true);
                        })
                        .catch(err => {
                            console.error("Video play failed:", err);
                            setVideoError(true);
                        });
                });
        }
    };

    const handlePauseVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleToggleMute = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            video.muted = !video.muted;
            setIsMuted(video.muted);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

    const handleVideoError = () => {
        console.error("Video error occurred");
        setVideoError(true);
    };

    // إعداد الفيديو عند الفتح
    useEffect(() => {
        if (selectedService && selectedService.videoUrl && videoRef.current) {
            const video = videoRef.current;
            video.load();
            video.muted = true;
        }
    }, [selectedService]);

    // التأكد من استعادة التمرير عند مغادرة المكون
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <>
            <section id="services" className="section" style={{backgroundColor: 'var(--primary-color)'}}>
                <div className="container">
                    <h2 className="section-title">{titlePart1} <span>{titlePart2}</span></h2>
                    <div className="grid-container">
                        {content.list.map((service, index) => (
                            <div 
                                key={index} 
                                className={`card ${service.videoUrl ? 'card-has-video' : ''}`}
                                onClick={() => handleServiceClick(service)}
                            >
                                <div className="card-icon">{iconMap[service.icon]}</div>
                                {service.videoUrl && (
                                    <div className="video-indicator">
                                        <FaPlay />
                                    </div>
                                )}
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* النافذة المنبثقة بدون Portal */}
            {isModalOpen && selectedService && (
                <div className="services-modal-overlay" onClick={handleCloseVideo}>
                    <div className="services-modal-container" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="services-modal-close"
                            onClick={handleCloseVideo}
                            aria-label="إغلاق"
                        >
                            <FaTimes />
                        </button>
                        
                        <div className="services-modal-header">
                            <h3>{selectedService.title}</h3>
                            <p>{selectedService.description}</p>
                        </div>
                        
                        <div className="services-modal-wrapper">
                            {selectedService.videoUrl ? (
                                videoError ? (
                                    <div className="services-modal-error">
                                        <div className="services-modal-error-icon">⚠️</div>
                                        <h3>عذراً، لا يمكن تشغيل الفيديو</h3>
                                        <p>قد يكون الفيديو غير متوفر أو بصيغة غير مدعومة</p>
                                        <button className="services-modal-retry-button" onClick={() => setVideoError(false)}>
                                            إعادة المحاولة
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="services-modal-player"
                                            onEnded={handleVideoEnded}
                                            onError={handleVideoError}
                                            playsInline
                                            preload="metadata"
                                        >
                                            <source src={selectedService.videoUrl} type="video/mp4" />
                                            <source src={selectedService.videoUrl.replace('.mov', '.mp4')} type="video/mp4" />
                                            <source src={selectedService.videoUrl.replace('.mov', '.webm')} type="video/webm" />
                                            متصفحك لا يدعم تشغيل الفيديو.
                                        </video>
                                        
                                        {!isPlaying && (
                                            <div className="services-modal-play-overlay" onClick={handlePlayVideo}>
                                                <div className="play-button">
                                                    <FaPlay />
                                                </div>
                                                <p>اضغط للتشغيل</p>
                                            </div>
                                        )}
                                        
                                        {isPlaying && (
                                            <div className="services-modal-controls">
                                                <button 
                                                    className="services-modal-control-button services-modal-play-pause-button"
                                                    onClick={handlePauseVideo}
                                                    aria-label="إيقاف مؤقت"
                                                >
                                                    <FaPause />
                                                </button>
                                                
                                                <button 
                                                    className="services-modal-control-button services-modal-mute-button"
                                                    onClick={handleToggleMute}
                                                    aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                                                >
                                                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )
                            ) : (
                                <div className="services-modal-details">
                                    {selectedService.imageUrl ? (
                                        <div className="services-modal-image">
                                            <img src={selectedService.imageUrl} alt={selectedService.title} />
                                        </div>
                                    ) : (
                                        <div className="services-modal-icon-large">{iconMap[selectedService.icon]}</div>
                                    )}
                                    <div className="services-modal-full-description">
                                        <p>{selectedService.description}</p>
                                        {selectedService.fullDescription && (
                                            <div className="services-modal-additional-details" style={{ whiteSpace: 'pre-line' }}>
                                                {selectedService.fullDescription}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Services;