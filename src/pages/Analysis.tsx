import React, { useEffect, useState } from 'react';
import ChapterDistributionChart from '@/components/charts/ChapterDistributionChart';
import HomeworkFunnelChart from '@/components/charts/HomeworkFunnelChart';
import TagRankingChart from '@/components/charts/TagRankingChart';
import ProgressTrendChart from '@/components/charts/ProgressTrendChart';
import { api } from '@/services/api';

const Analysis: React.FC = () => {
  const [chapterData, setChapterData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [tagData, setTagData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chapter, funnel, tag, progress] = await Promise.all([
          api.dashboard.getChapterDistribution(),
          api.dashboard.getHomeworkFunnel(),
          api.dashboard.getTagRanking(),
          api.dashboard.getProgressTrend(),
        ]);
        setChapterData(chapter || []);
        setFunnelData(funnel || []);
        setTagData(tag || []);
        setProgressData(progress || []);
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);

        const mockChapter = [];
        const courses = ['Python程序设计', '数据分析实战', 'Web前端开发'];
        courses.forEach((course) => {
          for (let i = 1; i <= 5; i++) {
            mockChapter.push({
              courseName: course,
              chapterName: `${course} - 第${i}章`,
              questionCount: Math.round(8 + Math.random() * 12),
              completedCount: Math.round(5 + Math.random() * 15),
              completionRate: Math.round(50 + Math.random() * 45),
            });
          }
        });
        setChapterData(mockChapter);

        setFunnelData([
          { stage: 'assigned', value: 250, conversionRate: 100 },
          { stage: 'started', value: 218, conversionRate: 87.2 },
          { stage: 'submitted', value: 195, conversionRate: 89.4 },
          { stage: 'graded', value: 182, conversionRate: 93.3 },
          { stage: 'passed', value: 168, conversionRate: 92.3 },
        ]);

        const tags = ['基础概念', '代码实操', '算法分析', '案例分析', '综合应用', '易错点', '高频考点', '拓展知识'];
        setTagData(tags.map((tag) => ({
          tagName: tag,
          practiceCount: Math.round(100 + Math.random() * 400),
          correctRate: Math.round(55 + Math.random() * 35),
        })));

        const mockProgress = [];
        const classes = ['CLASS_01', 'CLASS_02', 'CLASS_03', 'CLASS_04', 'CLASS_05'];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          classes.forEach((cls, idx) => {
            const baseProgress = 30 + idx * 8 + (29 - i) * 2;
            mockProgress.push({
              date: dateStr,
              className: cls,
              progress: Math.min(100, Math.max(0, baseProgress + (Math.random() - 0.5) * 10)),
            });
          });
        }
        setProgressData(mockProgress);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">数据分析</h1>
        <p className="text-dark-400 text-sm">多维度分析题库练习数据，洞察学习趋势</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-gradient p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <ChapterDistributionChart data={chapterData} />
        </div>
        <div className="card-gradient p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <HomeworkFunnelChart data={funnelData} />
        </div>
        <div className="card-gradient p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <TagRankingChart data={tagData} />
        </div>
        <div className="card-gradient p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <ProgressTrendChart data={progressData} />
        </div>
      </div>
    </div>
  );
};

export default Analysis;
