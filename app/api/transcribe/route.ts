import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    // Server-side initialization
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const audioPart = {
      inlineData: {
        mimeType: audioFile.type || 'audio/webm',
        data: base64Audio,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { 
        parts: [
          audioPart, 
          { text: "You are a medical clinical scribe. Analyze the provided consultation audio. Extract and structure the information into a formal clinical note.\n\nCRITICAL RULE: Generate ONLY a draft containing information explicitly supported by the audio.\nNEVER invent, guess, or assume any diagnosis, symptoms, medicines, dosages, or measurements. If a specific detail is not mentioned in the audio, leave the corresponding field empty or write 'Not mentioned'." }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chiefComplaint: { type: Type.STRING, description: "The primary reason for the patient's visit." },
            history: { type: Type.STRING, description: "History of present illness and relevant past medical history." },
            observations: { type: Type.STRING, description: "Objective observations, vitals, and physical exam findings if mentioned." },
            assessment: { type: Type.STRING, description: "The diagnoses or clinical impressions." },
            plan: { type: Type.STRING, description: "Treatment plan, medications, and next steps." },
            followUp: { type: Type.STRING, description: "Follow-up instructions or scheduling." }
          },
          required: ["chiefComplaint", "history", "observations", "assessment", "plan", "followUp"]
        }
      }
    });

    const responseText = response.text;
    let notes = {};
    if (responseText) {
      try {
        notes = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }
    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
  }
}
