// 4. MUSBİX Aİ MÜHƏRRİKİ
    els.gBtn.addEventListener("click", async () => {
      const userPrompt = els.pInp.value.trim();
      if (!userPrompt) return alert("Zəhmət olmasa bir təsvir daxil edin.");
      
      const t = translations[currentLang];
      els.gBtn.disabled = true; 
      els.gBtn.innerText = t.generatingBtn;
      els.pBtn.disabled = true;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userPrompt })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Server xətası baş verdi");

        let musbixCode = data.result;
        
        // AI-nin nə qaytardığını arxaplanda (F12) görmək üçün:
        console.log("DeepSeek-dən gələn xam cavab:\n", musbixCode);

        let charCount = musbixCode.length;
        let tokenCost = Math.ceil(charCount / 100) * 10;
        
        if (currentJeton < tokenCost) {
          throw new Error(`Kifayət qədər jetonunuz yoxdur. Bu musiqi üçün ${tokenCost} jeton lazımdır.`);
        }
        currentJeton = Math.max(0, currentJeton - tokenCost); 
        els.jNum.innerText = `${currentJeton} Jeton`;

        const lines = musbixCode.split('\n');
        const playData = [];
        const usedInstruments = new Set();

        lines.forEach(line => {
          // YENİ AĞILLI REGEX: Sətrin harasında olursa olsun, kodu tapıb çıxaracaq!
          const match = line.match(/([A-Z]{2})\s*:\s*([A-Za-z0-9#]+)\s*-\s*([0-9.]+)/);
          
          if (match) {
            const [, inst, note, time] = match;
            playData.push({ inst, note, time: parseFloat(time) });
            usedInstruments.add(inst);
          }
        });

        if (playData.length === 0) {
          throw new Error("AI düzgün formatda kod qaytarmadı. Zəhmət olmasa təsviri dəyişib yenidən yoxlayın.");
        }

        els.pStat.innerText = "Səs Alətləri Yüklənir...";

        const loadPromises = Array.from(usedInstruments).map(instCode => {
          return new Promise((resolve) => {
            if (!samplers[instCode]) {
              const baseNote = baseNotes[instCode] || "A5"; 
              samplers[instCode] = new Tone.Sampler({
                urls: { [baseNote]: `${instCode}.mp3` },
                baseUrl: `/samples/`,
                onload: resolve
              }).toDestination();
            } else {
              resolve(); 
            }
          });
        });

        await Promise.all(loadPromises);
        
        Tone.Transport.cancel();
        maxPlayTime = 0;
        
        playData.forEach(({ inst, note, time }) => {
          Tone.Transport.schedule((t) => {
            samplers[inst].triggerAttackRelease(note, "8n", t);
          }, "+" + time);
          if (time > maxPlayTime) maxPlayTime = time;
        });

        els.tTit.innerText = "Musbix Orijinal Bəstə"; 
        els.pStat.innerText = t.readyStatus;
        els.pBtn.disabled = false;

      } catch (err) {
        alert("Xəta: " + err.message);
        els.pStat.innerText = "Xəta baş verdi";
      } finally {
        els.gBtn.disabled = false; 
        els.gBtn.innerText = t.generateBtn;
      }
    });
