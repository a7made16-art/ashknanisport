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
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({
        name: '',
        phone: '',
        birthYear: '',
        sport: '',
        competition: '',
        matches: [{ matchDate: '', firstTeam: '', secondTeam: '', matchVideoUrl: '' }],
        packageId: 'match1',
        includeLogo: true,
        notes: '',
    });
    const [matchPhotos, setMatchPhotos] = useState<File[]>([]);
    const [photoError, setPhotoError] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [orderSubmitError, setOrderSubmitError] = useState('');
    const [montagePaymentNotice, setMontagePaymentNotice] = useState('');
    const [paidMontageOrder, setPaidMontageOrder] = useState(null);
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

    const openMontageOrder = (event) => {
        event?.stopPropagation();
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setSelectedService(null);
        setIsModalOpen(false);
        setIsOrderModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeMontageOrder = () => {
        setIsOrderModalOpen(false);
        setPhotoError('');
        document.body.style.overflow = 'auto';
    };

    const handleOrderFieldChange = (event) => {
        const { name, value, checked, type } = event.target;
        setOrderForm((current) => {
            if (name !== 'packageId') {
                return { ...current, [name]: type === 'checkbox' ? checked : value };
            }
            const matchCount = { match1: 1, matches2: 2, matches3: 3, matches4: 4 }[value] || 1;
            return {
                ...current,
                packageId: value,
                matches: Array.from({ length: matchCount }, (_, index) =>
                    current.matches[index] || { matchDate: '', firstTeam: '', secondTeam: '', matchVideoUrl: '' }
                ),
            };
        });
    };

    const handleMatchFieldChange = (matchIndex, fieldName, value) => {
        setOrderForm((current) => ({
            ...current,
            matches: current.matches.map((match, index) =>
                index === matchIndex ? { ...match, [fieldName]: value } : match
            ),
        }));
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedPhotos: File[] = Array.from(event.currentTarget.files || []);
        setMatchPhotos(selectedPhotos);
        setPhotoError(
            selectedPhotos.length === 3 &&
                selectedPhotos.every((photo) => photo.type.startsWith('image/') && photo.size <= 10 * 1024 * 1024)
                ? ''
                : language === 'ar'
                    ? 'اختاري 3 صور بالضبط، حجم كل صورة لا يتجاوز 10 ميجابايت.'
                    : 'Choose exactly 3 images, each no larger than 10 MB.'
        );
    };

    const createMontageWhatsAppUrl = (order) => {
        const isArabic = order.language === 'ar';
        const lines = isArabic
            ? [
                'طلب مونتاج مباراة مدفوع',
                `رقم الطلب: ${order.reference}`,
                `الاسم: ${order.name}`,
                `رقم التواصل: ${order.phone}`,
                `سنة الميلاد: ${order.birthYear}`,
                `الباقة: ${order.packageTitle}`,
                `السعر الأساسي: ${order.baseAmount} د.ك`,
                `المبلغ: ${order.amount} د.ك`,
                `اللعبة: ${order.sport}`,
                `البطولة: ${order.competition}`,
                ...order.matches.flatMap((match, index) => [
                    `المباراة ${index + 1}: ${match.firstTeam} - ${match.secondTeam}`,
                    `تاريخها: ${match.matchDate}`,
                    `رابط المباراة كاملة: ${match.matchVideoUrl}`,
                ]),
                ...order.photos.map((photo, index) => `الصورة ${index + 1}: ${photo.secureUrl}`),
                `إضافة شعار أشكناني سبورت: ${order.includeLogo ? 'نعم' : 'لا'}`,
                `تفاصيل إضافية: ${order.notes || '-'}`,
            ]
            : [
                'Paid match editing order',
                `Order reference: ${order.reference}`,
                `Name: ${order.name}`,
                `Contact number: ${order.phone}`,
                `Birth year: ${order.birthYear}`,
                `Package: ${order.packageTitle}`,
                `Base price: ${order.baseAmount} KWD`,
                `Amount: ${order.amount} KWD`,
                `Sport: ${order.sport}`,
                `Competition: ${order.competition}`,
                ...order.matches.flatMap((match, index) => [
                    `Match ${index + 1}: ${match.firstTeam} - ${match.secondTeam}`,
                    `Date: ${match.matchDate}`,
                    `Full match link: ${match.matchVideoUrl}`,
                ]),
                ...order.photos.map((photo, index) => `Photo ${index + 1}: ${photo.secureUrl}`),
                `Include Ashkanani Sport logo: ${order.includeLogo ? 'Yes' : 'No'}`,
                `Additional details: ${order.notes || '-'}`,
            ];
        return `https://wa.me/96597131223?text=${encodeURIComponent(lines.join('\n'))}`;
    };

    const handleMontageOrderSubmit = async (event) => {
        event.preventDefault();
        if (
            matchPhotos.length !== 3 ||
            matchPhotos.some((photo) => !photo.type.startsWith('image/') || photo.size > 10 * 1024 * 1024)
        ) {
            setPhotoError(
                language === 'ar'
                    ? 'اختاري 3 صور بالضبط، حجم كل صورة لا يتجاوز 10 ميجابايت.'
                    : 'Choose exactly 3 images, each no larger than 10 MB.'
            );
            return;
        }

        setIsSubmittingOrder(true);
        setOrderSubmitError('');
        try {
            const uploadBatchId = crypto.randomUUID();
            const photos = await Promise.all(matchPhotos.map(async (photo, imageIndex) => {
                const signatureResponse = await fetch('/api/montage/upload-signature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uploadBatchId, imageIndex }),
                });
                const signatureData = await signatureResponse.json();
                if (!signatureResponse.ok) {
                    throw new Error(signatureData.error || 'Could not authorize image upload');
                }

                const uploadData = new FormData();
                uploadData.append('file', photo);
                uploadData.append('api_key', signatureData.apiKey);
                uploadData.append('timestamp', signatureData.timestamp);
                uploadData.append('public_id', signatureData.publicId);
                uploadData.append('overwrite', String(signatureData.overwrite));
                uploadData.append('signature', signatureData.signature);

                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureData.cloudName)}/image/upload`,
                    { method: 'POST', body: uploadData }
                );
                const uploaded = await uploadResponse.json();
                if (
                    !uploadResponse.ok ||
                    typeof uploaded.secure_url !== 'string' ||
                    uploaded.public_id !== signatureData.publicId
                ) {
                    throw new Error('Cloudinary image upload failed');
                }

                return {
                    name: photo.name,
                    publicId: uploaded.public_id,
                    secureUrl: uploaded.secure_url,
                };
            }));

            const response = await fetch('/api/montage/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderForm,
                    name: orderForm.name.trim(),
                    phone: orderForm.phone.trim(),
                    uploadBatchId,
                    photos,
                    language,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not start payment');
            if (
                typeof result.checkoutUrl !== 'string'
                || typeof result.orderToken !== 'string'
                || typeof result.reference !== 'string'
            ) throw new Error('Invalid UPayments checkout response');

            sessionStorage.setItem(`montage-order:${result.reference}`, result.orderToken);
            window.location.assign(result.checkoutUrl);
        } catch (error) {
            console.error('Montage checkout failed:', error);
            setOrderSubmitError(language === 'ar'
                ? 'تعذر رفع الصور أو بدء الدفع. قد تكون بعض الصور رُفعت بالفعل؛ يرجى المحاولة مجددًا.'
                : 'Could not upload the photos or start payment. Some photos may already have uploaded; please try again.');
            setIsSubmittingOrder(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentState = params.get('montagePayment');
        const reference = params.get('ref');
        if (!paymentState) return;

        const clearReturnParams = () => window.history.replaceState({}, '', window.location.pathname);
        if (paymentState === 'cancelled') {
            if (reference) sessionStorage.removeItem(`montage-order:${reference}`);
            setMontagePaymentNotice(language === 'ar'
                ? 'تم إلغاء الدفع ولم يتم تأكيد الطلب.'
                : 'Payment was cancelled. The order was not confirmed.');
            clearReturnParams();
            return;
        }

        if (paymentState !== 'success' || !reference) {
            setMontagePaymentNotice(language === 'ar'
                ? 'تعذر التحقق من حالة الدفع. يرجى التواصل معنا.'
                : 'Could not verify the payment. Please contact us.');
            clearReturnParams();
            return;
        }

        const orderToken = sessionStorage.getItem(`montage-order:${reference}`);
        if (!orderToken) {
            setMontagePaymentNotice(language === 'ar'
                ? 'تعذر العثور على تفاصيل الطلب بعد العودة من الدفع. يرجى التواصل معنا.'
                : 'Order details were not found after checkout. Please contact us.');
            clearReturnParams();
            return;
        }

        void (async () => {
            try {
                const response = await fetch('/api/montage/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trackId: params.get('track_id'),
                        reference,
                        orderToken,
                    }),
                });
                const result = await response.json();
                if (!response.ok || result.paid !== true || !result.order) {
                    throw new Error(result.error || 'Payment confirmation failed');
                }
                setPaidMontageOrder(result.order);
                setMontagePaymentNotice(language === 'ar'
                    ? 'تم تأكيد الدفع. اضغط لإرسال تفاصيل الطلب وروابط الصور عبر واتساب.'
                    : 'Payment confirmed. Send the order details and photo links on WhatsApp.');
                sessionStorage.removeItem(`montage-order:${reference}`);
            } catch (error) {
                console.error('Montage payment confirmation failed:', error);
                setMontagePaymentNotice(language === 'ar'
                    ? 'تعذر تأكيد الدفع تلقائيًا. يرجى التواصل معنا مع الاحتفاظ برقم الطلب.'
                    : 'Payment could not be verified automatically. Please contact us with your order reference.');
            } finally {
                clearReturnParams();
            }
        })();
    }, [language]);

    useEffect(() => {
        if (!isOrderModalOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeMontageOrder();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOrderModalOpen]);

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
                    {montagePaymentNotice && (
                        <div className="montage-payment-notice" role="status">
                            <p>{montagePaymentNotice}</p>
                            {paidMontageOrder && (
                                <a
                                    className="montage-order-submit"
                                    href={createMontageWhatsAppUrl(paidMontageOrder)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {language === 'ar' ? 'إرسال الطلب عبر واتساب' : 'Send order on WhatsApp'}
                                </a>
                            )}
                        </div>
                    )}
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
                                {service.icon === 'FaVideo' && (
                                    <button
                                        type="button"
                                        className="montage-order-button"
                                        onClick={openMontageOrder}
                                    >
                                        {language === 'ar' ? 'اطلب مونتاج المباراة' : 'Order Match Editing'}
                                    </button>
                                )}
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
                                        {selectedService.icon === 'FaVideo' && (
                                            <button
                                                type="button"
                                                className="montage-order-button"
                                                onClick={openMontageOrder}
                                            >
                                                {language === 'ar' ? 'اطلب مونتاج المباراة' : 'Order Match Editing'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isOrderModalOpen && (
                <div
                    className="montage-order-overlay"
                    onClick={closeMontageOrder}
                >
                    <section
                        className="montage-order-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="montage-order-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="services-modal-close"
                            onClick={closeMontageOrder}
                            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                        >
                            <FaTimes />
                        </button>
                        <h2 id="montage-order-title">
                            {language === 'ar' ? 'طلب مونتاج مباراة' : 'Match Editing Order'}
                        </h2>
                        <p className="montage-order-intro">
                            {language === 'ar'
                                ? 'الأسعار بالدينار الكويتي وتشمل شعار الشركة. عند طلب المونتاج بدون الشعار تُضاف 3 د.ك. أدخل بياناتك وارفع 3 صور.'
                                : 'Prices are in KWD and include the company logo. Removing the logo adds 3 KWD. Enter your details and upload 3 photos.'}
                        </p>
                        <form className="montage-order-form" onSubmit={handleMontageOrderSubmit}>
                            <div className="montage-order-fields">
                                <label>
                                    {language === 'ar' ? 'الاسم' : 'Name'}
                                    <input
                                        name="name"
                                        value={orderForm.name}
                                        onChange={handleOrderFieldChange}
                                        autoComplete="name"
                                        required
                                    />
                                </label>
                                <label>
                                    {language === 'ar' ? 'رقم التواصل' : 'Contact number'}
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={orderForm.phone}
                                        onChange={handleOrderFieldChange}
                                        autoComplete="tel"
                                        required
                                    />
                                </label>
                                <label>
                                    {language === 'ar' ? 'سنة الميلاد' : 'Birth year'}
                                    <input
                                        name="birthYear"
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        value={orderForm.birthYear}
                                        onChange={handleOrderFieldChange}
                                        required
                                    />
                                </label>
                                <label>
                                    {language === 'ar' ? 'اللعبة الرياضية' : 'Sport'}
                                    <input
                                        name="sport"
                                        value={orderForm.sport}
                                        onChange={handleOrderFieldChange}
                                        required
                                    />
                                </label>
                                <label>
                                    {language === 'ar' ? 'البطولة / المسابقة' : 'Competition'}
                                    <input
                                        name="competition"
                                        value={orderForm.competition}
                                        onChange={handleOrderFieldChange}
                                        required
                                    />
                                </label>
                                <label>
                                    {language === 'ar' ? 'الباقة والسعر' : 'Package and price'}
                                    <select
                                        name="packageId"
                                        value={orderForm.packageId}
                                        onChange={handleOrderFieldChange}
                                        required
                                    >
                                        <option value="match1">
                                            {language === 'ar' ? 'مباراة واحدة — 6 د.ك' : '1 match — 6 KWD'}
                                        </option>
                                        <option value="matches2">
                                            {language === 'ar' ? 'مباراتان — 12 د.ك' : '2 matches — 12 KWD'}
                                        </option>
                                        <option value="matches3">
                                            {language === 'ar' ? '3 مباريات — 20 د.ك' : '3 matches — 20 KWD'}
                                        </option>
                                        <option value="matches4">
                                            {language === 'ar' ? '4 مباريات — 26 د.ك' : '4 matches — 26 KWD'}
                                        </option>
                                    </select>
                                    <small>
                                        {language === 'ar'
                                            ? 'السعر يشمل شعار الشركة. بدون الشعار تُضاف 3 د.ك.'
                                            : 'Price includes the company logo. Removing it adds 3 KWD.'}
                                    </small>
                                </label>
                            </div>
                            <div className="montage-order-fields">
                                {orderForm.matches.map((match, index) => (
                                    <React.Fragment key={index}>
                                        <label>
                                            {language === 'ar' ? `تاريخ المباراة ${index + 1}` : `Match ${index + 1} date`}
                                            <input
                                                type="date"
                                                value={match.matchDate}
                                                onChange={(event) => handleMatchFieldChange(index, 'matchDate', event.target.value)}
                                                required
                                            />
                                        </label>
                                        <label>
                                            {language === 'ar' ? `الفريقان في المباراة ${index + 1}` : `Teams in match ${index + 1}`}
                                            <div className="montage-team-fields">
                                                <input
                                                    aria-label={language === 'ar' ? `الفريق الأول للمباراة ${index + 1}` : `First team in match ${index + 1}`}
                                                    value={match.firstTeam}
                                                    onChange={(event) => handleMatchFieldChange(index, 'firstTeam', event.target.value)}
                                                    required
                                                />
                                                <input
                                                    aria-label={language === 'ar' ? `الفريق الثاني للمباراة ${index + 1}` : `Second team in match ${index + 1}`}
                                                    value={match.secondTeam}
                                                    onChange={(event) => handleMatchFieldChange(index, 'secondTeam', event.target.value)}
                                                    required
                                                />
                                            </div>
                                        </label>
                                        <label className="montage-match-link">
                                            {language === 'ar' ? `رابط المباراة كاملة ${index + 1}` : `Full match ${index + 1} link`}
                                            <input
                                                type="url"
                                                value={match.matchVideoUrl}
                                                onChange={(event) => handleMatchFieldChange(index, 'matchVideoUrl', event.target.value)}
                                                placeholder="https://"
                                                required
                                            />
                                        </label>
                                    </React.Fragment>
                                ))}
                            </div>
                            <label className="montage-photo-field">
                                {language === 'ar' ? 'اختر 3 صور من الملعب' : 'Choose 3 photos from the match'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoChange}
                                    aria-describedby="montage-photo-help"
                                    required
                                />
                                <span id="montage-photo-help">
                                    {matchPhotos.length === 3
                                        ? matchPhotos.map((photo) => photo.name).join('، ')
                                        : language === 'ar'
                                            ? `تم اختيار ${matchPhotos.length} من 3 صور (حد أقصى 10 ميجابايت للصورة)`
                                            : `${matchPhotos.length} of 3 photos selected (10 MB max each)`}
                                </span>
                                {photoError && <span className="montage-photo-error">{photoError}</span>}
                            </label>
                            <label className="montage-logo-option">
                                <input
                                    type="checkbox"
                                    name="includeLogo"
                                    checked={orderForm.includeLogo}
                                    onChange={handleOrderFieldChange}
                                />
                                {language === 'ar'
                                    ? 'إضافة شعار أشكناني سبورت (بدون الشعار تُضاف 3 د.ك)'
                                    : 'Include Ashkanani Sport logo (add 3 KWD to remove the logo)'}
                            </label>
                            <label>
                                {language === 'ar' ? 'تفاصيل أو طلبات إضافية' : 'Additional details or requests'}
                                <textarea
                                    name="notes"
                                    value={orderForm.notes}
                                    onChange={handleOrderFieldChange}
                                    rows={4}
                                />
                            </label>
                            {orderSubmitError && <p className="montage-photo-error" role="alert">{orderSubmitError}</p>}
                            <button type="submit" className="montage-order-submit" disabled={isSubmittingOrder}>
                                {isSubmittingOrder
                                    ? (language === 'ar' ? 'جارٍ تحويلك للدفع...' : 'Starting secure checkout...')
                                    : (language === 'ar' ? 'الدفع عبر UPayments' : 'Pay with UPayments')}
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
};

export default Services;