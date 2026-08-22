export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1B1E]/85 backdrop-blur-sm" role="status" aria-label={label}>
      <span className="loading-spinner" aria-hidden="true" />
    </div>
  );
}
