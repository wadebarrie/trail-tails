export function VehicleLoadNotice({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <ul className="mb-6 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
