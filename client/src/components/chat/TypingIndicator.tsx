const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-1">
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
    <span className="text-xs text-muted-foreground">typing...</span>
  </div>
);

export default TypingIndicator;
