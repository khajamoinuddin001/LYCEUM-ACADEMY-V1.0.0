import * as mockApi from './api';
export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await mockApi.summarizeWithGemini(text);
    return response.summary;
  } catch (error) {
    console.error("Error calling backend for summary:", error);
    return `Error: Could not summarize notes.`;
  }
}

export async function analyzeDocument(documentText: string): Promise<any> {
  try {
    const response = await mockApi.analyzeDocumentWithGemini(documentText);
    return response.analysis;
  } catch (error) {
    console.error("Error calling backend for document analysis:", error);
    throw new Error("Failed to analyze document.");
  }
}

export async function draftEmail(prompt: string, studentName: string): Promise<string> {
  try {
    const response = await mockApi.draftEmailWithGemini(prompt, studentName);
    return response.draft;
  } catch (error) {
    console.error("Error calling backend for email draft:", error);
    return `Error: Could not draft email. Please try again.`;
  }
}
