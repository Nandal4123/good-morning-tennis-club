import { useState, useEffect } from "react";

// 테니스 명언들 (출처 제외)
const loadingMessages = [
  "테니스는 마음의 게임이다",
  "연습은 거짓말하지 않는다",
  "승리는 준비된 자에게 온다",
  "포기하지 않으면 기회는 온다",
  "자신을 믿어라, 그것이 시작이다",
  "작은 진보가 큰 승리를 만든다",
  "오늘의 땀이 내일의 실력이 된다",
  "실패는 성공의 어머니다",
  "즐기면 이미 이긴 것이다",
  "최선을 다하면 후회는 없다",
  "좋은 파트너가 좋은 경기를 만든다",
  "꾸준함이 재능을 이긴다",
  "오늘도 코트 위의 주인공은 나!",
  "함께하면 더 즐겁다",
  "테니스는 인생의 축소판이다",
];

// 테니스 팁
const tennisTips = [
  "💡 서브 전 깊은 호흡을 해보세요!",
  "💡 눈은 항상 공에 집중!",
  "💡 무릎을 살짝 굽히면 더 안정적!",
  "💡 꾸준한 연습이 실력을 만듭니다",
  "💡 파트너와 소통이 복식의 핵심!",
  "💡 경기 전 충분한 스트레칭!",
  "💡 물을 자주 마시세요!",
];

// 랜덤 인덱스 생성 (이전 인덱스와 다른 값)
const getRandomIndex = (prevIndex, length) => {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === prevIndex && length > 1);
  return newIndex;
};

export default function LoadingScreen() {
  // 초기값도 랜덤으로 설정
  const [messageIndex, setMessageIndex] = useState(() => 
    Math.floor(Math.random() * loadingMessages.length)
  );
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // 3초마다 랜덤 명언으로 변경
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => getRandomIndex(prev, loadingMessages.length));
    }, 3000);

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
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, #22c55e 1px, transparent 1px),
            linear-gradient(to bottom, #22c55e 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        />
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

        {/* 테니스 명언 */}
        <div className="h-16 mb-4 flex items-center justify-center">
          <p
            className="text-white text-base md:text-lg text-center whitespace-pre-line italic animate-fade-in-out px-4"
            key={messageIndex}
          >
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* 로딩 도트 애니메이션 */}
        <div className="flex justify-center gap-2 mb-6">
          <div
            className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-orange-400 animate-loading-dot"
            style={{ animationDelay: "300ms" }}
          />
        </div>

        {/* 팁 표시 (5초 후) */}
        {showTip && (
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 max-w-xs mx-auto animate-slide-up">
            <p className="text-slate-300 text-sm">{tennisTips[tipIndex]}</p>
          </div>
        )}
      </div>

      {/* 하단 텍스트 */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-500 text-xs">잠시만 기다려주세요...</p>
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
          15%, 85% {
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
          animation: fade-in-out 3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
