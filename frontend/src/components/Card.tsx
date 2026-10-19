import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-coffee-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 pb-2 border-b border-coffee-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return <div className={className} {...props}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-4 pt-3 border-t border-coffee-100 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};
