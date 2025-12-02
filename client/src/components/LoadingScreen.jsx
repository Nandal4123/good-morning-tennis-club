import { useState, useEffect } from "react";

// 재미있는 로딩 메시지들
const loadingMessages = [
  "🎾 라켓 준비 중...",
  "🏃 코트로 달려가는 중...",
  "👟 운동화 끈 묶는 중...",
  "🔍 테니스공 찾는 중...",
  "💪 워밍업 하는 중...",
  "☀️ 좋은 아침이에요!",
  "🎯 서브 연습 중...",
  "🏆 오늘의 승자는 누구?",
  "🌟 컨디션 체크 중...",
  "📊 전적 불러오는 중...",
  "🤝 파트너 찾는 중...",
  "⚡ 에너지 충전 중...",
  "🎉 오늘도 화이팅!",
  "🧘 스트레칭 하는 중...",
  "📱 데이터 로딩 중...",
];

// 테니스 팁/명언
const tennisTips = [
  "💡 서브 전 깊은 호흡을 해보세요!",
  "💡 눈은 항상 공에 집중!",
  "💡 무릎을 살짝 굽히면 더 안정적!",
  "💡 꾸준한 연습이 실력을 만듭니다",
  "💡 파트너와 소통이 복식의 핵심!",
];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // 2초마다 메시지 변경
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // 5초 후 팁 표시
    const tipTimeout = setTimeout(() => {
      setShowTip(true);
      setTipIndex(Math.floor(Math.random() * tennisTips.length));
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(tipTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* 테니스 코트 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #22c55e 1px, transparent 1px),
            linear-gradient(to bottom, #22c55e 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 text-center">
        {/* 통통 튀는 테니스 공 */}
        <div className="relative h-32 mb-8">
          <div className="tennis-ball absolute left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/30 flex items-center justify-center text-3xl animate-bounce-ball">
              🎾
            </div>
          </div>
          
          {/* 공 그림자 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-sm animate-shadow" />
        </div>

        {/* 클럽 로고 */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
          Good Morning Club
        </h1>
        <p className="text-orange-400 text-sm mb-8">테니스 동호회</p>

        {/* 로딩 메시지 */}
        <div className="h-8 mb-4">
          <p className="text-white text-lg animate-fade-in-out" key={messageIndex}>
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* 로딩 도트 애니메이션 */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot" style={{ animationDelay: '300ms' }} />
        </div>

        {/* 팁 표시 (5초 후) */}
        {showTip && (
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 max-w-xs mx-auto animate-slide-up">
            <p className="text-slate-300 text-sm">
              {tennisTips[tipIndex]}
            </p>
          </div>
        )}
      </div>

      {/* 하단 텍스트 */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-500 text-xs">
          잠시만 기다려주세요...
        </p>
      </div>

      {/* 커스텀 애니메이션 스타일 */}
      <style>{`
        @keyframes bounce-ball {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-60px);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        @keyframes shadow {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scale(0.6);
            opacity: 0.1;
          }
        }
        
        @keyframes loading-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
        }
        
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          20%, 80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-ball {
          animation: bounce-ball 0.8s infinite;
        }
        
        .animate-shadow {
          animation: shadow 0.8s infinite;
        }
        
        .animate-loading-dot {
          animation: loading-dot 1s infinite;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

