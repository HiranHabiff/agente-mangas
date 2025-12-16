import { HStack, Box } from '@chakra-ui/react';
import { FiStar } from 'react-icons/fi';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: string;
  allowHalf?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = '28px',
  allowHalf = true
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (starIndex: number, isHalf: boolean) => {
    const newValue = allowHalf && isHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent, starIndex: number) => {
    if (!allowHalf) {
      setHoverValue(starIndex + 1);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const getStarFill = (starIndex: number): 'full' | 'half' | 'empty' => {
    if (displayValue >= starIndex + 1) return 'full';
    if (displayValue >= starIndex + 0.5) return 'half';
    return 'empty';
  };

  return (
    <HStack gap={1} onMouseLeave={handleMouseLeave}>
      {Array.from({ length: max }, (_, i) => {
        const fill = getStarFill(i);

        return (
          <Box
            key={i}
            position="relative"
            cursor="pointer"
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isHalf = allowHalf && x < rect.width / 2;
              handleClick(i, isHalf);
            }}
          >
            {/* Empty star (background) */}
            <Box
              as={FiStar}
              fontSize={size}
              color="gray.600"
              strokeWidth={1.5}
            />

            {/* Filled star (overlay) */}
            {fill !== 'empty' && (
              <Box
                position="absolute"
                top={0}
                left={0}
                overflow="hidden"
                width={fill === 'half' ? '50%' : '100%'}
              >
                <Box
                  as={FiStar}
                  fontSize={size}
                  color="yellow.400"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </HStack>
  );
}
