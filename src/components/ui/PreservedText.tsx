
interface PreservedTextProps {
  text: string;
  className?: string;
}

export function PreservedText({ text, className }: PreservedTextProps) {
  if (!text) return null;
  
  return (
    <p className={`whitespace-pre-wrap break-words ${className ?? ''}`}>
      {text}
    </p>
  );
}
