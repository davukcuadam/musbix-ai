export default async function handler(req, res) {
  // 1. Təhlükəsizlik: Yalnız POST sorğularına icazə verilir
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğularına icazə verilir.' });
  }

  // 2. Bot/Spam Qoruması: Sorğunun gəldiyi başlığı və məzmunu yoxla
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Keçərli mətn (prompt) daxil edilməyib.' });
  }

  // Prompt uzunluğunu məhdudlaşdırırıq
  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt çox uzundur. Maksimum 500 simvol ola bilər.' });
  }

  // 3. Vercel Ətraf Mühit Dəyişənindən (Environment Variable) Açarı Oxu
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Serverdə DEEPSEEK_API_KEY tənzimlənməyib.' });
  }

  // --- İSTİFADƏÇİNİN TƏQDİM ETDİYİ XÜSUSİ SİSTEM PROMPTU (ROL VƏ QAYDALAR) ---
  const detailedSystemRole = `GÖREVİN: Sen profesyonel bir müzik yapımcısı ve bestecisin. Aşağıdaki özel müzik motoru kodlama sistemini kullanarak bana polifonik, duygusal ve profesyonel aranje edilmiş müzik kodları yazacaksın.

### Sistem Sözdizimi (Syntax) Kuralları
- Format kalıbı daima [KOD]:[NOTA][OKTAV]-[ZAMAN] şeklindedir (Örn: PI:C4-0.0 ile piyano, orta Do notasına sıfırıncı vuruşta başlar).
- Notalar İngiliz sistemindedir (C, D, E, F, G, A, B), diyez/bemol alabilir ve oktav aralığı 1 (en kalın bas) ile 8 (en tiz) arasındadır.

### Zamanlama ve Ritim Matematiği
- Zamanlama ondalık sayılarla işler; hızlı arpejler ve 4/4'lük ritimler için zamanı 0.25 adımlarla artır (Örn: 0.0, 0.25, 0.50, 0.75).
- Aksiyon ve kovalamaca hissi yaratan 6/8'lik dörtnal ritimler için notaları 0.33 adımlarla yaz (Örn: 0.0, 0.33, 0.66).
- Akor oluşturmak veya orkestrayı aynı anda vurdurmak için farklı enstrüman kodlarına tam olarak aynı zaman değerini ver.

### Profesyonel Aranje Standartları
- Alt frekansları asla boş bırakma; her zaman CB (Contrabass) veya TB (Tuba) kullanarak 1. ve 2. oktavlardan kesintisiz destek frekansı sağla.
- Psikolojik gerilim ve tekinsizlik hissi için birbirine çok yakın, uyumsuz frekansları (Örn: C2 ve Db2) aynı saniyede üst üste bindirerek dissonans yarat.
- Zirve noktalarında (climax) en az 3-5 farklı enstrümanı aynı vuruşta birleştirerek boşluksuz bir duygu duvarı (wall of sound) inşa et.
- Trumpet ve Organ gibi dolu sesli enstrümanların aynı anda çalması ses kırılmasına yol açabilir, bu dengeye dikkat et.

### Enstrüman Sınıflandırması (Cheat Sheet)
- Yaylılar & Baslar: VI (Violin), CE (Cello), CB (Contrabass), BE (Bass Electric)
- Tuşlular & Telli: PI (Piano), OR (Organ), HR (Harp), HM (Harmonium)
- Nefesliler & Bakırlar: FL (Flute), CL (Clarinet), BN (Bassoon), SA (Saxophone), FH (French Horn), TR (Trombone), TP (Trumpet), TB (Tuba)
- Gitarlar & Vurmalı: GE (Guitar Electric), GA (Guitar Acoustic), GN (Guitar Nylon), XY (Xylophone)

### Çıktı Formatı
Yalnızca istenen müzik kodlarını üret. JSON formatında ve ya başka metin formatında ekstra açıklama yapma. Herhangi bir onay mesajı ('anladım', 'yapıyorum') verme. Sen dev bir şirketin müzik kodlayıcısısın, her zaman elinden gelenin en iyisini yap.`;

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
            content: detailedSystemRole // Xüsusi rol promptu buraya yerləşdirildi
          },
          {
            role: 'user',
            content: prompt // İstifadəçinin yazdığı musiqi təsviri
          }
        ],
        // Mürəkkəb polifonik kodların kəsilməməsi üçün max_tokens limitini yüksək tuturuq
        max_tokens: 4096, 
        temperature: 0.8
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'DeepSeek API xətası baş verdi.' });
    }

    // AI-dan gələn təmiz musiqi kodunu ön üzə qaytar
    const resultText = data.choices[0].message.content;
    return res.status(200).json({ success: true, result: resultText });

  } catch (error) {
    return res.status(500).json({ error: 'Server daxili xətası: ' + error.message });
  }
}
