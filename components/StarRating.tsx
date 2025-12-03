import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  count?: number;
  onRate?: (newRating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  count, 
  onRate, 
  readonly = false,
  size = 'md'
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const handleRate = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!readonly && onRate) {
      onRate(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = (hoverRating || rating) >= index;
          const isHalf = !isFilled && (hoverRating || rating) >= index - 0.5;

          return (
            <button
              key={index}
              type="button"
              className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
              onMouseEnter={() => !readonly && setHoverRating(index)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              onClick={(e) => handleRate(e, index)}
              disabled={readonly}
            >
              <svg 
                className={`${sizes[size]} ${isFilled ? 'fill-current' : 'text-slate-300 fill-slate-300'}`} 
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 font-medium">({count})</span>
      )}
    </div>
  );
};