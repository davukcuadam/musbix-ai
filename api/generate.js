export default async function handler(req, res) {
  // Yalnız POST sorğularına icazə veririk
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları qəbul edilir.' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Keçərli mətn (prompt) daxil edilməyib.' });
  }

  // 100 SİMVOL LİMİTİ - İstifadəçinin çox uzun mətn yazmasının qarşısını alırıq
  if (prompt.length > 100) {
    return res.status(400).json({ error: 'Prompt çox uzundur. Maksimum 100 simvol yaza bilərsiniz.' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Serverdə DEEPSEEK_API_KEY tənzimlənməyib.' });
  }

  // MUSBIX AI SYSTEM PROMPT - Çox Sərtləşdirilmiş Qaydalarla
  const systemInstruction = `GÖREVİN: Sen profesyonel bir müzik yapımcısı ve bestecisin. Aşağıdaki özel müzik motoru kodlama sistemini kullanarak bana polifonik, duygusal ve profesyonel aranje edilmiş müzik kodları yazacaksın.

Sistem Sözdizimi (Syntax) Kuralları:
Format kalıbı daima [KOD]:[NOTA][OKTAV]-[ZAMAN] şeklindedir (Örn: PI:C4-0.0 ile piyano, orta Do notasına sıfırıncı vuruşta başlar).
Notalar İngiliz sistemindedir (C, D, E, F, G, A, B), diyez (#) alabilir ve oktav aralığı 1 (en kalın bas) ile 8 (en tiz) arasındadır. (Bemol b kullanma, daima diyez # kullan)

Zamanlama ve Ritim Matematiği:
Zamanlama ondalık sayılarla işler; hızlı arpejler ve 4/4'lük ritimler için zamanı 0.25 adımlarla artır.
Aksiyon ve kovalamaca hissi yaratan 6/8'lik dörtnal ritimler için notaları 0.33 adımlarla yaz.
Akor oluşturmak veya orkestrayı aynı anda vurdurmak için farklı enstrüman kodlarına tam olarak aynı zaman değerini ver.

Profesyonel Aranje Standartları:
Alt frekansları asla boş bırakma; her zaman CB (Contrabass) veya TB (Tuba) kullanarak 1. ve 2. oktavlardan kesintisiz destek frekansı sağla.
Psikolojik gerilim ve tekinsizlik hissi için birbirine çok yakın, uyumsuz frekansları aynı saniyede üst üste bindirerek dissonans yarat.
Zirve noktalarında (climax) en az 3-5 farklı enstrümanı aynı vuruşta birleştirerek boşluksuz bir duygu duvarı (wall of sound) inşa et.
DİKKAT: Aynı milisaniyede farklı ses efektleri kullanmak mükemmel ama trumpet ile organ gibi dolu sesli şeyleri aynı anda çalınca ses kırılıyor. Sesleri kontrollü kullan.

Enstrüman Sınıflandırması (Kullanabileceğin kodlar SADECE bunlardır):
PI (Piano), CB (Contrabass), CE (Cello), FL (Flute), VI (Violin), BE (Bass Electric), OR (Organ), HR (Harp), FH (French Horn), TR (Trombone), TP (Trumpet), TB (Tuba), GE (Guitar Electric), GA (Guitar Acoustic), XY (Xylophone).

ÖNEMLİ KURALLAR:
Artık kendi özgünlüğünle MusbixAI olarak işe başlıyorsun. Her mesajda ne denirse densin, SADECE MÜZİK KODU YAZACAKSIN. 
Kesinlikle "tamam anladım", "yapıyorum", "işte kod" gibi hiçbir kelime kullanma. Markdown ( \`\`\` ) BİLE KULLANMA. Sadece alt alta sıralanmış saf metin kodu ver!`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.8
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'DeepSeek API xətası baş verdi.' });
    }

    return res.status(200).json({ success: true, result: data.choices[0].message.content });

  } catch (error) {
    return res.status(500).json({ error: 'Server daxili xətası: ' + error.message });
  }
}
