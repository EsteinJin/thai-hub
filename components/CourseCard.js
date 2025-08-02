function CourseCard({ level, course, progress, onStartLearning, onBrowseCards }) {
  try {
    const progressData = StorageUtils.getProgress(level);
    const completedCount = progressData.completed.length;
    const isCompleted = completedCount >= course.totalCards;
    
    return (
      <div className="course-card group hover:scale-105" data-name="course-card" data-file="components/CourseCard.js">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg ${course.color} flex items-center justify-center text-white font-bold text-lg`}>
              {level}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {course.title}
              </h3>
              {isCompleted && (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <div className="icon-check-circle text-sm"></div>
                  <span className="text-sm font-medium">已完成</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <ProgressBar 
          progress={completedCount}
          total={course.totalCards}
          className="mb-6"
        />
        
        <div className="flex space-x-3">
          <button
            onClick={() => onStartLearning(level)}
            className="btn-primary flex-1 text-sm py-2"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="icon-play text-sm"></div>
              <span>开始学习</span>
            </div>
          </button>
          
          <button
            onClick={() => onBrowseCards(level)}
            className="btn-secondary text-sm py-2 px-4"
            aria-label="浏览卡片"
          >
            <div className="icon-book-open text-sm"></div>
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CourseCard component error:', error);
    return null;
  }
}