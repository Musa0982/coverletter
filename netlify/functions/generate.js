exports.handler = async function(event) {
  const { prompt } = JSON.parse(event.body);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.api}`
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ letter: data.choices?.[0]?.message?.content })
  };
};
