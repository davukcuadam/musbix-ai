export default async function handler(req, res) {
  // 1. Təhlükəsizlik: Yalnız POST sorğularına icazə verilir
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları qəbul edilir.' });
  }

  // 2. Bot/Spam Qoruması: Sorğunun gəldiyi başlığı və məzmunu yoxla
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Keçərli mətn (prompt) daxil edilməyib.' });
  }

  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt çox uzundur. Maksimum 500 simvol ola bilər.' });
  }

  // 3. Vercel Ətraf Mühit Dəyişənindən (Environment Variable) Açarı Oxu
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Serverdə DEEPSEEK_API_KEY tənzimlənməyib.' });
  }

  try {
    // 4. DeepSeek API-yə Təhlükəsiz Sorğu
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Sən Musbix AI musiqi generatorusan. İstifadəçinin verdiyi təsvirə uyğun olaraq Tone.js ilə çalına biləcək notlar ardıcıllığı yarat. Yalnız JSON formatında cavab ver: {"notes": ["D4", "F#4", "A4", "C#5"], "bpm": 120}. Başqa heç bir ekstra mətn yazma.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2048, // Not ardıcıllığının yarıda kəsilməməsi üçün limit yüksək saxlanılır
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'DeepSeek API xətası baş verdi.' });
    }

    // AI cavabını ön üzə qaytar
    const resultText = data.choices[0].message.content;
    return res.status(200).json({ success: true, result: resultText });

  } catch (error) {
    return res.status(500).json({ error: 'Server daxili xətası: ' + error.message });
  }
}