
"use client";

import { useState, useRef, useLayoutEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TruncatedTooltipCellProps = {
  text: string;
};

export default function TruncatedTooltipCell({ text }: TruncatedTooltipCellProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current;
      if (element) {
        // Para line-clamp, a verificação scrollWidth > clientWidth não funciona
        // A melhor abordagem é comparar scrollHeight com clientHeight
        if (element.scrollHeight > element.clientHeight) {
          setIsTruncated(true);
        } else {
          setIsTruncated(false);
        }
      }
    };

    // Verificação inicial
    checkTruncation();

    // Adiciona listener para re-verificar em caso de redimensionamento
    window.addEventListener('resize', checkTruncation);
    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text]);

  if (isTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span ref={textRef} className="line-clamp-2">
              {text}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Renderiza o texto com a classe para que a ref possa medir
  // mas o tooltip só será mostrado se isTruncated for true.
  return (
    <span ref={textRef} className="line-clamp-2">
      {text}
    </span>
  );
}
