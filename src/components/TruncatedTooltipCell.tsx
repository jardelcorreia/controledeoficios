
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
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current;
      if (element) {
        if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
          setIsTruncated(true);
        } else {
          setIsTruncated(false);
        }
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  return (
    <TooltipProvider>
      <Tooltip open={isTruncated ? undefined : false}>
        <TooltipTrigger asChild>
          <div ref={textRef} className="truncate-cell">
            {text}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

