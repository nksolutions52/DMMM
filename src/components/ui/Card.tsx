import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
}) => {
  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/60">
          <div>
            {title && <h3 className="text-xl font-extrabold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-8'}>{children}</div>
      {footer && (
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">{footer}</div>
      )}
    </div>
  );
};

export default Card;