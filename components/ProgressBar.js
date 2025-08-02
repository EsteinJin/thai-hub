function ProgressBar({ progress, total, className = "" }) {
  try {
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
    
    return (
      <div className={`space-y-2 ${className}`} data-name="progress-bar" data-file="components/ProgressBar.js">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>学习进度</span>
          <span>{progress}/{total} ({percentage}%)</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ProgressBar component error:', error);
    return null;
  }
}