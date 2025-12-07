import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Sparkles, Loader2, X, Copy, Share2, Trash2, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { storageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const PRESET_PROMPTS = [
  {
    title: "Recipe Suggestions",
    prompt: "Based on my recent shopping items, provide meal ideas and recipes",
    icon: "🍳"
  },
  {
    title: "Nutritional Info",
    prompt: "What's the nutritional value of my recent purchases?",
    icon: "🥗"
  },
  {
    title: "Budget Analysis",
    prompt: "Analyze my spending patterns and suggest ways to save money",
    icon: "💰"
  }
];

interface SavedResponse {
  id: string;
  prompt: string;
  response: string;
  timestamp: string;
  followUps?: Array<{
    prompt: string;
    response: string;
    timestamp: string;
  }>;
}

export default function AskAIPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<Array<{ name: string; price: number; quantity: number }>>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [daysToInclude, setDaysToInclude] = useState(3);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [viewingResponse, setViewingResponse] = useState<SavedResponse | null>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [currentResponseFollowUps, setCurrentResponseFollowUps] = useState<Array<{
    prompt: string;
    response: string;
    timestamp: string;
  }>>([]);
  const [currencySymbol, setCurrencySymbol] = useState("€");

  useEffect(() => {
    // Get shopping items from the selected number of days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToInclude);

    const lists = storageService.getAllLists();
    const recentLists = lists.filter(list =>
      new Date(list.date) >= cutoffDate
    );

    const items = recentLists.flatMap(list =>
      list.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    );

    // Remove duplicates based on name and price combination
    const uniqueItems = items.filter((item, index, self) =>
      index === self.findIndex(i => i.name === item.name && i.price === item.price)
    );
    setRecentItems(uniqueItems);
  }, [daysToInclude]);

  useEffect(() => {
    // Load saved responses from localStorage
    const saved = localStorage.getItem('ai_saved_responses');
    if (saved) {
      try {
        setSavedResponses(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved responses:', error);
      }
    }

    // Load currency symbol
    const savedCurrency = localStorage.getItem('currencySymbol') || '€';
    setCurrencySymbol(savedCurrency);
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a question or select a preset prompt",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          recentItems,
          currencySymbol
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();
      setResponse(data.response);
      setCurrentResponseFollowUps([]); // Reset follow-ups for new response
      setShowResponseModal(true);
    } catch (error) {
      console.error("AI request error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    setResponse("");
    setShowResponseModal(false);
  };

  const handleCopyCurrentResponse = () => {
    navigator.clipboard.writeText(response).then(() => {
      toast({
        title: "Copied!",
        description: "AI response copied to clipboard",
        variant: "default",
        duration: 1000
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 1000
      });
    });
  };

  const handleShareCurrentWhatsApp = () => {
    const text = encodeURIComponent(response);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareCurrentTelegram = () => {
    const text = encodeURIComponent(response);
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
  };

  const saveResponse = () => {
    if (!response || !prompt) return;

    const newResponse: SavedResponse = {
      id: `response-${Date.now()}`,
      prompt: prompt.trim(),
      response: response,
      timestamp: new Date().toISOString(),
      followUps: currentResponseFollowUps.length > 0 ? currentResponseFollowUps : undefined
    };

    const updated = [newResponse, ...savedResponses];
    setSavedResponses(updated);
    localStorage.setItem('ai_saved_responses', JSON.stringify(updated));

    toast({
      title: "Response saved",
      description: "AI response has been saved to history",
      variant: "default",
      duration: 1000
    });
  };

  const handleCloseResponse = () => {
    saveResponse();
    setShowResponseModal(false);
  };

  const handleDeleteResponse = (id: string) => {
    const updated = savedResponses.filter(r => r.id !== id);
    setSavedResponses(updated);
    localStorage.setItem('ai_saved_responses', JSON.stringify(updated));

    if (viewingResponse?.id === id) {
      setViewingResponse(null);
    }

    toast({
      title: "Response deleted",
      description: "Saved response has been removed",
      variant: "default"
    });
  };

  const handleViewSavedResponse = (saved: SavedResponse) => {
    setViewingResponse(saved);
    setShowHistoryPanel(false);
  };

  const getTimeElapsed = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareContent, setShareContent] = useState<SavedResponse | null>(null);

  const handleShareClick = (saved: SavedResponse) => {
    setShareContent(saved);
    setShowShareOptions(true);
  };

  const handleCopyToClipboard = async (saved: SavedResponse) => {
    const shareText = `Q: ${saved.prompt}\n\nA: ${saved.response}`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
        variant: "default",
        duration: 1000
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
        variant: "default",
        duration: 1000
      });
    }
    setShowShareOptions(false);
  };

  const handleShareWhatsApp = (saved: SavedResponse) => {
    const shareText = encodeURIComponent(`Q: ${saved.prompt}\n\nA: ${saved.response}`);
    window.open(`https://wa.me/?text=${shareText}`, '_blank');
    setShowShareOptions(false);
  };

  const handleShareTelegram = (saved: SavedResponse) => {
    const shareText = encodeURIComponent(`Q: ${saved.prompt}\n\nA: ${saved.response}`);
    window.open(`https://t.me/share/url?text=${shareText}`, '_blank');
    setShowShareOptions(false);
  };

  const handleShareEmail = (saved: SavedResponse) => {
    const subject = encodeURIComponent('AI Response');
    const body = encodeURIComponent(`Q: ${saved.prompt}\n\nA: ${saved.response}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowShareOptions(false);
  };

  const handleShareSMS = (saved: SavedResponse) => {
    const shareText = encodeURIComponent(`Q: ${saved.prompt}\n\nA: ${saved.response}`);
    window.open(`sms:?body=${shareText}`, '_blank');
    setShowShareOptions(false);
  };

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim() || !viewingResponse) return;

    setIsFollowUpLoading(true);

    try {
      // Construct history from previous turns
      const history = [
        { role: 'user', content: viewingResponse.prompt },
        { role: 'model', content: viewingResponse.response },
        ...(viewingResponse.followUps || []).flatMap(f => [
          { role: 'user', content: f.prompt },
          { role: 'model', content: f.response }
        ])
      ];

      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: followUpPrompt.trim(),
          recentItems,
          currencySymbol,
          history
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();

      // Add follow-up to the current response
      const updatedResponse: SavedResponse = {
        ...viewingResponse,
        followUps: [
          ...(viewingResponse.followUps || []),
          {
            prompt: followUpPrompt.trim(),
            response: data.response,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Update in state and localStorage
      const updatedResponses = savedResponses.map(r =>
        r.id === viewingResponse.id ? updatedResponse : r
      );
      setSavedResponses(updatedResponses);
      localStorage.setItem('ai_saved_responses', JSON.stringify(updatedResponses));
      setViewingResponse(updatedResponse);
      setFollowUpPrompt("");

      toast({
        title: "Follow-up added",
        description: "Your follow-up question has been answered",
        variant: "default",
        duration: 1000
      });
    } catch (error) {
      console.error("Follow-up error:", error);
      toast({
        title: "Error",
        description: "Failed to get follow-up response",
        variant: "destructive"
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleFollowUpForCurrent = async () => {
    if (!followUpPrompt.trim() || !response) return;

    setIsFollowUpLoading(true);

    try {
      // Construct history from previous turns
      const history = [
        { role: 'user', content: prompt },
        { role: 'model', content: response },
        ...currentResponseFollowUps.flatMap(f => [
          { role: 'user', content: f.prompt },
          { role: 'model', content: f.response }
        ])
      ];

      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: followUpPrompt.trim(),
          recentItems,
          currencySymbol,
          history
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();

      // Add follow-up to current response
      const newFollowUp = {
        prompt: followUpPrompt.trim(),
        response: data.response,
        timestamp: new Date().toISOString()
      };

      setCurrentResponseFollowUps(prev => [...prev, newFollowUp]);
      setFollowUpPrompt("");

      toast({
        title: "Follow-up added",
        description: "Your follow-up question has been answered",
        variant: "default",
        duration: 1000
      });
    } catch (error) {
      console.error("Follow-up error:", error);
      toast({
        title: "Error",
        description: "Failed to get follow-up response",
        variant: "destructive"
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const formatResponse = (text: string) => {
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    // Process the text line by line
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        i++;
        continue;
      }

      // Check for headings (## or **text**)
      if (line.startsWith('##')) {
        const heading = line.replace(/^##\s*/, '').trim();
        elements.push(
          <h3 key={currentIndex++} className="text-lg font-bold text-gray-900 mb-3 mt-5 first:mt-0">
            {heading}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith('**') && line.endsWith('**')) {
        const heading = line.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '').trim();
        elements.push(
          <h3 key={currentIndex++} className="text-lg font-bold text-gray-900 mb-3 mt-5 first:mt-0">
            {heading}
          </h3>
        );
        i++;
        continue;
      }

      // Check for numbered lists
      if (/^\d+\.\s/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
          i++;
        }
        elements.push(
          <ol key={currentIndex++} className="list-decimal list-outside ml-5 space-y-2 mb-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed pl-1">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Check for bullet lists (-, *, •)
      if (/^[-*•]\s/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*•]\s*/, ''));
          i++;
        }
        elements.push(
          <ul key={currentIndex++} className="list-disc list-outside ml-5 space-y-2 mb-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed pl-1">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Regular paragraph - collect consecutive non-empty lines
      const paragraphLines: string[] = [];
      while (i < lines.length && lines[i].trim() &&
        !lines[i].trim().startsWith('##') &&
        !lines[i].trim().startsWith('**') &&
        !/^\d+\.\s/.test(lines[i].trim()) &&
        !/^[-*•]\s/.test(lines[i].trim())) {
        paragraphLines.push(lines[i].trim());
        i++;
      }

      if (paragraphLines.length > 0) {
        const paragraph = paragraphLines.join(' ');
        elements.push(
          <p key={currentIndex++} className="text-gray-700 leading-relaxed mb-4">
            {formatInlineMarkdown(paragraph)}
          </p>
        );
      }
    }

    return elements;
  };

  const formatInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Match **bold** text
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;

    const processedText = text;

    while ((match = boldRegex.exec(processedText)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(processedText.substring(lastIndex, match.index));
      }

      // Add bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < processedText.length) {
      parts.push(processedText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mr-3 p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistoryPanel(true)}
            className="p-2 hover:bg-gray-100 relative"
            title="View saved responses"
          >
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
            {savedResponses.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {savedResponses.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
        {/* Recent Items Info with Days Selector */}
        {recentItems.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl flex-shrink-0" role="img" aria-label="Shopping bag">📦</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm text-blue-900 font-semibold">
                    {recentItems.length} items from past
                  </p>
                  <select
                    value={daysToInclude}
                    onChange={(e) => setDaysToInclude(Number(e.target.value))}
                    className="px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-900 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed break-words">
                  {recentItems.slice(0, 5).map(item => item.name).join(", ")}
                  {recentItems.length > 5 && ` and ${recentItems.length - 5} more...`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0" role="img" aria-label="Info">ℹ️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm text-yellow-900 font-semibold">
                    No items found in past
                  </p>
                  <select
                    value={daysToInclude}
                    onChange={(e) => setDaysToInclude(Number(e.target.value))}
                    className="px-2 py-1 border border-yellow-300 rounded text-xs font-medium text-yellow-900 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
                <p className="text-xs text-yellow-700 leading-relaxed break-words">
                  Try selecting a longer time period or add items to your shopping lists!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preset Prompts */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Questions</h2>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_PROMPTS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handlePresetClick(preset.prompt)}
                className="justify-start text-left h-auto py-3 px-3 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md border-gray-200"
              >
                <span className="text-xl mr-2 flex-shrink-0" role="img" aria-label={preset.title}>
                  {preset.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1">{preset.title}</div>
                  <div className="text-xs text-gray-600 leading-relaxed whitespace-normal">{preset.prompt}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Custom Question</h2>
          <Textarea
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            placeholder="Ask anything about your shopping items..."
            className="min-h-[100px] resize-none shadow-sm"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-primary text-white hover:bg-blue-800 py-3 text-base font-medium shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Ask AI
            </>
          )}
        </Button>
      </div>

      {/* Response Modal - Full Screen */}
      {showResponseModal && response && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseResponse}
                className="mr-3 p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">AI Response</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentResponse = {
                    id: `temp-${Date.now()}`,
                    prompt: prompt,
                    response: response,
                    timestamp: new Date().toISOString()
                  };
                  handleShareClick(currentResponse);
                }}
                className="p-2 hover:bg-gray-100"
                title="Share"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResponse("");
                  setShowResponseModal(false);
                }}
                className="p-2 hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {/* Original Q&A */}
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-bold text-gray-900">
                  {prompt}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm">
                  {formatResponse(response)}
                </div>
              </div>
            </div>

            {/* Follow-ups */}
            {currentResponseFollowUps.length > 0 && (
              <div className="space-y-4">
                <div className="border-t border-gray-300 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Follow-ups</p>
                </div>
                {currentResponseFollowUps.map((followUp, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeElapsed(followUp.timestamp)}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <p className="text-sm font-bold text-gray-900">
                        {followUp.prompt}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm">
                        {formatResponse(followUp.response)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Input - Fixed at bottom */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <Textarea
                value={followUpPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFollowUpPrompt(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                disabled={isFollowUpLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUpForCurrent();
                  }
                }}
              />
              <Button
                onClick={handleFollowUpForCurrent}
                disabled={isFollowUpLoading || !followUpPrompt.trim()}
                className="bg-primary text-white hover:bg-blue-800 px-4 self-end"
              >
                {isFollowUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Panel - Slide in from right */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowHistoryPanel(false)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryPanel(false)}
                className="mr-3 p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <h2 className="text-lg font-bold text-gray-900">History</h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {savedResponses.length === 0 ? (
                <div className="text-center py-12 px-4 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No saved responses yet</p>
                  <p className="text-xs mt-1">Responses are automatically saved when you close them</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {savedResponses.map((saved) => (
                    <div
                      key={saved.id}
                      onClick={() => handleViewSavedResponse(saved)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-2">
                        {saved.prompt}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {saved.response}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeElapsed(saved.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Saved Response - Full Screen */}
      {viewingResponse && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewingResponse(null);
                  setShowHistoryPanel(true);
                }}
                className="mr-3 p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Saved Response</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShareClick(viewingResponse)}
                className="p-2 hover:bg-gray-100"
                title="Share"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleDeleteResponse(viewingResponse.id);
                  setViewingResponse(null);
                  setShowHistoryPanel(true);
                }}
                className="p-2 hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {/* Original Q&A */}
            <div className="mb-6">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <Clock className="h-3 w-3" />
                <span>{getTimeElapsed(viewingResponse.timestamp)}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-bold text-gray-900 mb-2">
                  {viewingResponse.prompt}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm">
                  {formatResponse(viewingResponse.response)}
                </div>
              </div>
            </div>

            {/* Follow-ups */}
            {viewingResponse.followUps && viewingResponse.followUps.length > 0 && (
              <div className="space-y-4">
                <div className="border-t border-gray-300 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Follow-ups</p>
                </div>
                {viewingResponse.followUps.map((followUp, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeElapsed(followUp.timestamp)}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <p className="text-sm font-bold text-gray-900">
                        {followUp.prompt}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm">
                        {formatResponse(followUp.response)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Input - Fixed at bottom */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <Textarea
                value={followUpPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFollowUpPrompt(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                disabled={isFollowUpLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUp();
                  }
                }}
              />
              <Button
                onClick={handleFollowUp}
                disabled={isFollowUpLoading || !followUpPrompt.trim()}
                className="bg-primary text-white hover:bg-blue-800 px-4 self-end"
              >
                {isFollowUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Options Modal */}
      {showShareOptions && shareContent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowShareOptions(false)}
          />

          <div className="relative bg-white rounded-t-2xl shadow-2xl w-full max-w-md mx-auto animate-slide-up">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-center">Share Response</h3>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleCopyToClipboard(shareContent)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50"
              >
                <Copy className="h-6 w-6 text-gray-600" />
                <span className="text-sm">Copy</span>
              </Button>

              <Button
                onClick={() => handleShareWhatsApp(shareContent)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-50 hover:border-green-300"
              >
                <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                <span className="text-sm">WhatsApp</span>
              </Button>

              <Button
                onClick={() => handleShareTelegram(shareContent)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-300"
              >
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                <span className="text-sm">Telegram</span>
              </Button>

              <Button
                onClick={() => handleShareEmail(shareContent)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50"
              >
                <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="text-sm">Email</span>
              </Button>

              <Button
                onClick={() => handleShareSMS(shareContent)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-50"
              >
                <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm">Messages</span>
              </Button>

              <Button
                onClick={() => setShowShareOptions(false)}
                variant="outline"
                className="col-span-2 mt-2 py-3 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
