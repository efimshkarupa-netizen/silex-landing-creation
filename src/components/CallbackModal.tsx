import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import func2url from '../../backend/func2url.json';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFD700', '#FF6B6B', '#74B9FF', '#A29BFE', '#FD79A8'];
  const particles: {x:number;y:number;vx:number;vy:number;color:string;size:number;rotation:number;rotSpeed:number;opacity:number}[] = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    });
  }

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.rotation += p.rotSpeed;
      if (frame > 60) p.opacity -= 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (particles.some((p) => p.opacity > 0)) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  };
  requestAnimationFrame(animate);
}

export default function CallbackModal({ isOpen, onClose }: CallbackModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{name?:string;email?:string;phone?:string}>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(''); setEmail(''); setPhone('');
      setErrors({}); setSuccess(false); setLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const e: {name?:string;email?:string;phone?:string} = {};
    if (!name.trim()) e.name = 'Введите имя';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Введите корректный email';
    if (!phone.trim()) e.phone = 'Введите телефон';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await fetch((func2url as Record<string,string>)['send-email'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message: 'Заявка на обратный звонок' }),
      });
      setSuccess(true);
      launchConfetti();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
        >
          ×
        </button>

        {!success ? (
          <>
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Заказать звонок</h2>
            <p className="text-gray-500 text-sm mb-6">Заполните форму — мы перезвоним в течение 15 минут</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Ваше имя *"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(prev => ({...prev, name: undefined})); }}
                  className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#4CAF50] ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Электронная почта *"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: undefined})); }}
                  className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#4CAF50] ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Телефон *"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({...prev, phone: undefined})); }}
                  className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#4CAF50] ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4CAF50] text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-[#388E3C] disabled:opacity-60 mt-2"
              >
                {loading ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 animate-slideUp">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-3">Спасибо, что обратились к нам!</h2>
            <p className="text-gray-500">С Вами свяжутся в ближайшее время</p>
            <button
              onClick={onClose}
              className="mt-6 text-sm text-[#4CAF50] hover:underline"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
