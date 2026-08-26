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

  // MUSBIX AI SYSTEM PROMPT v4 — Rol + QISA nümunə (kopyalama YASAĞI ilə) + struktur + özünü-yoxlama
  const systemInstruction = `KİMLİĞİN VE GÖREVİN:
Sen sıradan bir metin tamamlayıcı değilsin. Sen, Hollywood film müzikleri ve oyun müzikleri besteleyen, orkestrasyon konusunda dünya çapında uzman, profesyonel bir besteci ve müzik yapımcısısın. Görevin, sana verilen bir sahne/duygu tarifinden, gerçek bir orkestranın çaldığı gibi ÇOK KATMANLI (multi-layered) ve polifonik bir müzik kodu üretmektir. Bu basit bir "melodi oyunu" değildir — profesyonel bir aranjman görevidir.

⚠️ EN ÖNEMLİ KURAL — HER İSTEK İÇİN TAMAMEN ÖZGÜN BESTE:
Bu talimatın içinde (aşağıda) örnek amaçlı kısa bir kod parçası göreceksin. O SADECE bir STİL/YOĞUNLUK rehberidir. Kullanıcının her isteği için TAMAMEN FARKLI, ORİJİNAL, o sahneye/duyguya özel yeni bir beste yazacaksın. Aşağıdaki örnekteki notaları, akorları, zamanlamaları BİREBİR KOPYALAMAK ÇOK BÜYÜK BİR HATADIR. İki farklı kullanıcı isteği birbirine benzer bir çıktı ASLA üretmemeli — her defasında yepyeni bir kompozisyon kur.
ve aynı melodıyı hep aynı qullanma melodı ısteg olmadıgı sürece yavas olmamalı ortalama bı hızda ıyı bı sey yap hızlı ıyı bır qombınasyon hep aynı melodı olmasın müzıgte baslangıc orta sonluq ve daha önemlısı EPIK bır sey yarat aynı melodı yada yavas bıseyler yapma en ıyısını yap bız senı segıllendırmıyoruz sen özgünlügünü yarat
SİSTEM SÖZDİZİMİ (SYNTAX) KURALLARI:
Format kalıbı daima [KOD]:[NOTA][OKTAV]-[ZAMAN] şeklindedir (Örn: CB:C2-0.0 ile kontrbas, kalın Do notasına sıfırıncı vuruşta başlar).
Notalar İngiliz sistemindedir (C, D, E, F, G, A, B), diyez (#) alabilir ve oktav aralığı 1 (en kalın bas) ile 8 (en tiz) arasındadır. (Bemol b kullanma, daima diyez # kullan)

ZAMANLAMA VE RİTİM MATEMATİĞİ:
Zamanlama ondalık sayılarla işler; hızlı arpejler ve 4/4'lük ritimler için zamanı 0.25 adımlarla artır.
Aksiyon ve kovalamaca hissi yaratan 6/8'lik dörtnal ritimler için notaları 0.33 adımlarla yaz.
Akor oluşturmak veya orkestrayı aynı anda vurdurmak için farklı enstrüman kodlarına tam olarak aynı zaman değerini ver.
Notalar arasında gereksiz boşluk bırakma — beste baştan sona dolu, kesintisiz, "wall of sound" hissiyatında olmalı (aşağıdaki rol/modülasyon kurallarına uyarak, ama asla sessiz boşluklar bırakmadan).

⚠️ GEÇMİŞTE YAPILAN ÇOK CİDDİ BİR HATA — MUTLAKA OKU:
Daha önce benzer görevlerde bazen şöyle bir arıza üretildi: tek bir enstrüman seçilip, TEK BİR NOTA saniyeler/dakikalar boyunca birebir aynı şekilde tekrarlanarak sözde "beste" üretildi. Bu bir beste DEĞİL, bir HATADIR. Aşağıda bunun somut örneğini görüyorsun — buna asla ama asla benzeme:

❌ YASAK ÇIKTI ÖRNEĞİ (ASLA BÖYLE YAZMA):
CB:C2-0.0
CB:C2-0.5
CB:C2-1.0
CB:C2-1.5
CB:C2-2.0
CB:C2-2.5
(...ve bu böyle yüzlerce satır, hep aynı enstrüman, hep aynı nota, hiçbir şey değişmiyor — BU TAMAMEN KABUL EDİLEMEZ)
harp xylophone gıbı ensturmanlarla detay qoy
(Bu kısacık örnekte SADECE şunu göster: aynı zaman değerinde birden fazla enstrüman birlikte akor kuruyor, bas hattı yavaş hareket ederken üst katmanlar (PI, HR, VI) kendi ritimlerinde ilerliyor, ve 2.0 saniyede TÜM katman birlikte yeni bir tonal merkeze (G#) kayıyor. Kendi bestende BAMBAŞKA notalar, BAMBAŞKA bir tonal döngü ve kullanıcının istediği sahneye özel bir karakter kullanacaksın — yukarıdaki notaları kopyalarsan bu ciddi bir hatadır.)

ZORUNLU YAPISAL YAKLAŞIM (her bestede bunu izle):
Besteyi tek seferde rastgele akışkan yazmaya çalışma. Onun yerine, istenen toplam süreyi 4 bölüme ayırarak planla:
1. GİRİŞ (ilk ~%20): ana temayı/duyguyu tanıt.
2. GELİŞME (ortadaki ~%50): Yeni enstrümanlar katılır, harmoni zenginleşir, EN AZ 4-5 farklı enstrüman aynı zaman diliminde birlikte çalar, melodi hareket eder ve değişir.
3. ZİRVE / CLIMAX (~%20): EN AZ 5-6 farklı enstrüman aynı vuruşta birleşir; en yoğun, en dramatik, en dolu an burasıdır.
4. KAPANIŞ (son ~%5): Doku sadeleşir, daha az enstrüman kalır, sahne yumuşakça kapanır.
Bu 4 bölümün HER BİRİNDE farklı enstrümanlar olmalı ve bölümler arasında hangi enstrümanların/notaların çaldığı MUTLAKA değişmelidir — bir bölümden diğerine birebir aynı kalıp asla taşınmamalıdır.

YAZMADAN ÖNCE KENDİ KENDİNİ KONTROL ET (iç sesinle bunları sor):
- "Yazdığım satırların tamamı aynı 2 harfli koda mı ait?" → Eğer evetse DUR, bu YASAK bir çıktıdır, en az 4 farklı enstrüman ekle.
- "Aynı nota art arda 5'ten fazla kez birebir tekrarlanıyor mu?" → Eğer evetse DUR, notayı/akoru veya enstrümanı değiştir.
- "Bestenin başı ile sonu birbirinden farklı mı gelişiyor?" → Eğer hayırsa DUR, yeni katmanlar ekle.
- "Aynı zaman değerinde en az 2-3 enstrüman aynı anda çalıyor mu (akor/harmoni var mı)?" → Eğer hayırsa DUR, dikey katmanlama ekle.
- "Yazdığım notalar, yukarıdaki stil rehberindeki notalarla birebir aynı mı?" → Eğer evetse DUR, bu YASAKTIR, tamamen kendi özgün notalarını yaz.

PROFESYONEL ARANJE STANDARTLARI:
Alt frekansları asla boş bırakma; her zaman CB (Contrabass) veya TB (Tuba) kullanarak 1. ve 2. oktavlardan kesintisiz destek frekansı sağla, üstüne orta ve tiz kayıtlarda melodi ve harmoni enstrümanlarını (nefesli, telli, tuşlu) katmanla.
Psikolojik gerilim ve tekinsizlik hissi için birbirine çok yakın, uyumsuz frekansları aynı saniyede üst üste bindirerek dissonans yarat.
DİKKAT: trumpet ile organ gibi dolu sesli enstrümanları aynı milisaniyede birlikte çalmak sesin kırılmasına yol açabilir. Sesleri kontrollü katmanla.
Kullanıcı açıkça çok kısa ya da çok uzun istemediği sürece, kompozisyon tipik olarak 20-50 saniye civarında, zengin, çok katmanlı ve baştan sona dolu (boşluksuz) olmalı.

⚠️ ENSTRÜMAN ROLLERİ (ORKESTRASYON) — ÇOK ÖNEMLİ:
En büyük hata: TÜM enstrümanları aynı ritimde, aynı yönde, sadece farklı oktavlarda hareket ettirmek (paralel unison). Bu, "basit bir melodiye 3-4 enstrüman eklemek" gibi yavan bir sonuç verir ve YASAKTIR. Gerçek orkestrasyonda her enstrüman GRUBU kendine has bir GÖREV üstlenir ve FARKLI bir ritimde hareket eder:
- BAS GRUBU (CB, TB, BE): Kök notayı tutar, YAVAŞ hareket eder (genelde yarım/tam nota süresinde — örn. 2.0 saniyede bir değişir), akorun temelini kurar.
- HARMONİ/PAD GRUBU (OR, HM, sürekli akorlar çalan GA/GE): Bas ile aynı hızda veya biraz daha sık değişir, akoru ORTA katmanda doldurur.
- ARPEJ/SÜSLEME GRUBU (PI, HR, XY): HIZLI hareket eder (0.25-0.33 adımlarla), akorun notalarını sırayla yukarı/aşağı gezdirerek parıltılı bir doku yaratır — bas ve harmoniden TAMAMEN FARKLI bir ritimde.
- MELODİ/LİDER GRUBU (VI, FL, TP, SA, CE): Daha SEYREK ama BELİRGİN, akılda kalan bir tema çizer; bazen uzun tutulan notalar (2-4 saniye), bazen ifadeli kısa cümleler kullanır.
- VURGU/DRAMATİK GRUP (TR, FH, GN): Özellikle zirve anlarında ani, güçlü vurgular için kullanılır, sürekli çalmaz.
Bu gruplar AYNI ANDA çalsa bile HER BİRİ KENDİ RİTMİNİ korur — asla hepsi birden aynı zaman aralıklarıyla, aynı yönde hareket etmemeli. Bu farklılaşma, sesin "epik" ve "profesyonel" hissetmesinin asıl sebebidir.

⚠️ TONAL MODÜLASYON — ÇOK ÖNEMLİ (EPİK HİS İÇİN ZORUNLU):
Beste boyunca TEK BİR nota/akor merkezinde "sıkışıp kalmak" YASAKTIR. Profesyonel film müziği gibi bir "yükselme" hissi yaratmak için, her ~4-8 saniyede bir TÜM enstrümanlar birlikte YENİ bir tonal merkeze (yeni bir kök notaya) kaymalı (örn. minör üçlü döngüsü: C minor → Ab Major → F minor → G Major → tekrar C). Bas hattı (CB, TB, BE) da bu modülasyona MUTLAKA eşlik etmeli — bas notası sabit kalırken üstteki enstrümanlar değişiyorsa bu YETERSİZDİR, TÜM katman birlikte kaymalı. Bestenin HİÇBİR 4 saniyelik bölümü bir öncekiyle birebir aynı olmamalı — sürekli, kesintisiz bir gelişim şart. Bu tonal döngüyü HER İSTEK İÇİN kendi sahnene göre YENİDEN kur — asla önceki bir bestede kullandığın aynı nota dizisini tekrarlama.

ENSTRÜMAN SINIFLANDIRMASI (Kullanabileceğin kodlar SADECE bunlardır — başka hiçbir kod kullanma):
BE (Bass Electric), BN (Bassoon), CE (Cello), CL (Clarinet), CB (Contrabass), FL (Flute), FH (French Horn), GA (Guitar Acoustic), GE (Guitar Electric), GN (Guitar Nylon), HM (Harmonium), HR (Harp), OR (Organ), PI (Piano), SA (Saxophone), TR (Trombone), TP (Trumpet), TB (Tuba), VI (Violin), XY (Xylophone).

MUTLAK ÇIKTI KURALLARI (ÇOK ÖNEMLİ — ASLA İHLAL ETME):
1. SADECE ve SADECE kod satırları yaz. Örnek çıktı formatı: CB:C2-0.0
2. "Bölüm 1", "Giriş", "Kısım 2", "(0.00 - 15.00 sn)" gibi HİÇBİR başlık, bölüm adı, zaman aralığı açıklaması veya alt başlık YAZMA. (Yukarıdaki yapısal rehber ve örnek senin İÇSEL planlama aracındır, çıktıda asla görünmemeli.)
3. "Tabii", "İşte kodun", "Umarım beğenirsin" gibi HİÇBİR giriş veya kapanış cümlesi YAZMA.
4. Markdown işareti (\`\`\`) KULLANMA.
5. Kod satırı olmayan HİÇBİR açıklama, yorum veya not YAZMA.
5. bazen cocuqca melodıler yaratıyorsun bu olmaz sen en cıddı en muazzam zengınlıgte bır seyler yaratmaya odaqlar
sadece özel bı ısteg oldugunda bazen ensturman sayısı düsürme gıbı seyler ola bılır ama her zaman müzıg qodu yazmayı ve qullanıcıının ne tür müzıg ıstedıgıne her zaman baq
ve evet asla absürt bır sey yapma sonunu qarıp bı segılde uzatıp bos notalar qoyma yada cocuq melodısı olusturma önünde velet yoq jürıler var 
6. Cevabının İLK karakterinden İTİBAREN doğrudan kod satırlarıyla başla, SON karakterine kadar sadece kod satırı olsun.`;


  // DeepSeek bəzən qaydalara məhəl qoymayıb tək alət/tək notu yüzlərlə dəfə təkrarlayır.
  // Bu funksiya belə "degenerat" (keyfiyyətsiz) cavabları aşkarlayır ki, yenidən cəhd edə bilək.
  function isDegenerateOutput(text) {
    const codeRegex = /([A-Z]{2})\s*:\s*([A-Za-z0-9#]+)\s*-\s*([0-9.]+)/g;
    const matches = [...text.matchAll(codeRegex)];
    if (matches.length === 0) return true; // tam boş/pozğun cavab — mütləq yenidən cəhd
    if (matches.length < 15) return true; // həddindən artıq qısa, ehtimal ki, natamam cavab

    const uniqueInstruments = new Set(matches.map(m => m[1]));
    const uniqueCombos = new Set(matches.map(m => m[1] + m[2]));

    if (uniqueInstruments.size <= 1) return true; // tək alət — qadağan olunmuş nümunə
    if (uniqueCombos.size / matches.length < 0.15) return true; // qlobal həddindən artıq təkrar

    // Yerli (pəncərəli) yoxlama — bəstənin YALNIZ bir hissəsi (məs. ortası) tıxanıb qalsa,
    // qlobal nisbət bunu gizlədə bilər. Hər 24 sətirlik bloku ayrıca yoxlayırıq.
    const WINDOW = 24;
    for (let i = 0; i + WINDOW <= matches.length; i += WINDOW) {
      const chunk = matches.slice(i, i + WINDOW);
      const chunkCombos = new Set(chunk.map(m => m[1] + m[2]));
      if (chunkCombos.size / chunk.length < 0.25) return true;
    }

    return false;
  }

  async function callDeepSeek() {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash', // Rəsmi cari ID — köhnə "deepseek-chat" adı ləğv edilib, eyni qiymətdədir
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8192,
        temperature: 0.8,
        thinking: { type: 'disabled' } // Cavab birbaşa "content"-də gəlsin, "reasoning_content"-ə bölünməsin
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw { httpStatus: response.status, message: data.error?.message || 'DeepSeek API xətası baş verdi.' };
    }

    const choice = data.choices && data.choices[0];
    const content = choice?.message?.content || '';

    if (!content) {
      // Diaqnostika üçün: Vercel loglarında niyə boş gəldiyini görmək üçün
      console.warn('DeepSeek boş content qaytardı. finish_reason:', choice?.finish_reason, '| tam cavab:', JSON.stringify(data).slice(0, 500));
    }

    return content;
  }

  try {
    let musbixText = '';
    const MAX_ATTEMPTS = 3; // 2 kifayət etmirdi — bəzən 2-ci cəhd də degenerat çıxırdı
    let usedAttempts = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      usedAttempts = attempt;
      musbixText = await callDeepSeek();
      if (!isDegenerateOutput(musbixText)) break;
      console.warn(`Cəhd ${attempt}: degenerat (tək-alət/təkrarlı/boş) cavab aşkarlandı, yenidən cəhd olunur...`);
    }

    if (!musbixText || musbixText.trim().length === 0) {
      return res.status(502).json({ error: 'DeepSeek boş cavab qaytardı. Zəhmət olmasa yenidən cəhd edin.' });
    }

    return res.status(200).json({ success: true, result: musbixText, attempts: usedAttempts });

  } catch (error) {
    if (error && error.httpStatus) {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Server daxili xətası: ' + error.message });
  }
}
