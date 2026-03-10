import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import func2url from '../../backend/func2url.json';
import CallbackModal from '@/components/CallbackModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const HERO_IMG = "https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/8897ef8f-c9f1-4baa-8f80-8c30691ace6c.jpeg";
const PROJECT_IMG = "https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/files/f58cf424-fa55-4a9a-b4e1-748eda347225.jpg";
const BLOCKS_IMG = "https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/files/0e364350-2f9f-43b4-ac89-786857994f60.jpg";
const WAREHOUSE_IMG = "https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/files/b0027a22-2ff1-4763-a903-80740aeb5c92.jpg";

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
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
    const el = ref.current;
    if (el) {
      el.querySelectorAll('.scroll-animate').forEach((child) => observer.observe(child));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function FlipCard({ frontImage, frontTitle, backTitle, backDescription, backImage, noBlur, clickable }: {
  frontImage: string;
  frontTitle: string;
  backTitle: string;
  backDescription: string;
  backImage?: string;
  noBlur?: boolean;
  clickable?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isImageBack = backImage && !backTitle;
  const canOpenModal = isImageBack || (clickable && backImage);

  const handleMouseLeaveCard = () => {
    if (!modalOpen) setFlipped(false);
  };

  const handleBackClick = () => {
    if (canOpenModal) setModalOpen(true);
  };

  return (
    <>
      <div
        className="flip-card h-[320px] md:h-[360px] cursor-pointer"
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={handleMouseLeaveCard}
      >
        <div
          className="flip-card-inner"
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s'
          }}
        >
          <div className="flip-card-front bg-white shadow-lg">
            <img src={frontImage} alt={frontTitle} className="w-full h-full object-cover" />
          </div>
          <div
            className={`flip-card-back shadow-lg overflow-hidden relative${canOpenModal ? ' cursor-zoom-in' : ''}`}
            onClick={handleBackClick}
          >
            <img src={backImage || frontImage} alt={backTitle} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'rgba(30,58,95,0.72)', backdropFilter: noBlur ? undefined : 'blur(6px)' }} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white text-center">
              <h3 className="font-bold text-xl mb-3">{backTitle}</h3>
              <p className="text-white/85 text-sm leading-relaxed">{backDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && canOpenModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setModalOpen(false); setFlipped(false); }}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={backImage}
              alt="Характеристики"
              className="rounded-xl shadow-2xl bg-white"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
            />
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              onClick={() => { setModalOpen(false); setFlipped(false); }}
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const REVIEWS_URL = func2url['reviews'];

function LeaveReviewForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars || !name.trim() || !text.trim()) return;
    setLoading(true);
    await fetch(REVIEWS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: name.trim(), text: text.trim(), stars }),
    });
    setLoading(false);
    setSent(true);
    onSubmitted?.();
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">🎉</div>
        <div className="font-semibold text-[#1E3A5F]">Спасибо за отзыв!</div>
        <div className="text-sm text-[#333]/50 mt-1">Он появится после проверки</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(s)}
          >
            <Icon
              name="Star"
              size={28}
              className={`transition-colors ${s <= (hovered || stars) ? 'text-[#E67E22] fill-[#E67E22]' : 'text-[#333]/20'}`}
            />
          </button>
        ))}
      </div>
      <Input
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-white border-[#1E3A5F]/15"
      />
      <Textarea
        placeholder="Ваш отзыв..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="bg-white border-[#1E3A5F]/15 resize-none"
      />
      <Button
        type="submit"
        disabled={!stars || !name.trim() || !text.trim() || loading}
        className="w-full bg-[#E67E22] hover:bg-[#d97218] text-white"
      >
        {loading ? 'Отправляем...' : 'Отправить отзыв'}
      </Button>
    </form>
  );
}

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bannerFlipped, setBannerFlipped] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const containerRef = useScrollAnimation();

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'О компании', id: 'trust' },
    { label: 'Товары', id: 'categories' },
    { label: 'Преимущества', id: 'why-vis' },
    { label: 'Услуги', id: 'services' },
    { label: 'Объекты', id: 'projects' },
    { label: 'Отзывы', id: 'reviews' },
    { label: 'Контакты', id: 'contacts' },
  ];

  const categories = [
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/47db70f8-7a47-48bb-9576-aa4ec318d8bc.jpg',
      frontTitle: '100 × 250 × 625 мм',
      backTitle: '',
      backDescription: '',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/5405b939-cb36-4587-af76-d17ca0398a8a.jpg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/e1581d27-d273-4779-9019-c4d051c844b1.jpg',
      frontTitle: '200 × 250 × 625 мм',
      backTitle: '',
      backDescription: '',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/6c442eeb-d949-4a79-a162-403edfab9204.jpg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/c7bd86f6-91d8-4185-afd7-d794efe5768f.jpg',
      frontTitle: '300 × 250 × 625 мм',
      backTitle: '',
      backDescription: '',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/5c1754e7-fc31-4e8f-915d-5c62d85e21d1.jpg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/ce6d4fc1-ef25-4529-bcb3-2e5931307d95.jpg',
      frontTitle: '400 × 250 × 625 мм',
      backTitle: '',
      backDescription: '',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/9a25da5c-3529-4b35-a7a4-93b7d2a31757.jpg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/7703afaa-ef76-478c-b772-61151620fbe7.jpg',
      frontTitle: 'Клей для газобетона',
      backTitle: '',
      backDescription: '',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/4ef59985-b755-4c2e-afed-91b94a402701.jpg',
    },
  ];

  const services = [
    { icon: 'Train', title: 'Ж/Д тупик', description: 'Собственный железнодорожный тупик для приёмки вагонов с материалами' },
    { icon: 'Truck', title: 'Доставка', description: 'Доставка по Приморскому краю и Дальнему Востоку' },
    { icon: 'Calculator', title: 'Расчёт материалов', description: 'Бесплатный выезд на замеры и помощь в расчёте необходимого количества материалов' },
    { icon: 'RefreshCw', title: 'Бесперебойная поставка', description: 'Стабильные поставки на объект по согласованному графику' },
  ];

  const projects = [
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/2b316a9f-dd27-4186-80d5-f14031da1d9d.jpeg',
      frontTitle: 'Объект 1',
      backTitle: 'Частный дом',
      backDescription: 'Поставка газобетона для строительства трёхэтажного частного дома с гаражом.',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/2b316a9f-dd27-4186-80d5-f14031da1d9d.jpeg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/51d898ff-06ce-4700-80cc-971341176291.jpeg',
      frontTitle: 'Объект 2',
      backTitle: 'Одноэтажный дом',
      backDescription: 'Поставка газобетонных блоков для строительства одноэтажного жилого дома.',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/51d898ff-06ce-4700-80cc-971341176291.jpeg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/a7bd0a15-d930-46e9-81fa-117f19da3fc3.jpeg',
      frontTitle: 'Объект 3',
      backTitle: 'Двухэтажный дом',
      backDescription: 'Газобетон для двухэтажного дома с мансардой и панорамными окнами.',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/a7bd0a15-d930-46e9-81fa-117f19da3fc3.jpeg',
    },
    {
      frontImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/44db49fc-c19d-461d-b8ba-f5f7fcc3a263.jpeg',
      frontTitle: 'Объект 4',
      backTitle: 'Коттедж',
      backDescription: 'Поставка стеновых блоков для строительства коттеджа с тёмными окнами.',
      backImage: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/44db49fc-c19d-461d-b8ba-f5f7fcc3a263.jpeg',
    },
  ];

  const staticReviews = [
    { company: 'СтройИнвест', author: 'Александр Петров', role: 'Директор', text: 'Работаем с ВИС уже 5 лет. Стабильные поставки, адекватные цены и всегда в наличии нужный ассортимент.', stars: 5 },
    { company: 'ДВ-Строй', author: 'Марина Ким', role: 'Начальник снабжения', text: 'Отличная логистика и оперативность. Материалы приходят точно в срок, качество подтверждено сертификатами.', stars: 5 },
    { company: 'ПримСтрой', author: 'Олег Волков', role: 'Прораб', text: 'Газобетон от ВИС — идеальная геометрия блоков. Кладка идёт быстро, расход клея минимальный.', stars: 5 },
  ];

  const [dbReviews, setDbReviews] = useState<{ id: number; author: string; company: string; role: string; text: string; stars: number }[]>([]);

  const loadReviews = () => {
    fetch(REVIEWS_URL)
      .then((r) => r.json())
      .then((data) => setDbReviews(data.reviews || []))
      .catch(() => {});
  };

  useEffect(() => { loadReviews(); }, []);

  const reviews = [
    ...dbReviews.map((r) => ({ company: r.company, author: r.author, role: r.role, text: r.text, stars: r.stars })),
    ...staticReviews,
  ];

  return (
    <>
    <div ref={containerRef} className="min-h-screen bg-[#F8F8F8]">
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/b7e4dd2d-de05-4a2e-b0d5-bcf1064e0acc.png"
              alt="ВИС"
              className="h-12 md:h-14 w-auto cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm font-medium transition-colors hover:text-[#E67E22] ${headerScrolled ? 'text-[#333]' : 'text-white/90'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCallbackOpen(true); if (typeof ym !== 'undefined') ym(107229043, 'reachGoal', 'click_order_call'); }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-[#4CAF50] text-[#4CAF50] bg-left bg-no-repeat btn-fill-hover transition-all duration-500 hover:text-white"
              style={{ backgroundImage: 'linear-gradient(#4CAF50, #4CAF50)', backgroundSize: '0% 100%', backgroundRepeat: 'no-repeat' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundSize = '100% 100%'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundSize = '0% 100%'; (e.currentTarget as HTMLButtonElement).style.color = '#4CAF50'; }}
            >
              <Icon name="PhoneCall" size={15} />
              Заказать звонок
            </button>
            <Button
              size="sm"
              className="bg-[#E67E22] hover:bg-[#d35400] text-white font-semibold hidden md:flex relative overflow-hidden ripple-btn"
              onClick={(e) => {
                const btn = e.currentTarget;
                const circle = document.createElement('span');
                const diameter = Math.max(btn.clientWidth, btn.clientHeight);
                const radius = diameter / 2;
                circle.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - btn.getBoundingClientRect().left - radius}px;top:${e.clientY - btn.getBoundingClientRect().top - radius}px;position:absolute;border-radius:50%;background:rgba(255,255,255,0.4);transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;`;
                btn.appendChild(circle);
                setTimeout(() => circle.remove(), 600);
                scrollTo('callback');
              }}
            >
              Получить расчёт
            </Button>
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={28} className={headerScrolled ? 'text-[#333]' : 'text-white'} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white shadow-lg border-t">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="block w-full text-left text-[#333] font-medium py-2 hover:text-[#E67E22] transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <a href="tel:+74232448010" className="block text-[#1E3A5F] font-semibold py-2">
                +7 (423) 244-80-10
              </a>
              <Button
                className="w-full bg-[#2d6a4f] text-white"
                onClick={() => { setCallbackOpen(true); setMobileMenuOpen(false); }}
              >
                Заказать звонок
              </Button>
              <Button className="w-full bg-[#E67E22] hover:bg-[#d35400] text-white" onClick={() => scrollTo('callback')}>
                Получить расчёт
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        className="relative min-h-screen flex items-end justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,58,95,0.82) 0%, rgba(30,58,95,0.55) 100%), url('${HERO_IMG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 text-center text-white pb-16 md:pb-24 pt-32">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in" style={{ fontFamily: 'Montserrat' }}>
            Автоклавный газобетон.
            <br />
            <span className="text-[#E67E22]">Дом, который дышит и греет</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/85 max-w-3xl mx-auto mb-8 animate-fade-in-delay-1">
            Гарантия качества в каждом блоке
          </p>

        </div>


      </section>

      {/* TRUST NUMBERS */}
      <section id="trust" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { number: 23, suffix: '+', label: 'Лет на рынке стройматериалов', icon: 'Calendar' },
              { number: 2000, suffix: '+', label: 'Объектов снабжено', icon: 'Building2' },
              { number: 5000, suffix: ' м²', label: 'Площадь складского комплекса', icon: 'Warehouse' },
              { number: 24, suffix: 'ч', label: 'От заявки до отгрузки', icon: 'Clock' },
            ].map((stat, i) => (
              <div key={i} className="scroll-animate text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl relative flex items-center justify-center overflow-hidden bg-[#1E3A5F]/5">
                  <div className="absolute bottom-0 left-0 right-0 h-0 bg-[#E67E22] transition-all duration-500 ease-out group-hover:h-full" />
                  <Icon name={stat.icon} size={28} className="text-[#1E3A5F] group-hover:text-white transition-colors duration-300 relative z-10" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-[#1E3A5F] mb-2" style={{ fontFamily: 'Montserrat' }}>
                  {stat.number === 24 ? '< ' : ''}<AnimatedCounter end={stat.number} suffix={stat.suffix} />
                </div>
                <p className="text-sm md:text-base text-[#333]/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-16 md:py-24 bg-[#F8F8F8]">
        <div className="w-full px-4 md:px-8">
          <div className="scroll-animate text-center mb-12 md:mb-16">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Каталог</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1E3A5F]" style={{ fontFamily: 'Montserrat' }}>Каталог газобетона</h2>
            <p className="text-[#333]/60 mt-4 max-w-xl mx-auto">
              Наведите на карточку, чтобы узнать подробности
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => (
              <div key={i} className="scroll-animate" style={{ transitionDelay: `${i * 0.1}s` }}>
                <FlipCard {...cat} noBlur clickable />
              </div>
            ))}
          </div>
          <div className="banner-roll-in w-full max-w-4xl px-4 mx-auto mt-12 animate-heartbeat">
            <div
              className="banner-flip-container relative"
              onMouseMove={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
                el.style.transition = 'transform 0.1s ease';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
                el.style.transition = 'transform 0.4s ease';
              }}
              onClick={() => {
                setBannerFlipped(!bannerFlipped);
                if (!bannerFlipped) {
                  const container = bannerRef.current;
                  if (container) {
                    const rect = container.getBoundingClientRect();
                    const colors = ['#E67E22', '#1E3A5F', '#FFD700', '#FF4444', '#44FF44', '#FF44FF', '#44FFFF', '#FFFFFF'];
                    for (let i = 0; i < 40; i++) {
                      const confetti = document.createElement('div');
                      confetti.className = 'confetti-piece';
                      confetti.style.left = `${rect.width / 2}px`;
                      confetti.style.top = `${rect.height / 2}px`;
                      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                      const angle = (Math.random() * 360) * (Math.PI / 180);
                      const distance = 80 + Math.random() * 250;
                      const tx = Math.cos(angle) * distance;
                      const ty = Math.sin(angle) * distance - Math.random() * 150;
                      const rot = Math.random() * 720 - 360;
                      const scale = 0.5 + Math.random() * 1.5;
                      confetti.style.animation = `confettiPop ${0.8 + Math.random() * 0.6}s ease-out forwards`;
                      confetti.style.transform = `translate(0,0) rotate(0deg) scale(${scale})`;
                      confetti.animate([
                        { transform: `translate(0,0) rotate(0deg) scale(${scale})`, opacity: 1 },
                        { transform: `translate(${tx}px,${ty}px) rotate(${rot}deg) scale(0)`, opacity: 0 }
                      ], { duration: 800 + Math.random() * 600, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
                      container.appendChild(confetti);
                      setTimeout(() => confetti.remove(), 1500);
                    }
                  }
                }
              }}
              ref={bannerRef}
            >
              <div className={`banner-flip-inner ${bannerFlipped ? 'flipped' : ''}`}>
                <div className="banner-flip-front">
                  <img src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/241760fa-144b-4952-bb7d-9be11b2e5f95.jpg" alt="Акция — газобетон 13 150 руб. м³" className="w-full h-auto rounded-2xl mx-0 px-0 py-[5px] my-0 object-contain" />
                </div>
                <div className="banner-flip-back">
                  <img src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/57727bda-9c18-43a4-a5c0-b9d6e85c337b.jpg" alt="Акции и предложения" className="w-full h-auto object-cover rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY VIS */}
      <section id="why-vis" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="scroll-animate text-center mb-8">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Почему выбирают нас</p>
          </div>
          {(() => {
            const imgs = [
              { src: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/9c4a9017-aa7d-4310-b677-354098a3ea03.jpg', alt: 'Почему выбирают нас' },
              { src: 'https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/9e2e8bef-3d4c-4a50-bf29-faa17aff20db.jpg', alt: 'ВИС — всё для стройки' },
            ];
            return (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {imgs.map((img, i) => (
                    <div
                      key={i}
                      className="scroll-animate rounded-2xl overflow-hidden h-[400px] cursor-zoom-in"
                      onClick={() => {
                        const overlay = document.createElement('div');
                        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn 0.2s ease';
                        const imgEl = document.createElement('img');
                        imgEl.src = img.src;
                        imgEl.alt = img.alt;
                        imgEl.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px;box-shadow:0 25px 60px rgba(0,0,0,0.5)';
                        overlay.appendChild(imgEl);
                        overlay.onclick = () => overlay.remove();
                        document.body.appendChild(overlay);
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-fill transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-16 md:py-24 bg-[#1E3A5F]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="scroll-animate text-center mb-12 md:mb-16">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Сервис</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white" style={{ fontFamily: 'Montserrat' }}>
              Наши услуги
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((srv, i) => (
              <div
                key={i}
                className="scroll-animate group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl relative flex items-center justify-center mb-5 overflow-hidden bg-[#E67E22]/20">
                  <div className="absolute bottom-0 left-0 right-0 h-0 bg-[#E67E22] transition-all duration-500 ease-out group-hover:h-full" />
                  <Icon name={srv.icon} size={26} className="text-[#E67E22] group-hover:text-white transition-colors duration-300 relative z-10" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{srv.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{srv.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="py-16 md:py-24 bg-[#F8F8F8]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="scroll-animate text-center mb-12 md:mb-16">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Портфолио</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1E3A5F]" style={{ fontFamily: 'Montserrat' }}>
              Выполненные объекты
            </h2>
            <p className="text-[#333]/60 mt-4 max-w-xl mx-auto">
              Наведите на карточку, чтобы увидеть детали поставки
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((proj, i) => (
              <div key={i} className="scroll-animate" style={{ transitionDelay: `${i * 0.1}s` }}>
                <FlipCard {...proj} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="scroll-animate text-center mb-12 md:mb-16">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Отзывы</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1E3A5F]" style={{ fontFamily: 'Montserrat' }}>
              Нам доверяют застройщики
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev, i) => (
              <Card
                key={i}
                className="scroll-animate border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 bg-[#F8F8F8]"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon key={s} name="Star" size={16} className="text-[#E67E22] fill-[#E67E22]" />
                    ))}
                  </div>
                  <p className="text-[#333]/80 leading-relaxed mb-5 text-sm">«{rev.text}»</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{rev.author[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-[#333] text-sm">{rev.author}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="scroll-animate mt-12">
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-4">
                <div className="reviews-widget-card animate-float bg-gradient-to-br from-[#fff7ed] to-[#fff] border border-[#E67E22]/20 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-md">
                  <div className="text-4xl font-extrabold text-[#E67E22] leading-none">4.7</div>
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {[1,2,3,4].map((s) => (
                        <Icon key={s} name="Star" size={18} className="text-[#E67E22] fill-[#E67E22]" />
                      ))}
                      <Icon name="StarHalf" size={18} className="text-[#E67E22] fill-[#E67E22]" />
                    </div>
                    <div className="text-xs text-[#333]/60 font-medium">Рейтинг на 2ГИС</div>
                  </div>
                </div>
                <div className="reviews-widget-card bg-gradient-to-br from-[#eef6ff] to-[#fff] border border-[#1E3A5F]/15 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-md">
                  <div className="text-4xl font-extrabold text-[#1E3A5F] leading-none">12</div>
                  <div>
                    <div className="text-sm font-semibold text-[#1E3A5F]">отзывов</div>
                    <div className="text-xs text-[#333]/60 font-medium">от реальных клиентов</div>
                  </div>
                </div>
                <div className="reviews-widget-card bg-gradient-to-br from-[#f0fdf4] to-[#fff] border border-green-200 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-md">
                  <div className="text-3xl">🏆</div>
                  <div>
                    <div className="text-sm font-semibold text-green-700">Лидер рынка</div>
                    <div className="text-xs text-[#333]/60 font-medium">Приморский край</div>
                  </div>
                </div>
              </div>
              <a
                href="https://go.2gis.com/JQ16X"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-[#E67E22] text-[#E67E22] font-semibold hover:bg-[#E67E22] hover:text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Читать отзывы на
                <img
                  src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/370186b7-a7aa-4b7a-bf11-24700d0b1526.png"
                  alt="2ГИС"
                  className="h-6 w-auto object-contain"
                />
              </a>
            </div>
          </div>

          {/* LEAVE REVIEW */}
          <div className="scroll-animate mt-12 max-w-xl mx-auto">
            <div className="bg-[#F8F8F8] rounded-2xl p-6 border border-[#1E3A5F]/10">
              <h3 className="text-lg font-bold text-[#1E3A5F] mb-1" style={{ fontFamily: 'Montserrat' }}>Оставить отзыв</h3>
              <p className="text-sm text-[#333]/50 mb-4">Поделитесь своим опытом работы с нами</p>
              <LeaveReviewForm onSubmitted={loadReviews} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA / CALLBACK FORM */}
      <section
        id="callback"
        className="py-16 md:py-24 relative"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,58,95,0.95) 0%, rgba(30,58,95,0.85) 100%), url('${PROJECT_IMG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="scroll-animate text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ fontFamily: 'Montserrat' }}>
                Получите расчёт
                <br />
                <span className="text-[#E67E22]">за 60 минут</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                Оставьте заявку — менеджер перезвонит, уточнит детали и подготовит индивидуальное коммерческое предложение.
              </p>
              <div className="space-y-4">
                {[
                  { icon: 'Clock', text: 'Ответ в течение 60 минут' },
                  { icon: 'FileText', text: 'Готовое КП с ценами и сроками' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E67E22]/20 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} size={16} className="text-[#E67E22]" />
                    </div>
                    <span className="text-white/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="scroll-animate">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl font-bold text-[#1E3A5F] mb-6" style={{ fontFamily: 'Montserrat' }}>
                    Оставить заявку
                  </h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFormStatus('loading');
                      try {
                        const res = await fetch(func2url['send-email'], {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(formData),
                        });
                        if (res.ok) {
                          setFormStatus('success');
                          setFormData({ name: '', phone: '', message: '' });
                        } else {
                          setFormStatus('error');
                        }
                      } catch {
                        setFormStatus('error');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Input
                        placeholder="Ваше имя"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 bg-[#F8F8F8] border-0 text-[#333] placeholder:text-[#333]/40"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Телефон"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 bg-[#F8F8F8] border-0 text-[#333] placeholder:text-[#333]/40"
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Что вам нужно? (материалы, объёмы, сроки)"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="bg-[#F8F8F8] border-0 text-[#333] placeholder:text-[#333]/40 min-h-[100px]"
                      />
                    </div>
                    {formStatus === 'success' && (
                      <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm font-medium">
                        Спасибо! Ваша заявка принята, мы свяжемся с вами в ближайшее время.
                      </div>
                    )}
                    {formStatus === 'error' && (
                      <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm font-medium">
                        Произошла ошибка. Пожалуйста, позвоните нам напрямую.
                      </div>
                    )}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={formStatus === 'loading'}
                      className="w-full bg-[#E67E22] hover:bg-[#d35400] text-white font-bold text-lg h-14 disabled:opacity-70"
                    >
                      {formStatus === 'loading' ? 'Отправляем...' : 'Получить расчёт за 60 минут'}
                    </Button>
                    <p className="text-xs text-center text-[#333]/40">
                      Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="scroll-animate text-center mb-12 md:mb-16">
            <p className="text-[#E67E22] font-semibold text-sm uppercase tracking-widest mb-3">Контакты</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1E3A5F]" style={{ fontFamily: 'Montserrat' }}>
              Свяжитесь с нами
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="scroll-animate space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
                  <span className="text-2xl icon-spin select-none">📍</span>
                </div>
                <div>
                  <div className="font-semibold text-[#333] mb-1">Адрес</div>
                  <div className="text-[#333]/60">г. Артём, ул. Вокзальная 114</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
                  <span className="text-2xl icon-spin select-none">📞</span>
                </div>
                <div>
                  <div className="font-semibold text-[#333] mb-1">Телефоны</div>
                  <a href="tel:+74232448010" className="block text-[#1E3A5F] hover:text-[#E67E22] transition-colors font-medium">
                    +7 (423) 244-80-10
                  </a>
                  <a href="https://max.ru/u/f9LHodD0cOJeqBIEYMN3NMyf-Hx85yqfnOpRApJuFQvoU_sOxqtkoeqraow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#1E3A5F] hover:text-[#E67E22] transition-colors font-medium mt-1">
                    +7 (914) 792-27-84 <span className="text-[#333]/40 text-sm">(Max)</span>
                    <img src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/7682a930-2e78-4941-9562-49c03023e6f2.png" alt="Max" className="w-5 h-5 object-contain flex-shrink-0" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
                  <span className="text-2xl icon-spin select-none">✉️</span>
                </div>
                <div>
                  <div className="font-semibold text-[#333] mb-1">Email</div>
                  <a href="mailto:vostokinveststal@mail.ru" className="text-[#1E3A5F] hover:text-[#E67E22] transition-colors font-medium">
                    vostokinveststal@mail.ru
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
                  <span className="text-2xl icon-spin select-none">🌐</span>
                </div>
                <div>
                  <div className="font-semibold text-[#333] mb-1">Сайт</div>
                  <a href="https://vi-stal.ru" target="_blank" rel="noopener noreferrer" className="text-[#1E3A5F] hover:text-[#E67E22] transition-colors font-medium">
                    vi-stal.ru
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
                  <span className="text-2xl icon-spin select-none">🕐</span>
                </div>
                <div>
                  <div className="font-semibold text-[#333] mb-1">Режим работы</div>
                  <div className="text-[#333]/60">Пн–Пт: 8:30–17:30</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://t.me/+79147922784"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center hover:bg-[#0088cc]/20 transition-colors group"
                >
                  <Icon name="Send" size={20} className="text-[#0088cc] group-hover:scale-110 transition-transform" />
                </a>
                <a
                  href="tel:+79147922784"
                  className="w-12 h-12 rounded-xl bg-[#E67E22]/10 flex items-center justify-center hover:bg-[#E67E22]/20 transition-colors group"
                >
                  <Icon name="PhoneCall" size={20} className="text-[#E67E22] group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            <div className="scroll-animate rounded-2xl overflow-hidden shadow-lg h-[400px]">
              <iframe
                src="https://yandex.ru/map-widget/v1/?text=%D0%92%D0%BE%D1%81%D1%82%D0%BE%D0%BA-%D0%98%D0%BD%D0%B2%D0%B5%D1%81%D1%82%D0%A1%D1%82%D0%B0%D0%BB%D1%8C&ll=132.183340%2C43.354430&z=16&mode=search&ol=biz"
                width="100%"
                height="100%"
                frameBorder="0"
                title="Карта"
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1E3A5F] text-white py-12">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img
                  src="https://cdn.poehali.dev/projects/53d4eefc-24fa-41e9-b99a-3ee269a34aaf/bucket/b7e4dd2d-de05-4a2e-b0d5-bcf1064e0acc.png"
                  alt="ВИС"
                  className="h-14 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Комплексное снабжение строительных объектов на Дальнем Востоке с 2003 года.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Навигация</h4>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="block text-white/50 hover:text-[#E67E22] transition-colors text-sm"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <div className="space-y-2 text-sm text-white/50">
                <div>г. Артём, ул. Вокзальная 114</div>
                <a href="tel:+74232448010" className="block hover:text-[#E67E22] transition-colors">
                  +7 (423) 244-80-10
                </a>
                <a href="tel:+79147922784" className="block hover:text-[#E67E22] transition-colors">
                  +7 (914) 792-27-84
                </a>
                <a href="mailto:vostokinveststal@mail.ru" className="block hover:text-[#E67E22] transition-colors">
                  vostokinveststal@mail.ru
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © 2003–2026 ВИС (Восток-ИнвестСталь). Все права защищены.
            </p>
            <button className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Политика конфиденциальности
            </button>
          </div>
        </div>
      </footer>
    </div>

    <CallbackModal isOpen={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </>
  );
};

export default Index;