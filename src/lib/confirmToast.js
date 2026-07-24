import toast from "react-hot-toast";

export const confirmToast = (message, onConfirm) => {
  toast.custom(
    (t) => (
      <div
        className={`bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg shadow-lg p-4 flex flex-col gap-3 min-w-[280px] mt-[50vh] transition-opacity duration-200 ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-amber-900 dark:text-amber-100 mb-0 font-semibold">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex-shrink-0"
            aria-label="Close"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-default !py-1 !px-3 text-sm" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </button>
          <button
            className="btn-red !py-1 !px-3 text-sm"
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: "center-center",
    }
  );
};