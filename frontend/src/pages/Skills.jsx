// ConnectHub - Skills Page
import React from 'react';
import AIFeedback from '../components/AI/AIFeedback.jsx';
import { BookOpen, Code, Zap, Users, Trophy, Target } from 'lucide-react';

const Skills = () => {
  const skillCategories = [
    {
      id: 1,
      title: "Programming & Development",
      icon: Code,
      color: "#8B5CF6",
      skills: [
        { name: "JavaScript", level: 85, trend: "up" },
        { name: "React", level: 78, trend: "up" },
        { name: "Python", level: 72, trend: "stable" },
        { name: "Node.js", level: 65, trend: "up" }
      ]
    },
    {
      id: 2,
      title: "Design & Creativity", 
      icon: Target,
      color: "#10B981",
      skills: [
        { name: "UI/UX Design", level: 70, trend: "up" },
        { name: "Figma", level: 68, trend: "up" },
        { name: "Photography", level: 75, trend: "stable" },
        { name: "Digital Art", level: 60, trend: "up" }
      ]
    },
    {
      id: 3,
      title: "Communication & Leadership",
      icon: Users,
      color: "#3B82F6",
      skills: [
        { name: "Public Speaking", level: 65, trend: "up" },
        { name: "Team Leadership", level: 70, trend: "up" },
        { name: "Writing", level: 80, trend: "stable" },
        { name: "Project Management", level: 62, trend: "up" }
      ]
    }
  ];
  
  const achievements = [
    {
      id: 1,
      title: "Code Contributor",
      description: "Shared 10+ code snippets",
      icon: Code,
      progress: 85,
      color: "#8B5CF6"
    },
    {
      id: 2,
      title: "Study Buddy",
      description: "Helped 5 students this month",
      icon: BookOpen,
      progress: 100,
      color: "#10B981"
    },
    {
      id: 3,
      title: "Event Organizer",
      description: "Hosted 3 successful events",
      icon: Users,
      progress: 60,
      color: "#3B82F6"
    }
  ];
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };
  
  const getSkillColor = (level) => {
    if (level >= 80) return 'bg-hub-success';
    if (level >= 60) return 'bg-hub-warning';
    return 'bg-hub-danger';
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-hub-primary/10 to-hub-accent/10 rounded-xl p-6 border border-primary/20">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Skills & Development
        </h1>
        <p className="text-muted-foreground">
          Track your progress, get AI feedback, and develop new skills
        </p>
      </div>
      
      {/* Skills Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {skillCategories.map(category => {
          const Icon = category.icon;
          return (
            <div key={category.id} className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Icon 
                    className="w-5 h-5"
                    style={{ color: category.color }}
                  />
                </div>
                <h3 className="font-semibold text-foreground">{category.title}</h3>
              </div>
              
              <div className="space-y-4">
                {category.skills.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-xs">{getTrendIcon(skill.trend)}</span>
                      </div>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getSkillColor(skill.level)}`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 px-4 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors">
                View All Skills
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Achievements */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-hub-warning" />
          <h2 className="text-xl font-bold text-foreground">Recent Achievements</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements.map(achievement => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className="bg-gradient-to-br from-secondary/20 to-accent/5 rounded-lg p-4 border border-border/50">
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: achievement.color + '20' }}
                  >
                    <Icon 
                      className="w-4 h-4"
                      style={{ color: achievement.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{achievement.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${achievement.progress}%`,
                        backgroundColor: achievement.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* AI Feedback Section */}
      <div>
        <AIFeedback />
      </div>
      
      {/* Learning Resources */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-hub-accent" />
          <h2 className="text-xl font-bold text-foreground">Recommended Learning</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Advanced React Patterns",
              provider: "CodeCoffee Community",
              duration: "4 weeks",
              difficulty: "Advanced",
              students: 234,
              rating: 4.8
            },
            {
              title: "UI/UX Design Fundamentals",
              provider: "ArtistsCorner Community", 
              duration: "6 weeks",
              difficulty: "Beginner",
              students: 156,
              rating: 4.9
            }
          ].map((course, index) => (
            <div key={index} className="bg-gradient-to-r from-secondary/10 to-accent/5 rounded-lg p-4 border border-border/50 hover-lift">
              <div className="mb-3">
                <h4 className="font-semibold text-foreground mb-1">{course.title}</h4>
                <p className="text-sm text-muted-foreground">{course.provider}</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span>⏱️ {course.duration}</span>
                <span>📊 {course.difficulty}</span>
                <span>👥 {course.students} students</span>
                <span>⭐ {course.rating}</span>
              </div>
              
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skills;