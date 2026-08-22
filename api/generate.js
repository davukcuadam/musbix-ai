export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları qəbul edilir.' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Keçərli mətn (prompt) daxil edilməyib.' });
  }

  if (prompt.length > 100) {
    return res.status(400).json({ error: 'Prompt çox uzundur. Maksimum 100 simvol yaza bilərsiniz.' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Serverdə DEEPSEEK_API_KEY tənzimlənməyib.' });
  }

  // MUSBIX AI SYSTEM PROMPT — sərt "yalnız saf kod" + təkrar-əleyhinə qaydalar + real 17 alət siyahısı
  const systemInstruction = `GÖREVİN: Sen profesyonel bir müzik yapımcısı ve bestecisin. Aşağıdaki özel müzik motoru kodlama sistemini kullanarak bana polifonik, duygusal ve profesyonel aranje edilmiş müzik kodları yazacaksın.

Sistem Sözdizimi (Syntax) Kuralları:
Format kalıbı daima [KOD]:[NOTA][OKTAV]-[ZAMAN] şeklindedir (Örn: CB:C2-0.0 ile kontrbas, kalın Do notasına sıfırıncı vuruşta başlar).
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

Enstrüman Sınıflandırması (Kullanabileceğin kodlar SADECE bunlardır — başka hiçbir kod kullanma):
BE (Bass Electric), BN (Bassoon), CE (Cello), CL (Clarinet), CB (Contrabass), FL (Flute), FH (French Horn), GA (Guitar Acoustic), GE (Guitar Electric), GN (Guitar Nylon), HM (Harmonium), HR (Harp), OR (Organ), SA (Saxophone), TR (Trombone), TP (Trumpet), TB (Tuba).
NOT: PI (Piyano), VI (Keman) ve XY (Ksilofon) kodları ARTIK MEVCUT DEĞİL — bunları asla kullanma, orkestral/telli/nefesli enstrümanlarla eşdeğer bir aranje kur.

MUTLAK ÇIKTI KURALLARI (ÇOK ÖNEMLİ — ASLA İHLAL ETME):
1. SADECE ve SADECE kod satırları yaz. Örnek çıktı formatı: CB:C2-0.0
2. "Bölüm 1", "Giriş", "Kısım 2", "(0.00 - 15.00 sn)" gibi HİÇBİR başlık, bölüm adı, zaman aralığı açıklaması veya alt başlık YAZMA.
3. "Tabii", "İşte kodun", "Umarım beğenirsin" gibi HİÇBİR giriş veya kapanış cümlesi YAZMA.
4. Markdown işareti (\`\`\`) KULLANMA.
5. Kod satırı olmayan HİÇBİR açıklama, yorum veya not YAZMA.
6. Cevabının İLK karakterinden İTİBAREN doğrudan kod satırlarıyla başla, SON karakterine kadar sadece kod satırı olsun.
7. AYNI enstrümanda AYNI notayı art arda 6'dan fazla tekrar ETME (monoton, sonsuz döngü YASAK) — müzik zaman içinde mutlaka gelişmeli, nota/akor değişmeli.
8. Kullanıcı açıkça uzun bir süre istemediği sürece, bestenin toplam uzunluğu yaklaşık 20-40 saniye (zaman değeri 0.0 ile 40.0 arası) civarında olmalı. Gereksiz yere uzatıp saniyelerce aynı şeyi tekrar eden çıktı üretme.`;

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
