// src/components/ConsultationBooking.tsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Language } from '../types';

interface ConsultationBookingProps {
  content: {
    title: string;
    description: string;
    services: Array<{
      id: number;
      title: string;
      price: number | string;
      description: string;
    }>;
    workingHours: string;
    workingDays: string;
    form: {
      name: string;
      phone: string;
      service: string;
      date: string;
      time: string;
      submit: string;
    };
    contact: {
      address: string;
      phone: number;
      email: string;
      mapEmbedUrl: string;
    };
  };
  language: Language;
}

const ConsultationBooking: React.FC<ConsultationBookingProps> = ({ content, language }) => {
  
  // فحص أمان أولي
  if (!content || !content.contact) {
    return (
      <div className="consultation-booking">
        <div className="container">
          <div className="error-message">
            <p>{language === 'ar' ? 'بيانات الحجز غير متوفرة حالياً' : 'Booking data is currently unavailable'}</p>
          </div>
        </div>
      </div>
    );
  }

  // تعديل الحالة الافتراضية
const [formData, setFormData] = useState({
  name: '',
  phone: '',
  service: '',
  date: null as Date | null, // بدلاً من new Date()
  time: '',
});


  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
  });

  // إضافة حالة جديدة للرسالة
  const [bookingStatus, setBookingStatus] = useState<{
    type: 'idle' | 'checking' | 'error' | 'success';
    message: string;
  }>({
    type: 'idle',
    message: ''
  });

  // النصوص المترجمة حسب اللغة
  const translations = {
    ar: {
      officeTitle: 'مكتب الكابتن أحمد جابر أشكناني',
      errorName: 'الرجاء إدخال الاسم',
      errorPhone: 'الرجاء إدخال رقم الهاتف',
      errorPhoneInvalid: 'رقم الهاتف غير صحيح',
      errorService: 'الرجاء اختيار نوع الاستشارة',
      errorDate: 'الرجاء اختيار التاريخ',
      errorDatePast: 'لا يمكن اختيار تاريخ سابق',
      errorTime: 'الرجاء اختيار الوقت',
      checkingAvailability: 'جاري التحقق من توفر الموعد...',
      slotBooked: 'الميعاد محجوز بالفعل، اختر وقت آخر.',
      bookingSuccess: 'تم فتح واتساب لإتمام الحجز.',
      whatsappMessage: (name: string, phone: string, serviceTitle: string, priceText: string, date: string, time: string) => 
        `مرحباً، أود حجز استشارة مع الكابتن أحمد جابر أشكناني\n\nالاسم: ${name}\nرقم الهاتف: ${phone}\nنوع الاستشارة: ${serviceTitle}\nالسعر: ${priceText}\nالتاريخ: ${date}\nالوقت: ${time}\n\nالعنوان: ${content.contact.address}\nرابط الخريطة: https://maps.app.goo.gl/3Jb79urRoU7VGmi27`,
      whatsappButton: 'حجز عبر واتساب',
      mapPlaceholder: 'معلومات الخريطة غير متوفرة',
      selectService: 'اختر الاستشارة',
      selectTime: 'اختر الوقت',
      timeOptions: [
        { value: '10:00 صباحاً', label: '10:00 صباحاً' },
        { value: '11:00 صباحاً', label: '11:00 صباحاً' },
        { value: '12:00 ظهراً', label: '12:00 ظهراً' },
        { value: '5:00 مساءً', label: '5:00 مساءً' },
        { value: '6:00 مساءً', label: '6:00 مساءً' },
        { value: '7:00 مساءً', label: '7:00 مساءً' },
        { value: '8:00 مساءً', label: '8:00 مساءً' }
      ],
      saturdayTimeOptions: [
        { value: '4:00 مساءً', label: '4:00 مساءً' },
        { value: '5:00 مساءً', label: '5:00 مساءً' },
        { value: '6:00 مساءً', label: '6:00 مساءً' },
        { value: '7:00 مساءً', label: '7:00 مساءً' },
        { value: '8:00 مساءً', label: '8:00 مساءً' }
      ]
    },
    en: {
      officeTitle: 'Captain Ahmed Jaber Ashkanani Office',
      errorName: 'Please enter your name',
      errorPhone: 'Please enter your phone number',
      errorPhoneInvalid: 'Invalid phone number',
      errorService: 'Please select a consultation type',
      errorDate: 'Please select a date',
      errorDatePast: 'Cannot select a past date',
      errorTime: 'Please select a time',
      checkingAvailability: 'Checking appointment availability...',
      slotBooked: 'This time slot is already booked. Please choose another.',
      bookingSuccess: 'Opening WhatsApp to complete your booking.',
      whatsappMessage: (name: string, phone: string, serviceTitle: string, priceText: string, date: string, time: string) => 
        `Hello, I would like to book a consultation with Captain Ahmed Jaber Ashkanani\n\nName: ${name}\nPhone: ${phone}\nConsultation Type: ${serviceTitle}\nPrice: ${priceText}\nDate: ${date}\nTime: ${time}\n\nAddress: ${content.contact.address}\nMap Link: https://maps.app.goo.gl/3Jb79urRoU7VGmi27`,
      whatsappButton: 'Book via WhatsApp',
      mapPlaceholder: 'Map information is unavailable',
      selectService: 'Select Consultation',
      selectTime: 'Select Time',
      timeOptions: [
        { value: '10:00 AM', label: '10:00 AM' },
        { value: '11:00 AM', label: '11:00 AM' },
        { value: '12:00 PM', label: '12:00 PM' },
        { value: '5:00 PM', label: '5:00 PM' },
        { value: '6:00 PM', label: '6:00 PM' },
        { value: '7:00 PM', label: '7:00 PM' },
        { value: '8:00 PM', label: '8:00 PM' }
      ],
      saturdayTimeOptions: [
        { value: '4:00 PM', label: '4:00 PM' },
        { value: '5:00 PM', label: '5:00 PM' },
        { value: '6:00 PM', label: '6:00 PM' },
        { value: '7:00 PM', label: '7:00 PM' },
        { value: '8:00 PM', label: '8:00 PM' }
      ]
    }
  };

  // الحصول على الترجمات حسب اللغة المحددة
  const t = translations[language];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // إعادة تعيين حالة الحجز عند تغيير أي حقل
    if (bookingStatus.type !== 'idle') {
      setBookingStatus({ type: 'idle', message: '' });
    }
  };

  // دالة للتعامل مع تغيير التاريخ
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    
    setFormData(prev => ({ ...prev, date }));
    
    // إعادة تعيين الوقت عند تغيير التاريخ
    setFormData(prev => ({ ...prev, time: '' }));
    
    // مسح أي أخطاء متعلقة بالتاريخ
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
    
    // إعادة تعيين حالة الحجز
    if (bookingStatus.type !== 'idle') {
      setBookingStatus({ type: 'idle', message: '' });
    }
  };

  // دالة لتعطيل أيام الخميس والجمعة
const isDayDisabled = (date: Date) => {
   if (!date) return true;
  const day = date.getDay();

  // تعطيل الخميس (4) والجمعة (5)
  if (day === 4 || day === 5) return true;

  // إذا التاريخ اليوم نفسه
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    // الحصول على خيارات الوقت المتاحة اليوم
    const remainingTimeOptions = t.timeOptions.filter((opt) => {
      const match = opt.value.match(/(\d+):(\d+)/);
      if (!match) return true;

      let hour = parseInt(match[1]);
      const minute = parseInt(match[2] || '0');

      if (opt.value.includes('مساءً') || opt.value.includes('PM')) {
        if (hour < 12) hour += 12;
      } else if (opt.value.includes('صباحاً') || opt.value.includes('AM')) {
        if (hour === 12) hour = 0;
      }

      return hour > today.getHours() || (hour === today.getHours() && minute > today.getMinutes());
    });

    // لو مفيش أي وقت متاح اليوم، نمنع اختيار اليوم
    if (remainingTimeOptions.length === 0) return true;
  }

  return false;
};

  // الحصول على خيارات الوقت المناسبة حسب اليوم المختار
  const getTimeOptions = () => {
    if (!formData.date) return [];
  const selectedDay = formData.date.getDay();
  const today = new Date();
  const isToday =
    formData.date.getFullYear() === today.getFullYear() &&
    formData.date.getMonth() === today.getMonth() &&
    formData.date.getDate() === today.getDate();

  // اختيار قائمة الوقت حسب اليوم
  const options = selectedDay === 6 ? t.saturdayTimeOptions : t.timeOptions;

  // إذا التاريخ اليوم نفسه، استبعد الأوقات التي مضت
  if (isToday) {
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    return options.filter((opt) => {
      // تحويل الوقت إلى ساعة ودقيقة 24h
      const match = opt.value.match(/(\d+):(\d+)/);
      if (!match) return true;
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2] || '0');

      if (opt.value.includes('مساءً') || opt.value.includes('PM')) {
        if (hour < 12) hour += 12;
      } else if (opt.value.includes('صباحاً') || opt.value.includes('AM')) {
        if (hour === 12) hour = 0;
      }

      // مقارنة مع الوقت الحالي
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute) return true;
      return false; // الوقت مضى
    });
  }

  return options;
};


  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '', service: '', date: '', time: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = t.errorName;
      isValid = false;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t.errorPhone;
      isValid = false;
    } else if (!/^\d{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t.errorPhoneInvalid;
      isValid = false;
    }
    
    if (!formData.service) {
      newErrors.service = t.errorService;
      isValid = false;
    }
    
    if (!formData.date) {
      newErrors.date = t.errorDate;
      isValid = false;
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = t.errorDatePast;
        isValid = false;
      }
    }
    
    if (!formData.time) {
      newErrors.time = t.errorTime;
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const createWhatsAppLink = () => {
    const phoneNumber = "96597131223";
    const selectedService = formData.service ? content.services.find(s => s.id === parseInt(formData.service)) : null;
    
    // تنسيق التاريخ لعرضه - تعديل هنا لاستخدام التقويم الميلادي
    const day = formData.date.getDate();
    const month = formData.date.getMonth() + 1; // الشهر يبدأ من 0
    const year = formData.date.getFullYear();
    
    const formattedDate = language === 'ar' 
      ? `${day}/${month}/${year}` 
      : `${month}/${day}/${year}`;
    
    // تعديل طريقة عرض السعر
    let priceText = '';
    if (selectedService) {
      // التحقق إذا كان السعر رقمًا
      if (typeof selectedService.price === 'number' || (!isNaN(Number(selectedService.price)) && selectedService.price !== '')) {
        priceText = language === 'ar' 
          ? `${selectedService.price} دينار كويتي` 
          : `${selectedService.price} KWD`;
      } else {
        // إذا كان السعر نصًا (مثل "بدون رسوم" أو "no fees")
        priceText = selectedService.price.toString();
      }
    }
    
    const message = t.whatsappMessage(
      formData.name,
      formData.phone,
      selectedService ? selectedService.title : '',
      priceText,
      formattedDate,
      formData.time
    );
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // تعيين حالة التحقق من التوفر
    setBookingStatus({ type: 'checking', message: t.checkingAvailability });

    const selectedService = content.services.find(s => s.id === parseInt(formData.service));
    const startDateTime = new Date(formData.date);
    const timeParts = formData.time.match(/\d+/g);
    if (timeParts) {
      let hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1] || '0');
      
      // تحويل الوقت إلى 24 ساعة
      if (formData.time.includes('مساءً') || formData.time.includes('PM')) {
        if (hours < 12) hours += 12;
      } else if (formData.time.includes('صباحاً') || formData.time.includes('AM')) {
        if (hours === 12) hours = 0;
      }
      
      startDateTime.setHours(hours, minutes, 0, 0);
    }
    
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // ساعة واحدة
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwGx9O0GgxeU6UdHmxumeKkCK6zTSfTNcES4WRyAht-fIlOuSGA77sFTKEjeo_71cDmrg/exec', {
        method: 'POST',
        body: JSON.stringify({
          title: `موعد استشارة - ${formData.name}`,
          start: toKuwaitLocalISOString(startDateTime),
          end: toKuwaitLocalISOString(endDateTime),
          timezone: 'Asia/Kuwait', // إضافة التوقيت الصريح
        }),
      });

      const data = await response.json();
      if (data.available) {
        setBookingStatus({ type: 'success', message: t.bookingSuccess });
        window.open(createWhatsAppLink(), '_blank');
      } else {
        setBookingStatus({ type: 'error', message: t.slotBooked });
      }
    } catch (error) {
      setBookingStatus({ 
        type: 'error', 
        message: language === 'ar' 
          ? 'حدث خطأ أثناء التحقق من التوفر. يرجى المحاولة مرة أخرى.' 
          : 'An error occurred while checking availability. Please try again.'
      });
    }
  };

  // دالة لتحويل التاريخ إلى صيغة ISO مع الحفاظ على توقيت الكويت
  function toKuwaitLocalISOString(date: Date) {
    // إنشاء كائن تاريخ جديد بنفس القيم ولكن مع توقيت الكويت
    const kuwaitDate = new Date(date);
    
    // الحصول على المكونات المحلية
    const year = kuwaitDate.getFullYear();
    const month = String(kuwaitDate.getMonth() + 1).padStart(2, '0');
    const day = String(kuwaitDate.getDate()).padStart(2, '0');
    const hours = String(kuwaitDate.getHours()).padStart(2, '0');
    const minutes = String(kuwaitDate.getMinutes()).padStart(2, '0');
    const seconds = String(kuwaitDate.getSeconds()).padStart(2, '0');
    
    // إرجاع الصيغة المطلوبة مع تحديد المنطقة الزمنية
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+03:00`;
  }

  return (
    <section className="section consultation-booking" id="consultation-booking">
      <div className="container">
        <h2 className="section-title">{content.title}</h2>
        <p className="section-description">{content.description}</p>
        
        <div className="consultation-container">
          <div className="consultation-info">
            <div className="office-info">
              <h3>{t.officeTitle}</h3>
              <p>{content.workingDays}</p>
              <p>{content.workingHours}</p>
            </div>
            <div className="map-container">
              {content.contact?.mapEmbedUrl ? (
                <iframe
                  src={content.contact.mapEmbedUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ 
                    border: 0, 
                    width: '100%', 
                    height: '300px',
                    borderRadius: '8px'
                  }}
                  title={`Ashkanani Sport Location - ${content.contact?.address || ''}`}
                  aria-label={`Map showing location of Ashkanani Sport at ${content.contact?.address || ''}`}
                ></iframe>
              ) : (
                <div className="map-placeholder">
                  <p>{t.mapPlaceholder}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="booking-form-container">
            {/* عرض رسالة الحالة */}
            {bookingStatus.type !== 'idle' && (
              <div className={`booking-status ${bookingStatus.type}`}>
                <div className="status-message">
                  {bookingStatus.type === 'checking' && (
                    <div className="loading-spinner"></div>
                  )}
                  <p>{bookingStatus.message}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleWhatsAppSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="name">{content.form.name}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">{content.form.phone}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  required
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="service">{content.form.service}</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className={errors.service ? 'error' : ''}
                  required
                >
                  <option value="">{t.selectService}</option>
                  {content.services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.title} - { 
                          typeof service.price === 'number' || (!isNaN(Number(service.price)) && service.price !== '')
                            ? `${service.price} ${language === 'ar' ? 'دينار كويتي' : 'KWD'}` 
                            : service.price
                        }
                      </option>
                  ))}
                </select>
                {errors.service && <span className="error-message">{errors.service}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{content.form.date}</label>
                  <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  filterDate={(date) => !isDayDisabled(date)}
                  minDate={new Date()}
                  className={errors.date ? 'error' : ''}
                  placeholderText={language === 'ar' ? 'اختر التاريخ' : 'Select date'}
                  dateFormat={language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'}
                />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">{content.form.time}</label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className={errors.time ? 'error' : ''}
                    required
                  >
                    <option value="">{t.selectTime}</option>
                    {getTimeOptions().map((timeOption, index) => (
                      <option key={index} value={timeOption.value}>
                        {timeOption.label}
                      </option>
                    ))}
                  </select>
                  {errors.time && <span className="error-message">{errors.time}</span>}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="whatsapp-btn"
                  disabled={bookingStatus.type === 'checking'}
                >
                  <i className="fab fa-whatsapp"></i> {t.whatsappButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .booking-status {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .booking-status.checking {
          background-color: #e3f2fd;
          border-left: 4px solid #2196f3;
        }
        
        .booking-status.error {
          background-color: #ffebee;
          border-left: 4px solid #f44336;
        }
        
        .booking-status.success {
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
        }
        
        .status-message {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(33, 150, 243, 0.3);
          border-radius: 50%;
          border-top-color: #2196f3;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .whatsapp-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .react-datepicker__input-container input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .react-datepicker__input-container input.error {
          border-color: #f44336;
        }
      `}</style>
    </section>
  );
};

export default ConsultationBooking;