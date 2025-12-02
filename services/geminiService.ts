
/**
 * Parses a natural language search query into structured filters by calling the backend API.
 * Example: "Show me cheap engineering colleges in Bangalore" -> { location: 'Bangalore', query: 'Engineering' }
 */
export const parseSearchQuery = async (userQuery: string) => {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userQuery })
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error parsing search query:", error);
    return null;
  }
};

/**
 * Generates a summary or recommendation explanation for a course by calling the backend API.
 */
export const getCourseInsights = async (courseName: string, collegeName: string, description: string) => {
  try {
    const response = await fetch('/api/ai/course-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName, collegeName, description })
    });

    if (!response.ok) return "AI insights unavailable.";
    const data = await response.json();
    return data.text || "No insights available.";
  } catch (error) {
    return "AI insights unavailable.";
  }
};

/**
 * Generates a summary for a college by calling the backend API.
 */
export const getCollegeInsights = async (collegeName: string, location: string, description: string) => {
  try {
    const response = await fetch('/api/ai/college-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collegeName, location, description })
    });

    if (!response.ok) return "AI insights unavailable.";
    const data = await response.json();
    return data.text || "No insights available.";
  } catch (error) {
    return "AI insights unavailable.";
  }
};
