// ConnectHub - AI Feedback Component
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  Zap,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Lightbulb,
  X
} from 'lucide-react';

const AIFeedback = () => {
  const { actions } = useApp();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [projectDescription, setProjectDescription] = useState('');
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  const simulateAIFeedback = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock feedback based on file type
    const mockFeedback = {
      overall_score: Math.floor(Math.random() * 20) + 80, // 80-100
      strengths: [
        "Well-structured code with clear variable names",
        "Good use of modern JavaScript features",
        "Proper error handling implementation",
        "Clean and readable formatting"
      ],
      improvements: [
        "Consider adding more comprehensive comments",
        "Optimize performance by reducing API calls",
        "Add unit tests for better code reliability",
        "Consider implementing input validation"
      ],
      suggestions: [
        "Explore using React hooks for state management",
        "Consider implementing lazy loading for better performance",
        "Add TypeScript for better type safety",
        "Implement accessibility features (ARIA labels)"
      ],
      analysis: {
        complexity: "Medium",
        maintainability: "High", 
        performance: "Good",
        security: "Excellent"
      }
    };
    
    setFeedback(mockFeedback);
    setIsAnalyzing(false);
    
    actions.addNotification({
      id: Date.now(),
      type: 'ai_feedback',
      message: 'AI feedback analysis complete! 🤖',
      timestamp: new Date()
    });
  };
  
  const clearFeedback = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setFeedback(null);
    setProjectDescription('');
  };
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-hub-success';
    if (score >= 75) return 'text-hub-warning';
    return 'text-hub-danger';
  };
  
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.includes('javascript') || file.type.includes('typescript')) return Code;
    return FileText;
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-hub-primary/10 to-hub-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Code Review</h2>
            <p className="text-muted-foreground">
              Get instant feedback on your projects and code
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-hub-success" />
            <span className="text-muted-foreground">Instant Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-hub-warning" />
            <span className="text-muted-foreground">Quality Assessment</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-hub-accent" />
            <span className="text-muted-foreground">Improvement Tips</span>
          </div>
        </div>
      </div>
      
      {/* Upload Section */}
      {!feedback && (
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Upload Your Project
          </h3>
          
          {/* Project Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Description (Optional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe what your project does and what kind of feedback you're looking for..."
              className="w-full h-24 p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.css,.html,.json,.md,.txt,.png,.jpg,.jpeg,.gif"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
              ${uploadedFile 
                ? 'border-primary/50 bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}>
              {uploadedFile ? (
                <div className="space-y-4">
                  {filePreview && (
                    <img 
                      src={filePreview} 
                      alt="Preview"
                      className="max-w-xs max-h-48 mx-auto rounded-lg object-cover"
                    />
                  )}
                  
                  <div className="flex items-center justify-center gap-3">
                    {React.createElement(getFileIcon(uploadedFile), { 
                      className: "w-8 h-8 text-primary" 
                    })}
                    <div className="text-left">
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={clearFeedback}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drop your files here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports: JavaScript, Python, Java, C++, Images, and more
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {uploadedFile && (
            <button
              onClick={simulateAIFeedback}
              disabled={isAnalyzing}
              className={`
                w-full mt-6 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                ${isAnalyzing
                  ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90 shadow-glow'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Get AI Feedback
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Analysis Loading */}
      {isAnalyzing && (
        <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Zap className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            AI is analyzing your code...
          </h3>
          <p className="text-muted-foreground mb-4">
            This usually takes a few seconds
          </p>
          <div className="w-64 h-2 bg-secondary/50 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-primary animate-pulse rounded-full w-2/3"></div>
          </div>
        </div>
      )}
      
      {/* Feedback Results */}
      {feedback && !isAnalyzing && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Analysis Results
              </h3>
              <button
                onClick={clearFeedback}
                className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.overall_score)}`}>
                  {feedback.overall_score}
                </div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                {Object.entries(feedback.analysis).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-semibold text-foreground capitalize">
                      {value}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Strengths */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-hub-success" />
              <h4 className="text-lg font-semibold text-foreground">Strengths</h4>
            </div>
            <div className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-hub-success/5 rounded-lg border border-hub-success/20">
                  <CheckCircle className="w-4 h-4 text-hub-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{strength}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Improvements */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-hub-warning" />
              <h4 className="text-lg font-semibold text-foreground">Areas for Improvement</h4>
            </div>
            <div className="space-y-3">
              {feedback.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-hub-warning/5 rounded-lg border border-hub-warning/20">
                  <TrendingUp className="w-4 h-4 text-hub-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{improvement}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Suggestions */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-hub-accent" />
              <h4 className="text-lg font-semibold text-foreground">Suggestions</h4>
            </div>
            <div className="space-y-3">
              {feedback.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-hub-accent/5 rounded-lg border border-hub-accent/20">
                  <Lightbulb className="w-4 h-4 text-hub-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={clearFeedback}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Analyze Another File
            </button>
            <button className="px-6 py-3 bg-secondary/50 text-secondary-foreground rounded-lg font-medium hover:bg-secondary/70 transition-colors">
              Share Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFeedback;