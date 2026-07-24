const StatusPill = ({ label, tone }) => {
  const toneClasses = {
    green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  );
};

export default StatusPill;
