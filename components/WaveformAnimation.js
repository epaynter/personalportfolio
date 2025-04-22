import React from 'react';

const WaveformAnimation = () => {
  // Define base heights for 8 bars with a natural wave pattern
  const barHeights = [
    'h-6',   // 1.5rem
    'h-8',   // 2rem
    'h-10',  // 2.5rem
    'h-12',  // 3rem
    'h-12',  // 3rem
    'h-10',  // 2.5rem
    'h-8',   // 2rem
    'h-6',   // 1.5rem
  ];

  // Define staggered delays for fluid wave motion
  const animationDelays = [
    'delay-[0ms]',
    'delay-[150ms]',
    'delay-[300ms]',
    'delay-[450ms]',
    'delay-[600ms]',
    'delay-[750ms]',
    'delay-[900ms]',
    'delay-[1050ms]',
  ];
  
  // Define subtle gradient backgrounds
  const gradientBackgrounds = [
    'bg-gradient-to-b from-blue-400 to-blue-600',
    'bg-gradient-to-b from-blue-500 to-blue-700',
    'bg-gradient-to-b from-blue-400 to-blue-600',
    'bg-gradient-to-b from-blue-500 to-blue-700',
    'bg-gradient-to-b from-blue-400 to-blue-600',
    'bg-gradient-to-b from-blue-500 to-blue-700',
    'bg-gradient-to-b from-blue-400 to-blue-600',
    'bg-gradient-to-b from-blue-500 to-blue-700',
  ];
  
  return (
    <div className="flex items-end justify-center gap-1.5 w-64 h-28">
      {barHeights.map((height, i) => (
        <div
          key={i}
          className={`
            w-2.5 rounded-full ${gradientBackgrounds[i]} ${height} ${animationDelays[i]}
            transition-all duration-300 ease-in-out
            animate-wave-idle opacity-70
          `}
          style={{
            transformOrigin: 'bottom',
            animationDelay: animationDelays[i].replace('delay-[', '').replace(']', ''),
          }}
        />
      ))}
    </div>
  );
};

export default WaveformAnimation; 