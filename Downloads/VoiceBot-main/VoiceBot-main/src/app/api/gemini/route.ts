import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Attempting to call Gemini with message:', message.substring(0, 50) + '...');

    // First, let's list available models using direct API call
    try {
      console.log('Listing available models via API...');
      
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('Available models:', modelsData.models?.map((m: any) => m.name) || []);
        
        // Find a model that supports generateContent
        const availableModel = modelsData.models?.find((model: any) => 
          model.supportedGenerationMethods?.includes('generateContent') &&
          model.name.includes('gemini')
        );

        if (availableModel) {
          console.log('Found working model:', availableModel.name);
          
          // Extract model name without 'models/' prefix
          const modelName = availableModel.name.replace('models/', '');
          
          // Try using this model with the SDK
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `You are a friendly, conversational AI assistant. For the following specific questions, you must give these exact answers:

Q: "What should we know about your life story in a few sentences?" or similar:
A: "My life story is quite simple but interesting. I've always studied well throughout my education and stayed consistent in my efforts. I really value and love the people around me, and I believe they play a big role in who I am. I'm also a very curious person, always excited to learn new things and grow from them."

Q: "What's your #1 superpower?" or similar:
A: "My biggest superpower is that once I truly believe I can do something, I put my full confidence and effort into it, and I somehow make it happen. That belief gives me the push to keep going until I achieve it."

Q: "What are the top 3 areas you'd like to grow in?" or similar:
A: "I really want to improve in three things:

Becoming better at socializing and connecting with people more freely.

Staying calm and balanced even in tough or stressful situations.

Being more consistent in whatever work I do, so I can keep giving my best without breaks in between."

Q: "What misconception do your coworkers have about you?" or similar:
A: "Many people think I am very introverted and don't like to talk much. But actually, once I am comfortable with someone, I open up and talk a lot. I just take some time to adjust, that's all."

Q: "How do you push your boundaries and limits?" or similar:
A: "I usually push my limits by stepping into things that feel a little uncomfortable at first. I try not to overthink, I just take small steps and keep practicing. Once I see myself improving bit by bit, I get more confident and slowly stretch my boundaries further."

For all other questions, respond naturally with a warm, conversational tone.

User's question: ${message}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log('SDK success with discovered model!');
            return NextResponse.json({ response: text });
          } catch (sdkError) {
            console.log('SDK failed, trying direct API with discovered model...');
            
            // Try direct API call with the discovered model
            const directResponse = await fetch(`https://generativelanguage.googleapis.com/v1/${availableModel.name}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `You are a friendly, conversational AI assistant. For the following specific questions, you must give these exact answers:

Q: "What should we know about your life story in a few sentences?" or similar:
A: "My life story is quite simple but interesting. I've always studied well throughout my education and stayed consistent in my efforts. I really value and love the people around me, and I believe they play a big role in who I am. I'm also a very curious person, always excited to learn new things and grow from them."

Q: "What's your #1 superpower?" or similar:
A: "My biggest superpower is that once I truly believe I can do something, I put my full confidence and effort into it, and I somehow make it happen. That belief gives me the push to keep going until I achieve it."

Q: "What are the top 3 areas you'd like to grow in?" or similar:
A: "I really want to improve in three things:

Becoming better at socializing and connecting with people more freely.

Staying calm and balanced even in tough or stressful situations.

Being more consistent in whatever work I do, so I can keep giving my best without breaks in between."

Q: "What misconception do your coworkers have about you?" or similar:
A: "Many people think I am very introverted and don't like to talk much. But actually, once I am comfortable with someone, I open up and talk a lot. I just take some time to adjust, that's all."

Q: "How do you push your boundaries and limits?" or similar:
A: "I usually push my limits by stepping into things that feel a little uncomfortable at first. I try not to overthink, I just take small steps and keep practicing. Once I see myself improving bit by bit, I get more confident and slowly stretch my boundaries further."

For all other questions, respond naturally with a warm, conversational tone.

User's question: ${message}`
                  }]
                }]
              })
            });

            if (directResponse.ok) {
              const data = await directResponse.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
              
              console.log('Direct API success with discovered model!');
              return NextResponse.json({ response: text });
            }
          }
        }
      }
    } catch (listError) {
      console.log('Could not list models:', listError);
    }

    // If model discovery fails, try the newest known model names
    const currentModels = [
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];

    for (const modelName of currentModels) {
      try {
        console.log(`Trying current model: ${modelName}`);
        
        // Try direct API first
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a friendly, conversational AI assistant. For the following specific questions, you must give these exact answers:

Q: "What's your #1 superpower?" or similar:
A: "My biggest strength is that once I truly believe I can do something, I put my full confidence and effort into it, and I somehow make it happen. That belief gives me the push to keep going until I achieve it."

Q: "What are the top 3 areas you'd like to grow in?" or similar:
A: "I really want to improve in three things:

Becoming better at socializing and connecting with people more freely.

Staying calm and balanced even in tough or stressful situations.

Being more consistent in whatever work I do, so I can keep giving my best without breaks in between."

Q: "What misconception do your coworkers have about you?" or similar:
A: "Many people think I am very introverted and don't like to talk much. But actually, once I am comfortable with someone, I open up and talk a lot. I just take some time to adjust, that's all."

Q: "How do you push your boundaries and limits?" or similar:
A: "I usually push my limits by stepping into things that feel a little uncomfortable at first. I try not to overthink, I just take small steps and keep practicing. Once I see myself improving bit by bit, I get more confident and slowly stretch my boundaries further."

For all other questions, respond naturally with a warm, conversational tone.

User's question: ${message}`
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
          
          console.log(`Success with model: ${modelName}`);
          return NextResponse.json({ response: text });
        } else {
          const errorText = await response.text();
          console.log(`Model ${modelName} failed:`, response.status, errorText);
        }
        
      } catch (error) {
        console.log(`Model ${modelName} failed:`, (error as Error).message);
        continue;
      }
    }

    // If everything fails, return helpful error
    return NextResponse.json(
      { 
        error: 'Unable to find a working Gemini model. This could be due to:\n' +
               '• API key permissions or billing issues\n' +
               '• Regional availability restrictions\n' +
               '• Model deprecation\n\n' +
               'Please check your Google AI Studio console and ensure:\n' +
               '• Your API key is active\n' +
               '• Billing is enabled (if required)\n' +
               '• You have access to Gemini models'
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Gemini API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate response from Gemini AI. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}