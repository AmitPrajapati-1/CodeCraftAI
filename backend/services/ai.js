import axios from "axios";

export async function generateComponent(prompt, history = [], image = null, currentJsx = '', currentCss = '') {
  let messages = [];
  if (currentJsx || currentCss) {
    messages.push({
      role: "system",
      content: `You are an expert React developer. 
ALWAYS return a single, valid React function component named Component, and its CSS, and nothing else.
DO NOT return HTML, <html>, <body>, <head>, explanations, comments, or markdown.
Only output the code for the React component and the CSS, separated by a line with ONLY /* CSS */.
The output must start with: function Component() { ... }
If you are patching, always return the full, valid function component and CSS, not just a patch or snippet.

Current JSX:
${currentJsx}

Current CSS:
${currentCss}`
    });
  }
  if (image) {
    messages = [
      ...messages,
      ...history,
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image } }
        ]
      }
    ];
  } else {
    messages = [
      ...messages,
      ...history,
      { role: "user", content: prompt }
    ];
  }

  try {
    const resp = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    return resp.data.choices[0].message.content;
  } catch (e) {
    return `// Error generating component: ${e.message}`;
  }
}