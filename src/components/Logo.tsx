import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
             <Image
         src="/El Ceibo.png"
         alt="El Ceibo Logo"
         width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
         height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
         className="w-full h-full object-contain"
       />
    </div>
  );
} 